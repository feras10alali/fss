import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export async function POST({ request, cookies }) {
    console.log('🔍 LOGIN: POST request received');
    
    const { email, password } = await request.json();
    
    // Ensure email and password are present and properly formatted
    const trimmedEmail = email?.toLowerCase().trim();
    const trimmedPassword = password?.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
        console.log('🔍 LOGIN: Missing email or password');
        return json({ error: 'يرجى تعبئة جميع الحقول' }, { status: 400 });
    }
    
    try {
        // Create a new PocketBase instance for login
        const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
        
        console.log('🔍 LOGIN: Attempting authentication for:', trimmedEmail);
        const authData = await pb.collection('users').authWithPassword(trimmedEmail, trimmedPassword);
        
        console.log('🔍 LOGIN: Authentication successful');
        console.log('🔍 LOGIN: Auth token:', pb.authStore.token);
        
        // Create the auth cookie string manually
        const authCookie = `pb_auth=${pb.authStore.token}; model=${JSON.stringify(pb.authStore.model)}`;
        
        // Set the cookie
        cookies.set('pb_auth', authCookie, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: false,
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });
        
        console.log('🔍 LOGIN: Auth cookie set:', authCookie);
        
        return json({ 
            success: true,
            user: {
                id: authData.record.id,
                name: authData.record.name,
                email: authData.record.email,
                profileImage: authData.record.profileImage
            }
        });
    } catch (err) {
        console.error('🔍 LOGIN: Authentication failed:', err?.response?.message || err.message);
        return json({ error: 'credentials are wrong' }, { status: 401 });
    }
}