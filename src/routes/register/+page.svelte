<script>
	import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import logo from '$lib/images/OBlogo.webp';
	import Tlogo from '$lib/images/BTlogo.webp'
	
	export let form;
	
	// Form data
	let formData = {
		name: form?.data?.name || '',
		email: form?.data?.email || '',
		password: '',
		confirmPassword: ''
	};
	
	// UI state
	let showPassword = false;
	let showConfirmPassword = false;
	let isLoading = false;
	let errors = form?.errors || {};
	let successMessage = '';
	
	// Password strength indicator
	$: passwordStrength = checkPasswordStrength(formData.password);
	
	// Form validation
	$: isFormValid = formData.name.trim() !== '' && 
					 formData.email.trim() !== '' && 
					 formData.password.length >= 8 && 
					 formData.password === formData.confirmPassword &&
					 isValidEmail(formData.email);
	
	// Email validation
	function isValidEmail(email) {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return emailRegex.test(email);
	}
	
	// Password strength checker
	function checkPasswordStrength(password) {
		if (!password) return { score: 0, text: '', color: '' };
		
		let score = 0;
		let feedback = [];
		
		if (password.length >= 8) score += 1;
		else feedback.push('At least 8 characters');
		
		if (/[a-z]/.test(password)) score += 1;
		else feedback.push('Lowercase letter');
		
		if (/[A-Z]/.test(password)) score += 1;
		else feedback.push('Uppercase letter');
		
		if (/[0-9]/.test(password)) score += 1;
		else feedback.push('Number');
		
		if (/[^A-Za-z0-9]/.test(password)) score += 1;
		else feedback.push('Special character');
		
		const strength = {
			0: { text: 'Very Weak', color: 'bg-red-500' },
			1: { text: 'Weak', color: 'bg-red-400' },
			2: { text: 'Fair', color: 'bg-yellow-400' },
			3: { text: 'Good', color: 'bg-blue-400' },
			4: { text: 'Strong', color: 'bg-green-400' },
			5: { text: 'Very Strong', color: 'bg-green-500' }
		};
		
		return {
			score,
			text: strength[score].text,
			color: strength[score].color,
			feedback: feedback
		};
	}
	
	// Real-time validation
	function validateField(field, value) {
		errors[field] = '';
		
		switch (field) {
			case 'name':
				if (!value.trim()) {
					errors[field] = 'Name is required';
				} else if (value.trim().length < 2) {
					errors[field] = 'Name must be at least 2 characters';
				}
				break;
			
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
				} else if (value.length < 8) {
					errors[field] = 'Password must be at least 8 characters';
				}
				break;
			
			case 'confirmPassword':
				if (!value) {
					errors[field] = 'Please confirm your password';
				} else if (value !== formData.password) {
					errors[field] = 'Passwords do not match';
				}
				break;
		}
		
		errors = { ...errors };
	}
	
	
	
	// Update errors when form changes
	$: if (form?.errors) {
		errors = form.errors;
	}
</script>

