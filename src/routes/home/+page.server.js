import { redirect, error } from '@sveltejs/kit';

export async function load({ locals }) {
  console.log('🔍 DASHBOARD: Load function called');
  console.log('🔍 DASHBOARD: User from locals:', locals.user ? 'Present' : 'Not present');
  
  // Check if user is authenticated (handled by hooks)
  if (!locals.user) {
    console.log('🔍 DASHBOARD: No user found, redirecting to login');
    throw redirect(302, '/login');
  }
  
  console.log('🔍 DASHBOARD: User authenticated:', locals.user.email);
  
  try {
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
    
    // Handle specific PocketBase errors
    if (err.status === 403) {
      throw error(403, 'Access denied');
    }
    
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