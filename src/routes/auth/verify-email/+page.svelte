<script>
	import { CheckCircle, XCircle } from 'lucide-svelte';
	
	export let data;
</script>

<div class="min-h-screen bg-gray-300 flex items-center justify-center p-4">
	<div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
		{#if data.success}
			<div class="flex flex-col items-center space-y-4">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
					<CheckCircle size={32} class="text-green-600" />
				</div>
				<h1 class="text-2xl font-bold text-gray-900">Email Verified!</h1>
				<p class="text-gray-600">{data.message}</p>
				<p class="text-sm text-gray-500 mt-4">You can close this page now.</p>
			</div>
		{:else}
			<div class="flex flex-col items-center space-y-4">
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
					<XCircle size={32} class="text-red-600" />
				</div>
				<h1 class="text-2xl font-bold text-gray-900">Verification Failed</h1>
				<p class="text-gray-600">{data.message}</p>
				<p class="text-sm text-gray-500 mt-4">Please try again or contact support.</p>
			</div>
		{/if}
	</div>
</div>