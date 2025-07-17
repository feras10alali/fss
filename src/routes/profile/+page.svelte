<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Edit3, Save, X, User, Mail, Phone, MapPin, Upload, Check, AlertCircle, Plus } from 'lucide-svelte';
	
	export let data; // Data passed from server (contains user)
	export let form; // Form data from actions
	
	// Extract user from data with fallback
	$: user = data?.user || {};
	
	// Create display name with fallback
	$: displayName = user?.name || user?.username || user?.email || 'User';
	
	// Handle profile image with fallback
	$: profileImageUrl = user?.avatar ? data.pb?.files?.getUrl(user, user.avatar) : null;
	
	// Editable fields state
	let editingFields = {};
	let formData = {
		name: user?.name || '',
		email: user?.email || '',
		phone: user?.phone || '',
		location: user?.location || '',
		bio: user?.bio || ''
	};
	
	// Loading states
	let loadingFields = {};
	let showMessage = false;
	let messageType = 'success'; // 'success' | 'error'
	let message = '';
	
	// File input reference
	let fileInput;
	let avatarLoading = false;
	
	// Reactive statement to update formData when user changes
	$: if (user) {
		formData = {
			name: user.name || '',
			email: user.email || '',
			phone: user.phone || '',
			location: user.location || '',
			bio: user.bio || ''
		};
	}
	
	// Handle form results
	$: if (form) {
		if (form.success) {
			showSuccessMessage(form.message || 'Profile updated successfully');
			// Exit edit mode for the updated field
			if (form.field) {
				editingFields[form.field] = false;
				editingFields = { ...editingFields };
			}
		} else if (form.error) {
			showErrorMessage(form.message || 'Failed to update profile');
		}
		loadingFields = {};
		avatarLoading = false;
	}
	
	// Toggle edit mode for specific field
	function toggleEdit(fieldName) {
		if (editingFields[fieldName]) {
			// Save the field
			saveField(fieldName);
		} else {
			// Enter edit mode
			editingFields[fieldName] = true;
			editingFields = { ...editingFields };
		}
	}
	
	// Cancel editing
	function cancelEdit(fieldName) {
		editingFields[fieldName] = false;
		editingFields = { ...editingFields };
		// Reset form data to original value
		formData[fieldName] = user[fieldName] || '';
	}
	
	// Save field using form action
	function saveField(fieldName) {
		loadingFields[fieldName] = true;
		loadingFields = { ...loadingFields };
		
		// Create form and submit
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/updateProfile';
		
		const fieldInput = document.createElement('input');
		fieldInput.type = 'hidden';
		fieldInput.name = 'field';
		fieldInput.value = fieldName;
		
		const valueInput = document.createElement('input');
		valueInput.type = 'hidden';
		valueInput.name = 'value';
		valueInput.value = formData[fieldName];
		
		form.appendChild(fieldInput);
		form.appendChild(valueInput);
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	}
	
	// Handle avatar upload
	function handleAvatarUpload() {
		fileInput.click();
	}
	
	function handleAvatarChange(event) {
		const file = event.target.files[0];
		if (file) {
			avatarLoading = true;
			
			// Create form and submit
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/updateAvatar';
			form.enctype = 'multipart/form-data';
			
			const fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.name = 'avatar';
			fileInput.files = event.target.files;
			
			form.appendChild(fileInput);
			document.body.appendChild(form);
			form.submit();
			document.body.removeChild(form);
		}
	}
	
	// Handle form submission for bio (textarea)
	function handleKeydown(event, fieldName) {
		if (event.key === 'Enter' && !event.shiftKey && fieldName !== 'bio') {
			event.preventDefault();
			toggleEdit(fieldName);
		} else if (event.key === 'Escape') {
			cancelEdit(fieldName);
		}
	}
	
	// Message handling
	function showSuccessMessage(msg) {
		message = msg;
		messageType = 'success';
		showMessage = true;
		setTimeout(() => {
			showMessage = false;
		}, 5000);
	}
	
	function showErrorMessage(msg) {
		message = msg;
		messageType = 'error';
		showMessage = true;
		setTimeout(() => {
			showMessage = false;
		}, 5000);
	}
	
	// Helper function to check if field is empty
	function isFieldEmpty(fieldName) {
		const value = user[fieldName];
		return !value || value.trim() === '';
	}
