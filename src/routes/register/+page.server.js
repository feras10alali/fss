import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { fail, redirect } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

export const actions = {
	default: async ({ request, cookies }) => {
		console.log('🔍 REGISTER: POST request received');
		
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const passwordConfirm = data.get('passwordConfirm');

		// Ensure all fields are present and properly formatted
		const trimmedName = name?.toString().trim();
		const trimmedEmail = email?.toString().toLowerCase().trim();
		const trimmedPassword = password?.toString().trim();
		const trimmedPasswordConfirm = passwordConfirm?.toString().trim();

		// Server-side validation
		const errors = {};

		// Validate name
		if (!trimmedName || trimmedName.length < 2) {
			errors.name = 'Name must be at least 2 characters long';
		}

		// Validate email
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
			errors.email = 'Please enter a valid email address';
		}

		// Validate password
		if (!trimmedPassword || trimmedPassword.length < 8) {
			errors.password = 'Password must be at least 8 characters long';
		}

		// Validate password confirmation
		if (!trimmedPasswordConfirm || trimmedPassword !== trimmedPasswordConfirm) {
			errors.confirmPassword = 'Passwords do not match';
		}

		// If there are validation errors, return them
		if (Object.keys(errors).length > 0) {
			console.log('🔍 REGISTER: Validation errors:', errors);
			return fail(400, {
				errors,
				data: {
					name: trimmedName || '',
					email: trimmedEmail || ''
				}
			});
		}

		try {
			// Create a new PocketBase instance for registration
			const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
			
			console.log('🔍 REGISTER: Attempting to create user:', trimmedEmail);
			
			// Create user in PocketBase with email verification
			const userData = {
				name: trimmedName,
				email: trimmedEmail,
				password: trimmedPassword,
				passwordConfirm: trimmedPasswordConfirm,
				emailVisibility: true
			};

			const newUser = await pb.collection('users').create(userData);
			console.log('🔍 REGISTER: User created successfully:', newUser.id);

			// Send email verification
			try {
				await pb.collection('users').requestVerification(trimmedEmail);
				console.log('🔍 REGISTER: Verification email sent to:', trimmedEmail);
			} catch (verificationError) {
				console.error('🔍 REGISTER: Failed to send verification email:', verificationError);
				// Continue with registration even if email verification fails
			}

			// Auto-login after successful registration
			console.log('🔍 REGISTER: Attempting auto-login for:', trimmedEmail);
			const authData = await pb.collection('users').authWithPassword(trimmedEmail, trimmedPassword);
			
			console.log('🔍 REGISTER: Auto-login successful');
			console.log('🔍 REGISTER: Auth token:', pb.authStore.token);

			// Set the auth cookie properly using the same format as your login
			const authCookieValue = `${pb.authStore.token}; model=${JSON.stringify(pb.authStore.model)}`;

			cookies.set('pb_auth', authCookieValue, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			console.log('🔍 REGISTER: Auth cookie set successfully');

			// Redirect to /home instead of /profile
			throw redirect(302, '/home');

		} catch (error) {
			// Handle redirect separately (it's not an actual error)
			if (error.status === 302) {
				throw error;
			}

			console.error('🔍 REGISTER: Registration/login failed:', error);
			
			// Handle PocketBase validation errors
			if (error.response?.data) {
				const pbErrors = {};
				Object.keys(error.response.data).forEach(field => {
					if (error.response.data[field].message) {
						pbErrors[field] = error.response.data[field].message;
					}
				});
				
				if (Object.keys(pbErrors).length > 0) {
					return fail(400, {
						errors: pbErrors,
						data: {
							name: trimmedName || '',
							email: trimmedEmail || ''
						}
					});
				}
			}
			
			// Return a more specific error message
			let errorMessage = 'Registration failed. Please try again.';
			if (error.message) {
				errorMessage = error.message;
			}
			
			return fail(400, {
				errors: { general: errorMessage },
				data: {
					name: trimmedName || '',
					email: trimmedEmail || ''
				}
			});
		}
	}
};