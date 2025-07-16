import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const handle = async ({ event, resolve }) => {
    console.log('🔍 HOOKS: Starting handle function for:', event.url.pathname);
    
    // Initialize PocketBase client
    const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
    
    // Get the auth cookie
    const authCookie = event.cookies.get('pb_auth');
    console.log('🔍 HOOKS: Auth cookie present:', !!authCookie);
    console.log('🔍 HOOKS: Auth cookie value:', authCookie);
    
    // Attach PocketBase instance to locals
    event.locals.pb = pb;
    event.locals.user = null;
    
    // Check if auth cookie exists
    if (authCookie) {
        console.log('🔍 HOOKS: Auth cookie found, parsing...');
        
        try {
            // Parse the cookie to extract token and model
            const cookieParts = authCookie.split('; ');
            let token = '';
            let model = null;
            
            for (const part of cookieParts) {
                if (part.startsWith('pb_auth=')) {
                    token = part.replace('pb_auth=', '');
                } else if (part.startsWith('model=')) {
                    model = JSON.parse(part.replace('model=', ''));
                }
            }
            
            console.log('🔍 HOOKS: Parsed token:', !!token);
            console.log('🔍 HOOKS: Parsed model:', !!model);
            
            if (token && model) {
                // Set the auth store
                pb.authStore.save(token, model);
                console.log('🔍 HOOKS: Auth store loaded - isValid:', pb.authStore.isValid);
                
                if (pb.authStore.isValid) {
                    try {
                        // Verify the token is still valid by refreshing
                        await pb.collection('users').authRefresh();
                        
                        // Get fresh user data
                        const user = await pb.collection('users').getOne(pb.authStore.model.id, {
                            fields: 'id,name,username,avatar,email'
                        });
                        
                        event.locals.user = {
                            id: user.id,
                            name: user.name,
                            username: user.username,
                            profileImage: user.avatar,
                            email: user.email
                        };
                        
                        console.log('🔍 HOOKS: User loaded successfully:', event.locals.user.email);
                    } catch (err) {
                        console.error('🔍 HOOKS: Error refreshing auth:', err.message);
                        // Clear invalid auth
                        pb.authStore.clear();
                        event.locals.user = null;
                        // Clear the invalid cookie
                        event.cookies.delete('pb_auth', { path: '/' });
                    }
                }
            }
        } catch (err) {
            console.error('🔍 HOOKS: Error parsing cookie:', err.message);
            // Clear invalid cookie
            event.cookies.delete('pb_auth', { path: '/' });
        }
    } else {
        console.log('🔍 HOOKS: No auth cookie found');
    }
    
    console.log('🔍 HOOKS: Final user state:', event.locals.user ? 'Authenticated' : 'Not authenticated');
    
    const response = await resolve(event);
    
    return response;
};