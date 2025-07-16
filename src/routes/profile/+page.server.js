import { redirect, fail } from '@sveltejs/kit';

export async function load({ locals }) {
    console.log('🔍 PROFILE: Load function called');
    console.log('🔍 PROFILE: User from locals:', locals.user ? 'Present' : 'Not present');
    
    // Check if user is authenticated (handled by hooks)
    if (!locals.user) {
        console.log('🔍 PROFILE: No user found, redirecting to login');
        throw redirect(302, '/login');
    }
    
    console.log('🔍 PROFILE: User authenticated:', locals.user.email);
    
    // Return user data (already processed by hooks)
    return {
        user: locals.user
    };
}

export const actions = {
    updateProfile: async ({ request, locals }) => {
        console.log('🔧 PROFILE: Update profile action called');
        
        // Check if user is authenticated
        if (!locals.user) {
            console.log('❌ PROFILE: No user found during update');
            throw redirect(302, '/login');
        }
        
        try {
            const formData = await request.formData();
            const field = formData.get('field');
            const value = formData.get('value');
            
            console.log('📝 PROFILE: Updating field:', field, 'with value:', value);
            
            // Validate field name to prevent unauthorized updates
            const allowedFields = ['name', 'email', 'phone', 'location', 'bio'];
            if (!allowedFields.includes(field)) {
                console.log('❌ PROFILE: Invalid field:', field);
                return fail(400, { 
                    error: 'Invalid field',
                    field,
                    message: 'Field not allowed for update'
                });
            }
            
            // Validate required fields
            if (field === 'email' && !value) {
                return fail(400, { 
                    error: 'Email is required',
                    field,
                    message: 'Email cannot be empty'
                });
            }
            
            // Email validation
            if (field === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return fail(400, { 
                        error: 'Invalid email format',
                        field,
                        message: 'Please enter a valid email address'
                    });
                }
            }
            
            // Phone validation (basic)
            if (field === 'phone' && value) {
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                    return fail(400, { 
                        error: 'Invalid phone format',
                        field,
                        message: 'Please enter a valid phone number'
                    });
                }
            }
            
            // Prepare update data
            const updateData = {
                [field]: value || '' // Handle empty values
            };
            
            // Update user in PocketBase
            const updatedUser = await locals.pb.collection('users').update(locals.user.id, updateData);
            
            console.log('✅ PROFILE: Profile updated successfully');
            
            // Update locals.user with new data
            locals.user = updatedUser;
            
            return {
                success: true,
                field,
                value: updatedUser[field],
                message: 'Profile updated successfully'
            };
            
        } catch (error) {
            console.error('❌ PROFILE: Update failed:', error);
            
            // Handle PocketBase specific errors
            if (error.status === 400) {
                const errorData = error.data || {};
                
                // Handle validation errors
                if (errorData.data) {
                    const firstError = Object.values(errorData.data)[0];
                    return fail(400, {
                        error: 'Validation error',
                        message: firstError.message || 'Invalid input data'
                    });
                }
                
                // Handle duplicate email error
                if (errorData.message && errorData.message.includes('email')) {
                    return fail(400, {
                        error: 'Email already exists',
                        field: 'email',
                        message: 'This email is already registered'
                    });
                }
            }
            
            // Handle network/server errors
            if (error.status >= 500) {
                return fail(500, {
                    error: 'Server error',
                    message: 'Unable to update profile. Please try again later.'
                });
            }
            
            // Generic error handling
            return fail(400, {
                error: 'Update failed',
                message: error.message || 'Failed to update profile'
            });
        }
    },
    
    updateAvatar: async ({ request, locals }) => {
        console.log('🖼️ PROFILE: Update avatar action called');
        
        // Check if user is authenticated
        if (!locals.user) {
            console.log('❌ PROFILE: No user found during avatar update');
            throw redirect(302, '/login');
        }
        
        try {
            const formData = await request.formData();
            const avatar = formData.get('avatar');
            
            // Validate file
            if (!avatar || avatar.size === 0) {
                return fail(400, {
                    error: 'No file selected',
                    message: 'Please select an image file'
                });
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(avatar.type)) {
                return fail(400, {
                    error: 'Invalid file type',
                    message: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
                });
            }
            
            // Validate file size (5MB limit)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (avatar.size > maxSize) {
                return fail(400, {
                    error: 'File too large',
                    message: 'Image must be less than 5MB'
                });
            }
            
            // Prepare FormData for PocketBase
            const updateFormData = new FormData();
            updateFormData.append('avatar', avatar);
            
            // Update user avatar in PocketBase
            const updatedUser = await locals.pb.collection('users').update(locals.user.id, updateFormData);
            
            console.log('✅ PROFILE: Avatar updated successfully');
            
            // Update locals.user with new data
            locals.user = updatedUser;
            
            return {
                success: true,
                message: 'Avatar updated successfully',
                avatarUrl: updatedUser.avatar ? locals.pb.files.getUrl(updatedUser, updatedUser.avatar) : null
            };
            
        } catch (error) {
            console.error('❌ PROFILE: Avatar update failed:', error);
            
            return fail(500, {
                error: 'Avatar update failed',
                message: error.message || 'Failed to update avatar'
            });
        }
    }
};