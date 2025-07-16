import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export async function POST({ cookies }) {
    console.log('🔍 LOGOUT: POST request received');
    
    try {
        // Create PocketBase instance and clear auth
        const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
        pb.authStore.clear();
        
        // Clear the auth cookie
        cookies.delete('pb_auth', {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: false
        });
        
        console.log('🔍 LOGOUT: User logged out successfully');
        
        return json({ success: true });
    } catch (err) {
        console.error('🔍 LOGOUT: Error during logout:', err.message);
        return json({ error: 'خطأ في تسجيل الخروج' }, { status: 500 });
    }
}