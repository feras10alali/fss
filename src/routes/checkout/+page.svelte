<script>
	let first_name = 'Test';
	let last_name = 'User';
	let email = 'test@test.com';
	let phone = '51234567';
	let amount = 1;

	async function pay() {
		const res = await fetch('/api/pay', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ first_name, last_name, email, phone, amount })
		});
		const data = await res.json();

		if (data.redirect_url) {
			window.location.href = data.redirect_url;
		} else {
			alert(data.error || 'Error creating payment.');
		}
	}
</script>

<h1>Checkout</h1>
<form on:submit|preventDefault={pay}>
	<input bind:value={first_name} placeholder="First Name" required />
	<input bind:value={last_name} placeholder="Last Name" required />
	<input type="email" bind:value={email} placeholder="Email" required />
	<input bind:value={phone} placeholder="Phone Number" required />
	<input type="number" bind:value={amount} placeholder="Amount" min="0.1" step="0.1" required />
	<button type="submit">Pay</button>
</form>
