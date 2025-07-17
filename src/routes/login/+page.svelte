<script>
	import logo from '$lib/images/Blogo.webp';
	let email = '';
	let password = '';
	let showPassword = false;
	let error = '';

	const handleSubmit = async (event) => {
		event.preventDefault();

		const res = await fetch('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		const data = await res.json();

		if (res.ok) {
			window.location.href = '/profile'; // Redirect on success
		} else {
			error = data.error;
		}
	};
</script>

<div class="w-screen h-screen flex justify-center items-center p-4 bg-gray-300">
	<div class="w-full max-w-lg bg-[#ffffff] shadow-xl rounded-2xl p-8">
		<form on:submit|preventDefault={handleSubmit} class="flex flex-col items-center w-full space-y-5">
			<!-- Logo -->
			<div class="w-48 mb-2 flex justify-center">
				<img src={logo} alt="Logo" class="h-[50%] object-contain" />
			</div>

			<!-- Title -->
			<h2 class="text-2xl font-semibold text-black">Login to Your Account</h2>

			<!-- Email Field -->
			<div class="relative w-full">
				<input 
					bind:value={email}
					id="email"
					name="email"
					type="email"
					required
					placeholder=" "
					class="peer block w-full p-3 pt-5 text-sm bg-transparent border border-black rounded-xl text-black placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
				/>
				<label 
					for="email"
					class="absolute start-3 top-1 text-sm text-black bg-[#ffffff] px-1 transition-all scale-75 -translate-y-3 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-black peer-focus:scale-75 peer-focus:-translate-y-5"
				>
					Email Address
				</label>
			</div>

			<!-- Password Field -->
			<div class="relative w-full">
				<button
					type="button"
					on:click={() => showPassword = !showPassword}
					class="absolute inset-y-0 right-0 flex items-center px-3 text-black hover:text-gray-700 transition-all"
					aria-label="Toggle password visibility"
				>
					{#if showPassword}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
							<path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
						</svg>
					{:else}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path d="M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 21 12c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
						</svg>
					{/if}
				</button>
				<input 
					bind:value={password}
					id="password"
					name="password"
					type={showPassword ? "text" : "password"}
					required
					placeholder=" "
					class="peer block w-full p-3 pt-5 text-sm bg-transparent border border-black rounded-xl text-black placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
				/>
				<label 
					for="password"
					class="absolute start-3 top-1 text-sm text-black bg-[#ffffff] px-1 transition-all scale-75 -translate-y-3 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-black peer-focus:scale-75 peer-focus:-translate-y-5"
				>
					Password
				</label>
			</div>

			<!-- Forgot Password -->
			<div class="w-full text-end">
				<a href="/forgot-password" class="text-sm text-gray-900 hover:text-gray-700 hover:underline transition-all">
					Forgot your password?
				</a>
			</div>
			<!-- Error Message -->
			{#if error}
				<p class="text-red-500 text-sm italic">{form.error}</p>
			{/if}
			<!-- Submit Button -->
			<button
				type="submit"
				class="w-full bg-black hover:bg-gray-800 active:bg-gray-900 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all"
			>
				Login
			</button>

		

			<!-- Register Prompt -->
			<p class="text-sm text-black">
				Don't have an account? 
				<a href="/register" class="text-gray-600 hover:text-gray-700 hover:underline transition-all">
					Register here
				</a>
			</p>
		</form>
	</div>
</div>