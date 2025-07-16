declare global {
    namespace App {
        interface Locals {
            pb: import('pocketbase').default;
            user: {
                id: string;
                name: string;
                email: string;
                profileImage?: string;
            } | null;
        }
    }
}