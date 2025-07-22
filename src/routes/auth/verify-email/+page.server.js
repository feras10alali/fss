import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { error } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

export async function load({ url, params }) {
    // Get token from query parameter
    let token = url.searchParams.get('token');
    
    // If no token in query params, check if it's in the URL path (PocketBase default format)
    if (!token && params.token) {
        token = params.token;
    }
    
    // Also handle if the full path contains the token
    if (!token) {
        const pathname = url.pathname;
        const tokenMatch = pathname.match(/\/([^\/]+)$/);
        if (tokenMatch) {
            token = tokenMatch[1];
        }
    }
    
    if (!token) {
        return {
            success: false,
            message: 'Verification token is missing'
        };
    }
    
    try {
        const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
        
        // Confirm email verification
        await pb.collection('users').confirmVerification(token);
        
        console.log('🔍 EMAIL_VERIFY: Email verification successful');
        
        return {
            success: true,
            message: 'Email verified successfully!'
        };
        
    } catch (err) {
        console.error('🔍 EMAIL_VERIFY: Verification failed:', err);
        
        return {
            success: false,
            message: 'Email verification failed. The link may be expired or invalid.'
        };
    }
}