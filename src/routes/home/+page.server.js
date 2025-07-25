import { redirect, error } from '@sveltejs/kit';

export async function load({ locals }) {
  console.log('🔍 DASHBOARD: Load function called');
  console.log('🔍 DASHBOARD: User from locals:', locals.user ? 'Present' : 'Not present');
  
  // Check if user is authenticated (handled by hooks)
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  console.log('🔍 DASHBOARD: User authenticated:', locals.user.email, 'ID:', locals.user.id);
  
  try {
    if (!locals.pb.authStore.isValid) {
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
    console.log('✅ DASHBOARD: Favorites count:', favorites.items.length);
    
    return {
      files: files.items,
      folders: folders.items,
      recentActivity: recentActivity.items,
      favorites: favorites.items.map(f => f.resource_id),
      storageUsed: parseFloat(storageUsed),
      storageTotal: 500,
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

      console.log('🔍 CREATE_FOLDER: Form data received:', {
        name: folderName,
        parent_folder: parentFolder,
        formDataEntries: Array.from(data.entries())
      });

      if (!folderName) {
        return {
          type: 'error',
          error: 'Folder name is required'
        };
      }

      // Validate parent folder belongs to user if provided
      if (parentFolder) {
        try {
          const parentFolderRecord = await locals.pb.collection('folders').getOne(parentFolder);
          if (parentFolderRecord.owner !== locals.user.id) {
            return {
              type: 'error',
              error: 'Invalid parent folder'
            };
          }
        } catch (parentError) {
          console.error('❌ CREATE_FOLDER: Parent folder validation error:', parentError);
          return {
            type: 'error',
            error: 'Invalid parent folder'
          };
        }
      }

      console.log('🔍 CREATE_FOLDER: Creating folder:', {
        name: folderName,
        owner: locals.user.id,
        parent_folder: parentFolder,
        authUserId: locals.pb.authStore.model?.id
      });

      const folderData = {
        name: folderName,
        owner: locals.user.id,
        is_deleted: false
      };

      // Only add parent_folder if it's not null/empty
      if (parentFolder && parentFolder.trim() !== '') {
        folderData.parent_folder = parentFolder;
      }

      const newFolder = await locals.pb.collection('folders').create(folderData);

      console.log('✅ CREATE_FOLDER: Folder created successfully:', {
        id: newFolder.id,
        name: newFolder.name,
        parent_folder: newFolder.parent_folder
      });

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
        type: 'success',
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
        type: 'error',
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

      console.log('🔍 UPLOAD_FILE: Form data received:', {
        fileName: file?.name,
        fileSize: file?.size,
        parent_folder: parentFolder,
        formDataEntries: Array.from(data.entries())
      });

      if (!file || file.size === 0) {
        return {
          type: 'error',
          error: 'File is required'
        };
      }

      // Validate parent folder belongs to user if provided
      if (parentFolder) {
        try {
          const parentFolderRecord = await locals.pb.collection('folders').getOne(parentFolder);
          if (parentFolderRecord.owner !== locals.user.id) {
            return {
              type: 'error',
              error: 'Invalid parent folder'
            };
          }
        } catch (parentError) {
          console.error('❌ UPLOAD_FILE: Parent folder validation error:', parentError);
          return {
            type: 'error',
            error: 'Invalid parent folder'
          };
        }
      }

      console.log('🔍 UPLOAD_FILE: Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        owner: locals.user.id,
        parent_folder: parentFolder,
        authUserId: locals.pb.authStore.model?.id
      });

      const fileData = {
        name: file.name,
        file: file,
        size: file.size,
        mime_type: file.type || 'application/octet-stream',
        owner: locals.user.id,
        is_deleted: false
      };

      // Only add parent_folder if it's not null/empty
      if (parentFolder && parentFolder.trim() !== '') {
        fileData.parent_folder = parentFolder;
      }

      const newFile = await locals.pb.collection('files').create(fileData);

      console.log('✅ UPLOAD_FILE: File uploaded successfully:', {
        id: newFile.id,
        name: newFile.name,
        parent_folder: newFile.parent_folder
      });

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
        type: 'success',
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
        type: 'error',
        error: error.message || 'Failed to upload file'
      };
    }
  },

  toggleFavorite: async ({ request, locals }) => {
    console.log('🔍 TOGGLE_FAVORITE: Action called');
    
    if (!locals.user) {
      console.log('❌ TOGGLE_FAVORITE: No user found');
      return {
        type: 'error',
        error: 'Authentication required'
      };
    }

    if (!locals.pb.authStore.isValid) {
      console.log('❌ TOGGLE_FAVORITE: Invalid auth store');
      return {
        type: 'error',
        error: 'Authentication required'
      };
    }

    try {
      const data = await request.formData();
      const resourceId = data.get('resource_id');
      const resourceType = data.get('resource_type');
      const action = data.get('action'); // 'add' or 'remove'

      console.log('🔍 TOGGLE_FAVORITE: Form data received:', {
        resource_id: resourceId,
        resource_type: resourceType,
        action: action,
        user: locals.user.id
      });

      if (!resourceId || !resourceType || !action) {
        return {
          type: 'error',
          error: 'Missing required parameters'
        };
      }

      if (action === 'add') {
        // Add to favorites
        const newFavorite = await locals.pb.collection('favorites').create({
          user: locals.user.id,
          resource_id: resourceId,
          resource_type: resourceType
        });

        console.log('✅ TOGGLE_FAVORITE: Added to favorites:', newFavorite.id);

        return {
          type: 'success',
          action: 'added',
          favorite: newFavorite
        };
      } else if (action === 'remove') {
        // Remove from favorites
        try {
          const favorite = await locals.pb.collection('favorites').getFirstListItem(
            `user = "${locals.user.id}" && resource_id = "${resourceId}" && resource_type = "${resourceType}"`
          );
          
          await locals.pb.collection('favorites').delete(favorite.id);
          
          console.log('✅ TOGGLE_FAVORITE: Removed from favorites:', favorite.id);

          return {
            type: 'success',
            action: 'removed'
          };
        } catch (findError) {
          console.log('⚠️ TOGGLE_FAVORITE: Favorite not found, considering it already removed');
          return {
            type: 'success',
            action: 'removed'
          };
        }
      } else {
        return {
          type: 'error',
          error: 'Invalid action'
        };
      }

    } catch (error) {
      console.error('❌ TOGGLE_FAVORITE: Error:', error);
      console.error('❌ TOGGLE_FAVORITE: Error details:', {
        status: error.status,
        message: error.message,
        response: error.response
      });

      return {
        type: 'error',
        error: error.message || 'Failed to toggle favorite'
      };
    }
  },
  shareResource: async ({ request, locals }) => {
    console.log('🔍 SHARE_RESOURCE: Action called');
    
    if (!locals.user) {
      console.log('❌ SHARE_RESOURCE: No user found');
      return {
        type: 'error',
        error: 'Authentication required'
      };
    }

    if (!locals.pb.authStore.isValid) {
      console.log('❌ SHARE_RESOURCE: Invalid auth store');
      return {
        type: 'error',
        error: 'Authentication required'
      };
    }

    try {
      const data = await request.formData();
      const resourceId = data.get('resource_id');
      const resourceType = data.get('resource_type');
      const sharedWithEmail = data.get('shared_with_email');
      const permission = data.get('permission') || 'view';
      const message = data.get('message') || '';
      const expiresAt = data.get('expires_at') || null;

      console.log('🔍 SHARE_RESOURCE: Form data received:', {
        resource_id: resourceId,
        resource_type: resourceType,
        shared_with_email: sharedWithEmail,
        permission: permission,
        expires_at: expiresAt
      });

      // Validate required fields
      if (!resourceId || !resourceType || !sharedWithEmail) {
        return {
          type: 'error',
          error: 'Missing required fields'
        };
      }

      // Validate resource belongs to user
      const collection = resourceType === 'folder' ? 'folders' : 'files';
      try {
        const resource = await locals.pb.collection(collection).getOne(resourceId);
        if (resource.owner !== locals.user.id) {
          return {
            type: 'error',
            error: 'You can only share your own items'
          };
        }
      } catch (resourceError) {
        console.error('❌ SHARE_RESOURCE: Resource validation error:', resourceError);
        return {
          type: 'error',
          error: 'Resource not found'
        };
      }

      // Check if user exists by email - REQUIRED since shared_with is a relation
      let sharedWithUser = null;
      try {
        console.log('🔍 SHARE_RESOURCE: Searching for user with email:', sharedWithEmail);
        
        // Try different query formats
        sharedWithUser = await locals.pb.collection('users').getFirstListItem(
          `email="${sharedWithEmail}"`
        );
        
        console.log('✅ SHARE_RESOURCE: Found user:', {
          id: sharedWithUser.id,
          email: sharedWithUser.email,
          name: sharedWithUser.name
        });
        
      } catch (userError) {
        console.log('❌ SHARE_RESOURCE: User lookup failed:', userError);
        console.log('❌ SHARE_RESOURCE: Error details:', {
          status: userError.status,
          message: userError.message,
          response: userError.response
        });
        
        // Try alternative query without spaces
        try {
          console.log('🔍 SHARE_RESOURCE: Trying alternative query format...');
          sharedWithUser = await locals.pb.collection('users').getList(1, 1, {
            filter: `email="${sharedWithEmail}"`
          });
          
          if (sharedWithUser.items && sharedWithUser.items.length > 0) {
            sharedWithUser = sharedWithUser.items[0];
            console.log('✅ SHARE_RESOURCE: Found user with alternative method:', {
              id: sharedWithUser.id,
              email: sharedWithUser.email
            });
          } else {
            throw new Error('No user found with alternative method');
          }
          
        } catch (altError) {
          console.log('❌ SHARE_RESOURCE: Alternative query also failed:', altError);
          
          // Let's also try to list all users to see the structure
          try {
            const allUsers = await locals.pb.collection('users').getList(1, 5);
            console.log('🔍 SHARE_RESOURCE: Sample users for debugging:', 
              allUsers.items.map(u => ({
                id: u.id,
                email: u.email,
                username: u.username
              }))
            );
          } catch (listError) {
            console.log('❌ SHARE_RESOURCE: Could not list users:', listError);
          }
          
          return {
            type: 'error',
            error: 'User with this email address not found. They need to register first.'
          };
        }
      }

      // Check if already shared with this user
      try {
        const existingShare = await locals.pb.collection('shares').getFirstListItem(
          `resource_id = "${resourceId}" && resource_type = "${resourceType}" && shared_with = "${sharedWithUser.id}"`
        );
        
        // Update existing share
        const updatedShare = await locals.pb.collection('shares').update(existingShare.id, {
          permission: permission,
          message: message,
          expires_at: expiresAt,
          is_active: true
        });

        console.log('✅ SHARE_RESOURCE: Updated existing share:', updatedShare.id);

        return {
          type: 'success',
          message: 'Share updated successfully',
          share: updatedShare
        };

      } catch (existingError) {
        // No existing share, create new one
        console.log('🔍 SHARE_RESOURCE: Creating new share');
      }

      // Create new share record
      const shareData = {
        owner: locals.user.id,
        resource_id: resourceId,
        resource_type: resourceType,
        shared_with: sharedWithUser.id, // Use the user ID for the relation
        permission: permission,
        message: message,
        is_active: true
      };

      // Add expiry date if provided
      if (expiresAt) {
        shareData.expires_at = expiresAt;
      }

      const newShare = await locals.pb.collection('shares').create(shareData);

      console.log('✅ SHARE_RESOURCE: Share created successfully:', {
        id: newShare.id,
        resource_id: resourceId,
        shared_with_email: sharedWithEmail,
        permission: permission
      });

      // Add to recent activity
      try {
        await locals.pb.collection('recent_activity').create({
          user: locals.user.id,
          action: 'share',
          resource_type: resourceType,
          resource_id: resourceId,
          resource_name: `Shared with ${sharedWithEmail}`
        });
      } catch (activityError) {
        console.warn('⚠️ SHARE_RESOURCE: Failed to create activity log:', activityError);
      }

      // TODO: Send email notification to shared user
      // You can implement email sending here if needed

      return {
        type: 'success',
        message: 'Item shared successfully',
        share: newShare
      };

    } catch (error) {
      console.error('❌ SHARE_RESOURCE: Error:', error);
      console.error('❌ SHARE_RESOURCE: Error details:', {
        status: error.status,
        message: error.message,
        response: error.response
      });

      return {
        type: 'error',
        error: error.message || 'Failed to share item'
      };
    }
  }
  
};