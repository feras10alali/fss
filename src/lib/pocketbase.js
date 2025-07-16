import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { browser } from '$app/environment';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Create a writable store for the user
export const user = writable(null);

// Only set up the store listener on the client side
if (browser) {
    // Initialize the store with the current auth state
    user.set(pb.authStore.model);
    
    // Listen for auth changes and update the store
    pb.authStore.onChange(() => {
        user.set(pb.authStore.model);
    });
}