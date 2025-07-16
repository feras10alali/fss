<script>
	import { onMount } from 'svelte';

	let status = 'Processing payment...';

	onMount(() => {
		const url = new URL(window.location.href);
		const tap_id = url.searchParams.get('tap_id');
		const payment_status = url.searchParams.get('status');

		if (payment_status === 'CAPTURED') {
			status = '✅ Payment successful!';
		} else {
			status = '❌ Payment failed or canceled.';
		}
	});
</script>

<h1>Payment Result</h1>
<p>{status}</p>