</script>

<div class="min-h-screen bg-gray-300 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
			<p class="text-gray-600">Manage your account information</p>
		</div>
		
		<!-- Success/Error Message - Bottom Right Notification -->
		{#if showMessage}
			<div class="fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-out {showMessage ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}">
				<div class="max-w-sm p-4 rounded-lg shadow-lg border flex items-center gap-3 {messageType === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}">
					{#if messageType === 'success'}
						<Check size={16} class="flex-shrink-0" />
					{:else}
						<AlertCircle size={16} class="flex-shrink-0" />
					{/if}
					<span class="flex-1 text-sm font-medium">{message}</span>
					<button 
						on:click={() => showMessage = false} 
						class="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
					>
						<X size={16} />
					</button>
				</div>
			</div>
		{/if}
		
		<!-- Loading State -->
		{#if !user || !user.id}
			<div class="bg-white rounded-2xl shadow-xl p-8 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p class="text-gray-600">Loading profile...</p>
			</div>
		{:else}
		<!-- Profile Card -->
		<div class="bg-white rounded-2xl shadow-xl overflow-hidden">
			<!-- Header Section -->
			<div class="bg-black px-8 py-12 text-white relative">
				<div class="flex flex-col items-center">
					<!-- Profile Image -->
					<div class="relative mb-4">
						{#if profileImageUrl}
							<img src={profileImageUrl} alt="Profile Picture" class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
						{:else}
							<div class="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white shadow-lg flex items-center justify-center">
								<span class="text-4xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
							</div>
						{/if}
						<!-- Edit Profile Picture Button -->
						<button 
							on:click={handleAvatarUpload}
							disabled={avatarLoading}
							class="absolute bottom-2 right-2 bg-white text-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
						>
							{#if avatarLoading}
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
							{:else if profileImageUrl}
								<Edit3 size={16} />
							{:else}
								<Upload size={16} />
							{/if}
						</button>
					</div>
					
					<h2 class="text-2xl font-bold mb-1">{displayName}</h2>
					<p class="text-blue-100">Member since {user.created ? new Date(user.created).toLocaleDateString() : 'Unknown'}</p>
				</div>
			</div>
			
			<!-- Form Section -->
			<div class="px-8 py-8">
				<div class="space-y-6">
					
					<!-- Name Field -->
					<div class="group">
						<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
							<User size={16} />
							Full Name
						</label>
						<div class="relative">
							<input
								type="text"
								bind:value={formData.name}
								disabled={!editingFields.name}
								placeholder="Enter your full name"
								class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-700 transition-colors"
								on:keydown={(e) => handleKeydown(e, 'name')}
							/>
							<div class="absolute inset-y-0 right-0 flex items-center pr-3">
								{#if loadingFields.name}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
								{:else if editingFields.name}
									<div class="flex gap-1">
										<button
											on:click={() => toggleEdit('name')}
											class="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
											title="Save"
										>
											<Save size={16} />
										</button>
										<button
											on:click={() => cancelEdit('name')}
											class="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
											title="Cancel"
										>
											<X size={16} />
										</button>
									</div>
								{:else}
									<button
										on:click={() => toggleEdit('name')}
										class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
										title="Edit"
									>
										{#if isFieldEmpty('name')}
											<Plus size={16} />
										{:else}
											<Edit3 size={16} />
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Email Field -->
					<div class="group">
						<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
							<Mail size={16} />
							Email Address
						</label>
						<div class="relative">
							<input
								type="email"
								bind:value={formData.email}
								disabled={!editingFields.email}
								placeholder="Enter your email"
								class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-700 transition-colors"
								on:keydown={(e) => handleKeydown(e, 'email')}
							/>
							<div class="absolute inset-y-0 right-0 flex items-center pr-3">
								{#if loadingFields.email}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
								{:else if editingFields.email}
									<div class="flex gap-1">
										<button
											on:click={() => toggleEdit('email')}
											class="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
											title="Save"
										>
											<Save size={16} />
										</button>
										<button
											on:click={() => cancelEdit('email')}
											class="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
											title="Cancel"
										>
											<X size={16} />
										</button>
									</div>
								{:else}
									<button
										on:click={() => toggleEdit('email')}
										class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
										title="Edit"
									>
										{#if isFieldEmpty('email')}
											<Plus size={16} />
										{:else}
											<Edit3 size={16} />
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Phone Field -->
					<div class="group">
						<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
							<Phone size={16} />
							Phone Number
						</label>
						<div class="relative">
							<input
								type="tel"
								bind:value={formData.phone}
								disabled={!editingFields.phone}
								placeholder="Enter your phone number"
								class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-700 transition-colors"
								on:keydown={(e) => handleKeydown(e, 'phone')}
							/>
							<div class="absolute inset-y-0 right-0 flex items-center pr-3">
								{#if loadingFields.phone}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
								{:else if editingFields.phone}
									<div class="flex gap-1">
										<button
											on:click={() => toggleEdit('phone')}
											class="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
											title="Save"
										>
											<Save size={16} />
										</button>
										<button
											on:click={() => cancelEdit('phone')}
											class="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
											title="Cancel"
										>
											<X size={16} />
										</button>
									</div>
								{:else}
									<button
										on:click={() => toggleEdit('phone')}
										class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
										title="Edit"
									>
										{#if isFieldEmpty('phone')}
											<Plus size={16} />
										{:else}
											<Edit3 size={16} />
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Location Field -->
					<div class="group">
						<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
							<MapPin size={16} />
							Location
						</label>
						<div class="relative">
							<input
								type="text"
								bind:value={formData.location}
								disabled={!editingFields.location}
								placeholder="Enter your location"
								class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-700 transition-colors"
								on:keydown={(e) => handleKeydown(e, 'location')}
							/>
							<div class="absolute inset-y-0 right-0 flex items-center pr-3">
								{#if loadingFields.location}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
								{:else if editingFields.location}
									<div class="flex gap-1">
										<button
											on:click={() => toggleEdit('location')}
											class="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
											title="Save"
										>
											<Save size={16} />
										</button>
										<button
											on:click={() => cancelEdit('location')}
											class="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
											title="Cancel"
										>
											<X size={16} />
										</button>
									</div>
								{:else}
									<button
										on:click={() => toggleEdit('location')}
										class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
										title="Edit"
									>
										{#if isFieldEmpty('location')}
											<Plus size={16} />
										{:else}
											<Edit3 size={16} />
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Bio Field -->
					<div class="group">
						<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
							<User size={16} />
							Bio
						</label>
						<div class="relative">
							<textarea
								bind:value={formData.bio}
								disabled={!editingFields.bio}
								placeholder="Tell us about yourself..."
								rows="4"
								class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-700 transition-colors resize-none"
								on:keydown={(e) => handleKeydown(e, 'bio')}
							></textarea>
							<div class="absolute top-3 right-3">
								{#if loadingFields.bio}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
								{:else if editingFields.bio}
									<div class="flex gap-1">
										<button
											on:click={() => toggleEdit('bio')}
											class="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
											title="Save"
										>
											<Save size={16} />
										</button>
										<button
											on:click={() => cancelEdit('bio')}
											class="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
											title="Cancel"
										>
											<X size={16} />
										</button>
									</div>
								{:else}
									<button
										on:click={() => toggleEdit('bio')}
										class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
										title="Edit"
									>
										{#if isFieldEmpty('bio')}
											<Plus size={16} />
										{:else}
											<Edit3 size={16} />
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- User Info (Read-only) -->
					<div class="bg-gray-50 rounded-lg p-4 space-y-2">
						<h3 class="font-medium text-gray-900 mb-3">Account Information</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<span class="text-gray-500">User ID:</span>
								<span class="ml-2 font-mono text-gray-700">{user.id}</span>
							</div>
							<div>
								<span class="text-gray-500">Member since:</span>
								<span class="ml-2 text-gray-700">{user.created ? new Date(user.created).toLocaleDateString() : 'Unknown'}</span>
							</div>
						</div>
					</div>
					
				</div>
			</div>
		</div>
		{/if}
	</div>
</div>

<!-- Hidden file input for avatar upload -->
<input 
	bind:this={fileInput}
	type="file" 
	accept="image/*" 
	on:change={handleAvatarChange}
	class="hidden"
/>