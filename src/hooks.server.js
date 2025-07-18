import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const handle = async ({ event, resolve }) => {
    
    const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
    
    const authCookie = event.cookies.get('pb_auth');
    
    event.locals.pb = pb;
    event.locals.user = null;
    
    if (authCookie) {
        
        try {
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
            
            
            if (token && model) {
                pb.authStore.save(token, model);
                
                if (pb.authStore.isValid) {
                    try {
                        await pb.collection('users').authRefresh();
                        
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
                        
                    } catch (err) {
                        pb.authStore.clear();
                        event.locals.user = null;
                        event.cookies.delete('pb_auth', { path: '/' });
                    }
                }
            }
        } catch (err) {
            event.cookies.delete('pb_auth', { path: '/' });
        }
    } else {
    }
    
    
    const response = await resolve(event);
    
    return response;
};