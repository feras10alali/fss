<script>
    import { onMount } from 'svelte';
    
    let email = '';
    let password = '';
    let remember = false;
    let isPasswordVisible = false;
    let isSubmitting = false;
    let submitStatus = 'idle'; // 'idle', 'loading', 'success', 'error'
    
    // Toggle password visibility
    function togglePassword() {
        isPasswordVisible = !isPasswordVisible;
    }
    
    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        isSubmitting = true;
        submitStatus = 'loading';
        
        try {
            console.log('Sign in attempt:', { email, password, remember });
            
            // Simulate API call - replace with your PocketBase integration
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Example PocketBase integration:
            /*
            import PocketBase from 'pocketbase';
            const pb = new PocketBase('your-pocketbase-url');
            const authData = await pb.collection('users').authWithPassword(email, password);
            console.log('Signed in successfully:', authData);
            // Redirect to dashboard or handle success
            */
            
            submitStatus = 'success';
            
        } catch (error) {
            console.error('Sign in failed:', error);
            submitStatus = 'error';
            
            // Reset after 3 seconds
            setTimeout(() => {
                submitStatus = 'idle';
                isSubmitting = false;
            }, 3000);
        }
    }
    
    // Initialize Lucide icons after component mounts
    onMount(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
</script>

<svelte:head>
    <title>Sign In</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 py-6">
        <div class="max-w-md mx-auto">
            <div class="text-center">
                <h1 class="text-2xl font-semibold text-gray-900">Sign In</h1>
                <p class="text-gray-500 mt-1">Welcome back to your account</p>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-md mx-auto px-4 py-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden fade-in">
            <!-- Sign In Header -->
            <div class="sign-in-card px-8 py-12 text-center relative">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                <div class="relative">
                    <!-- Logo/Icon -->
                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-semibold mx-auto mb-4 backdrop-blur-sm">
                        <i data-lucide="lock" class="w-8 h-8"></i>
                    </div>
                    
                    <!-- Welcome Text -->
                    <h2 class="text-2xl font-semibold text-white">Welcome Back</h2>
                    <p class="text-gray-300 mt-1">Please sign in to continue</p>
                </div>
            </div>

            <!-- Form Section -->
            <div class="px-8 py-8">
                <form on:submit={handleSubmit} class="space-y-6">
                    <!-- Email Address -->
                    <div class="space-y-2">
                        <label class="flex items-center text-sm font-medium text-gray-700">
                            <i data-lucide="mail" class="w-4 h-4 mr-2 text-gray-500"></i>
                            Email Address
                        </label>
                        <div class="relative">
                            <input 
                                type="email" 
                                bind:value={email}
                                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none input-focus bg-gray-50"
                                placeholder="Enter your email"
                                required
                            >
                        </div>
                    </div>

                    <!-- Password -->
                    <div class="space-y-2">
                        <label class="flex items-center text-sm font-medium text-gray-700">
                            <i data-lucide="lock" class="w-4 h-4 mr-2 text-gray-500"></i>
                            Password
                        </label>
                        <div class="relative">
                            <input 
                                type={isPasswordVisible ? 'text' : 'password'}
                                bind:value={password}
                                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none input-focus bg-gray-50 pr-12"
                                placeholder="Enter your password"
                                required
                            >
                            <button 
                                type="button" 
                                on:click={togglePassword}
                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i data-lucide={isPasswordVisible ? 'eye-off' : 'eye'} class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Remember Me & Forgot Password -->
                    <div class="flex items-center justify-between">
                        <label class="flex items-center">
                            <input 
                                type="checkbox" 
                                bind:checked={remember}
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            >
                            <span class="ml-2 text-sm text-gray-600">Remember me</span>
                        </label>
                        <a href="/forgot-password" class="text-sm text-blue-600 hover:text-blue-500 transition-colors">
                            Forgot password?
                        </a>
                    </div>

                    <!-- Sign In Button -->
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        class="w-full font-medium py-3 px-4 rounded-lg transition-colors btn-hover focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        class:bg-gray-900={submitStatus === 'idle'}
                        class:hover:bg-gray-800={submitStatus === 'idle'}
                        class:text-white={submitStatus === 'idle'}
                        class:bg-green-600={submitStatus === 'success'}
                        class:hover:bg-green-700={submitStatus === 'success'}
                        class:text-white={submitStatus === 'success'}
                        class:bg-red-600={submitStatus === 'error'}
                        class:hover:bg-red-700={submitStatus === 'error'}
                        class:text-white={submitStatus === 'error'}
                        class:opacity-75={isSubmitting}
                    >
                        {#if submitStatus === 'loading'}
                            <span class="flex items-center justify-center">
                                <i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i>
                                Signing in...
                            </span>
                        {:else if submitStatus === 'success'}
                            <span class="flex items-center justify-center">
                                <i data-lucide="check" class="w-4 h-4 mr-2"></i>
                                Success!
                            </span>
                        {:else if submitStatus === 'error'}
                            <span class="flex items-center justify-center">
                                <i data-lucide="alert-circle" class="w-4 h-4 mr-2"></i>
                                Try again
                            </span>
                        {:else}
                            <span class="flex items-center justify-center">
                                <i data-lucide="log-in" class="w-4 h-4 mr-2"></i>
                                Sign In
                            </span>
                        {/if}
                    </button>

                    <!-- Divider -->
                    <div class="relative my-6">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-200"></div>
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <!-- Social Login -->
                    <div class="grid grid-cols-2 gap-3">
                        <button 
                            type="button" 
                            class="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors btn-hover focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            <i data-lucide="github" class="w-4 h-4 mr-2"></i>
                            <span class="text-sm font-medium text-gray-700">GitHub</span>
                        </button>
                        <button 
                            type="button" 
                            class="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors btn-hover focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            <i data-lucide="chrome" class="w-4 h-4 mr-2"></i>
                            <span class="text-sm font-medium text-gray-700">Google</span>
                        </button>
                    </div>
                </form>

                <!-- Sign Up Link -->
                <div class="mt-8 text-center">
                    <p class="text-sm text-gray-600">
                        Don't have an account? 
                        <a href="/signup" class="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                            Sign up
                        </a>
                    </p>
                </div>
            </div>
        </div>

        <!-- Additional Links -->
        <div class="text-center mt-6 space-y-2">
            <p class="text-xs text-gray-500">
                By signing in, you agree to our 
                <a href="/terms" class="text-blue-600 hover:text-blue-500">Terms of Service</a> 
                and 
                <a href="/privacy" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>
            </p>
        </div>
    </div>
</div>

<style>
    :global(body) { 
        font-family: 'Inter', sans-serif; 
    }
    
    :global(.input-focus) {
        transition: all 0.2s ease;
    }
    
    :global(.input-focus:focus) {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
    }
    
    :global(.btn-hover) {
        transition: all 0.2s ease;
    }
    
    :global(.btn-hover:hover) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    :global(.fade-in) {
        animation: fadeIn 0.6s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .sign-in-card {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    }
</style>