<div class="bg-gray-300 min-h-screen flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-2xl" style="max-width: 32rem;">

		<!-- Registration Form -->
		<div class="bg-white rounded-2xl shadow-xl p-8">
            <div class="text-center mb-8">
                <div class="flex content-center mx-auto w-38 mb-4 center">
                    <img src={logo} alt="Logo" class="w-48 object-contain" />
                </div>
				<div class="flex text-center items-center justify-center">
					<h1 class="text-4xl">welcome to</h1>
					<img src={Tlogo} alt="text logo" class="h-8 mb-0 mt-2 ml-2.5">
				</div>
			</div>
			
			<!-- Success Message -->
			{#if successMessage}
				<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
					<CheckCircle size={20} class="text-green-600 flex-shrink-0" />
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
			
			<form 
				method="POST" 
				class="space-y-6"
				use:enhance={({ cancel }) => {
					// Validate before submission
					if (!isFormValid) {
						cancel();
						return;
					}
					
					isLoading = true;
					errors = {}; // Clear errors on submission
					successMessage = '';
					
					return async ({ result, update }) => {
						isLoading = false;
						
						// Remove the success handling since server will redirect
						if (result.type === 'failure') {
							errors = result.data?.errors || {};
							successMessage = '';
						}
						
						await update();
					};
				}}
			>
				
				<!-- Name Field -->
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
						<User size={16} class="text-gray-600" />
						First Name
					</label>
					<div class="relative">
						<input
							id="name"
							name="name"
							type="text"
							bind:value={formData.name}
							on:blur={() => validateField('name', formData.name)}
							on:input={() => errors.name = ''}
							placeholder="Enter your First name"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {errors.name ? 'border-red-500' : ''}"
							disabled={isLoading}
						/>
					</div>
					{#if errors.name}
						<p class="mt-1 text-sm text-red-600">{errors.name}</p>
					{/if}
				</div>
				
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
							placeholder="Create a strong password"
							class="w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {errors.password ? 'border-red-500' : ''}"
							disabled={isLoading}
						/>
						<button
							type="button"
							on:click={() => showPassword = !showPassword}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
						>
							{#if showPassword}
								<EyeOff size={20} />
							{:else}
								<Eye size={20} />
							{/if}
						</button>
					</div>
					
					<!-- Password Strength Indicator -->
					{#if formData.password}
						<div class="mt-2">
							<div class="flex items-center gap-2 mb-1">
								<div class="flex-1 bg-gray-200 rounded-full h-2">
									<div class="h-2 rounded-full transition-all duration-300 {passwordStrength.color}" style="width: {(passwordStrength.score / 5) * 100}%"></div>
								</div>
								<span class="text-xs text-gray-600">{passwordStrength.text}</span>
							</div>
							{#if passwordStrength.feedback.length > 0}
								<p class="text-xs text-gray-500">
									Missing: {passwordStrength.feedback.join(', ')}
								</p>
							{/if}
						</div>
					{/if}
					
					{#if errors.password}
						<p class="mt-1 text-sm text-red-600">{errors.password}</p>
					{/if}
				</div>
				
				<!-- Confirm Password Field -->
				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
						<Lock size={16} class="text-gray-600" />
						Confirm Password
					</label>
					<div class="relative">
						<input
							id="confirmPassword"
							name="passwordConfirm"
							type={showConfirmPassword ? 'text' : 'password'}
							bind:value={formData.confirmPassword}
							on:blur={() => validateField('confirmPassword', formData.confirmPassword)}
							on:input={() => errors.confirmPassword = ''}
							placeholder="Confirm your password"
							class="w-full px-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {errors.confirmPassword ? 'border-red-500' : ''}"
							disabled={isLoading}
						/>
						<button
							type="button"
							on:click={() => showConfirmPassword = !showConfirmPassword}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
						>
							{#if showConfirmPassword}
								<EyeOff size={20} />
							{:else}
								<Eye size={20} />
							{/if}
						</button>
					</div>
					{#if errors.confirmPassword}
						<p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
					{/if}
				</div>
				
				<!-- Submit Button -->
				<button
					type="submit"
					disabled={!isFormValid || isLoading}
					class="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if isLoading}
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
						Creating Account...
					{:else}
						<UserPlus size={20} />
						Create Account
					{/if}
				</button>
			</form>
			
			<!-- Login Link -->
			<div class="mt-6 text-center">
				<p class="text-gray-600">
					Already have an account?
					<a href="/login" class="text-blue-600 hover:text-blue-700 font-medium">
						Sign in here
					</a>
				</p>
			</div>
		</div>
		
		<!-- Terms and Privacy -->
		<div class="mt-6 text-center">
			<p class="text-xs text-gray-500">
				By creating an account, you agree to our
				<a href="/terms" class="text-blue-600 hover:text-blue-700">Terms of Service</a>
				and
				<a href="/privacy" class="text-blue-600 hover:text-blue-700">Privacy Policy</a>
			</p>
		</div>
	</div>
</div>