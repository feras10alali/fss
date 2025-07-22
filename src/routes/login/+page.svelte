<script>
	import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-svelte';
	import logo from '$lib/images/Blogo.webp';
	import Tlogo from '$lib/images/BTlogo.webp';

	// Form data
	let formData = {
		email: '',
		password: ''
	};

	// UI state
	let showPassword = false;
	let isLoading = false;
	let errors = {};
	let successMessage = '';

	// Form validation
	$: isFormValid = formData.email.trim() !== '' && 
					 formData.password.length >= 1 &&
					 isValidEmail(formData.email);

	// Email validation
	function isValidEmail(email) {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return emailRegex.test(email);
	}

	// Real-time validation
	function validateField(field, value) {
		errors[field] = '';
		
		switch (field) {
			case 'email':
				if (!value.trim()) {
					errors[field] = 'Email is required';
				} else if (!isValidEmail(value)) {
					errors[field] = 'Please enter a valid email address';
				}
				break;
			
			case 'password':
				if (!value) {
					errors[field] = 'Password is required';
				}
				break;
		}
		
		errors = { ...errors };
	}

	// Handle form submission
	const handleSubmit = async (event) => {
		event.preventDefault();

		// Validate form before submission
		if (!isFormValid) {
			return;
		}

		isLoading = true;
		errors = {};
		successMessage = '';

		try {
			const res = await fetch('/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					email: formData.email.toLowerCase().trim(), 
					password: formData.password.trim() 
				})
			});

			const data = await res.json();

			if (res.ok) {
				successMessage = 'Login successful! Redirecting...';
				// Small delay to show success message
				setTimeout(() => {
					window.location.href = '/home';
				}, 1000);
			} else {
				errors.general = data.error || 'Login failed';
			}
		} catch (error) {
			console.error('Login error:', error);
			errors.general = 'Network error. Please try again.';
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="bg-gray-300 min-h-screen flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-2xl" style="max-width: 32rem;">

		<!-- Login Form -->
		<div class="bg-white rounded-2xl shadow-xl p-8">
			<div class="text-center mb-8">
				<div class="flex content-center mx-auto w-38 mb-4 center">
					<img src={logo} alt="Logo" class="w-48 object-contain" />
				</div>
				<div class="flex text-center items-center justify-center">
					<h1 class="text-4xl">welcome back to</h1>
					<img src={Tlogo} alt="text logo" class="h-8 mb-0 mt-2 ml-2.5">
				</div>
			</div>

			<!-- Success Message -->
			{#if successMessage}
				<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
					<div class="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
					<p class="text-green-800 text-sm">{successMessage}</p>
				</div>
			{/if}

			<!-- General Error -->
			{#if errors.general}
				<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
					<AlertCircle size={20} class="text-red-600 flex-shrink-0" />
					<p class="text-red-800 text-sm">{errors.general}</p>
				</div>
			{/if}

			<form on:submit={handleSubmit} class="space-y-6">
				
				<!-- Email Field -->
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
						<Mail size={16} class="text-gray-600" />
						Email Address
					</label>
					<div class="relative">
						<input
							id="email"
							name="email"
							type="email"
							bind:value={formData.email}
							on:blur={() => validateField('email', formData.email)}
							on:input={() => errors.email = ''}
							placeholder="Enter your email"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {errors.email ? 'border-red-500' : ''}"
							disabled={isLoading}
						/>
					</div>
					{#if errors.email}
						<p class="mt-1 text-sm text-red-600">{errors.email}</p>
					{/if}
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
						<Lock size={16} class="text-gray-600" />
						Password
					</label>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={formData.password}
							on:blur={() => validateField('password', formData.password)}
							on:input={() => errors.password = ''}
							placeholder="Enter your password"
							class="w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {errors.password ? 'border-red-500' : ''}"
							disabled={isLoading}
						/>
						<button
							type="button"
							on:click={() => showPassword = !showPassword}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
							disabled={isLoading}
						>
							{#if showPassword}
								<EyeOff size={20} />
							{:else}
								<Eye size={20} />
							{/if}
						</button>
					</div>
					{#if errors.password}
						<p class="mt-1 text-sm text-red-600">{errors.password}</p>
					{/if}
				</div>

				<!-- Forgot Password -->
				<div class="text-right">
					<a href="/forgot-password" class="text-sm text-blue-600 hover:text-blue-700 transition-colors">
						Forgot your password?
					</a>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={!isFormValid || isLoading}
					class="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if isLoading}
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
						Signing In...
					{:else}
						<LogIn size={20} />
						Sign In
					{/if}
				</button>
			</form>

			<!-- Register Link -->
			<div class="mt-6 text-center">
				<p class="text-gray-600">
					Don't have an account?
					<a href="/register" class="text-blue-600 hover:text-blue-700 font-medium">
						Register here
					</a>
				</p>
			</div>
		</div>

		<!-- Terms and Privacy -->
		<div class="mt-6 text-center">
			<p class="text-xs text-gray-500">
				By signing in, you agree to our
				<a href="/terms" class="text-blue-600 hover:text-blue-700">Terms of Service</a>
				and
				<a href="/privacy" class="text-blue-600 hover:text-blue-700">Privacy Policy</a>
			</p>
		</div>
	</div>
</div>