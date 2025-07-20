import { redirect, error } from '@sveltejs/kit';

export async function load({ locals }) {
  console.log('🔍 DASHBOARD: Load function called');
  console.log('🔍 DASHBOARD: User from locals:', locals.user ? 'Present' : 'Not present');
  
  // Check if user is authenticated (handled by hooks)
  if (!locals.user) {
    console.log('🔍 DASHBOARD: No user found, redirecting to login');
    throw redirect(302, '/login');
  }
  
  console.log('🔍 DASHBOARD: User authenticated:', locals.user.email, 'ID:', locals.user.id);
  
  try {
    // Ensure PocketBase has the correct auth context
    if (!locals.pb.authStore.isValid) {
      console.log('🔍 DASHBOARD: PocketBase auth store is invalid, redirecting to login');
      throw redirect(302, '/login');
    }
    
    // Verify the auth store has the correct user
    if (locals.pb.authStore.model?.id !== locals.user.id) {
      console.log('🔍 DASHBOARD: Auth store user mismatch, refreshing auth');
      // Try to refresh the auth store
      try {
        await locals.pb.collection('users').authRefresh();
      } catch (refreshError) {
        console.error('❌ DASHBOARD: Failed to refresh auth:', refreshError);
        throw redirect(302, '/login');
      }
    }
    
    console.log('🔍 DASHBOARD: PocketBase auth model:', locals.pb.authStore.model?.id);
    
    // Fetch user's files
    const files = await locals.pb.collection('files').getList(1, 50, {
      filter: `owner = "${locals.user.id}" && is_deleted = false`,
      sort: '-updated',
      expand: 'parent_folder'
    });
    
    // Fetch user's folders  
    const folders = await locals.pb.collection('folders').getList(1, 50, {
      filter: `owner = "${locals.user.id}" && is_deleted = false`,
      sort: '-updated',
      expand: 'parent_folder'
    });
    
    // Fetch recent activity
    const recentActivity = await locals.pb.collection('recent_activity').getList(1, 10, {
      filter: `user = "${locals.user.id}"`,
      sort: '-created'
    });
    
    // Fetch user's favorites
    const favorites = await locals.pb.collection('favorites').getList(1, 50, {
      filter: `user = "${locals.user.id}"`,
      sort: '-created'
    });
    
    // Calculate storage usage (basic approximation)
    const totalSize = files.items.reduce((sum, file) => sum + (file.size || 0), 0);
    const storageUsed = (totalSize / (1024 * 1024 * 1024)).toFixed(2); // Convert to GB
    
    console.log('✅ DASHBOARD: Data loaded successfully');
    console.log('✅ DASHBOARD: Files count:', files.items.length);
    console.log('✅ DASHBOARD: Folders count:', folders.items.length);
    
    return {
      files: files.items,
      folders: folders.items,
      recentActivity: recentActivity.items,
      favorites: favorites.items.map(f => f.resource_id),
      storageUsed: parseFloat(storageUsed),
      storageTotal: 15, // Default 15GB limit
      user: locals.user
    };
    
  } catch (err) {
    console.error('❌ DASHBOARD: Error loading data:', err);
    console.error('❌ DASHBOARD: Error details:', {
      status: err.status,
      message: err.message,
      response: err.response
    });
    
    // Handle authentication errors
    if (err.status === 401 || err.status === 403) {
      console.log('🔍 DASHBOARD: Authentication error, redirecting to login');
      throw redirect(302, '/login');
    }
    
    // Handle specific PocketBase errors
    if (err.status === 404) {
      throw error(404, 'Resource not found');
    }
    
    // Handle network/server errors
    if (err.status >= 500) {
      throw error(500, 'Server error: Unable to load data');
    }
    
    // Generic error handling
    throw error(500, 'Failed to load data');
  }
}

// Add server-side actions for file operations
export const actions = {
  createFolder: async ({ request, locals }) => {
    console.log('🔍 CREATE_FOLDER: Action called');
    
    if (!locals.user) {
      console.log('❌ CREATE_FOLDER: No user found');
      throw redirect(302, '/login');
    }

    if (!locals.pb.authStore.isValid) {
      console.log('❌ CREATE_FOLDER: Invalid auth store');
      throw redirect(302, '/login');
    }

    try {
      const data = await request.formData();
      const folderName = data.get('name');
      const parentFolder = data.get('parent_folder') || null;

      if (!folderName) {
        return {
          success: false,
          error: 'Folder name is required'
        };
      }

      console.log('🔍 CREATE_FOLDER: Creating folder:', {
        name: folderName,
        owner: locals.user.id,
        parent_folder: parentFolder,
        authUserId: locals.pb.authStore.model?.id
      });

      const newFolder = await locals.pb.collection('folders').create({
        name: folderName,
        owner: locals.user.id,
        parent_folder: parentFolder,
        is_deleted: false
      });

      console.log('✅ CREATE_FOLDER: Folder created successfully:', newFolder.id);

      // Add to recent activity
      try {
        await locals.pb.collection('recent_activity').create({
          user: locals.user.id,
          action: 'create_folder',
          resource_type: 'folder',
          resource_id: newFolder.id,
          resource_name: folderName
        });
      } catch (activityError) {
        console.warn('⚠️ CREATE_FOLDER: Failed to create activity log:', activityError);
      }

      return {
        success: true,
        folder: newFolder
      };

    } catch (error) {
      console.error('❌ CREATE_FOLDER: Error:', error);
      console.error('❌ CREATE_FOLDER: Error details:', {
        status: error.status,
        message: error.message,
        response: error.response
      });

      return {
        success: false,
        error: error.message || 'Failed to create folder'
      };
    }
  },

  uploadFile: async ({ request, locals }) => {
    console.log('🔍 UPLOAD_FILE: Action called');
    
    if (!locals.user) {
      console.log('❌ UPLOAD_FILE: No user found');
      throw redirect(302, '/login');
    }

    if (!locals.pb.authStore.isValid) {
      console.log('❌ UPLOAD_FILE: Invalid auth store');
      throw redirect(302, '/login');
    }

    try {
      const data = await request.formData();
      const file = data.get('file');
      const parentFolder = data.get('parent_folder') || null;

      if (!file || file.size === 0) {
        return {
          success: false,
          error: 'File is required'
        };
      }

      console.log('🔍 UPLOAD_FILE: Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        owner: locals.user.id,
        parent_folder: parentFolder,
        authUserId: locals.pb.authStore.model?.id
      });

      const newFile = await locals.pb.collection('files').create({
        name: file.name,
        file: file,
        size: file.size,
        mime_type: file.type || 'application/octet-stream',
        owner: locals.user.id,
        parent_folder: parentFolder,
        is_deleted: false
      });

      console.log('✅ UPLOAD_FILE: File uploaded successfully:', newFile.id);

      // Add to recent activity
      try {
        await locals.pb.collection('recent_activity').create({
          user: locals.user.id,
          action: 'upload',
          resource_type: 'file',
          resource_id: newFile.id,
          resource_name: file.name
        });
      } catch (activityError) {
        console.warn('⚠️ UPLOAD_FILE: Failed to create activity log:', activityError);
      }

      return {
        success: true,
        file: newFile
      };

    } catch (error) {
      console.error('❌ UPLOAD_FILE: Error:', error);
      console.error('❌ UPLOAD_FILE: Error details:', {
        status: error.status,
        message: error.message,
        response: error.response
      });

      return {
        success: false,
        error: error.message || 'Failed to upload file'
      };
    }
  }
};