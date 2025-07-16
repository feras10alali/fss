import { json } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';

export async function POST({ request, locals }) {
	const data = await request.json();

	const tapRes = await fetch('https://api.tap.company/v2/charges', {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			Authorization: 'Bearer sk_test_cOWkEX8lH16yDTUgIeJ7aMpd'
		},
		body: JSON.stringify({
			amount: data.amount,
			currency: 'SAR',
			threeDSecure: true,
			save_card: false,
			description: 'Store Purchase',
			customer: {
				first_name: data.first_name,
				last_name: data.last_name,
				email: data.email,
				phone: {
					country_code: '966',
					number: data.phone
				}
			},
			source: { id: 'src_all' },
			redirect: {
				url: 'http://192.168.0.23:5173/payment/callback'
			}
		})
	});

	const result = await tapRes.json();

	if (result.transaction?.url && result.id) {
		await pb.collection('payments').create({
			user: locals.user.id,
			amount: data.amount,
			status: 'PENDING',
			tap_id: result.id,
			redirect_url: result.transaction.url,
			order_ref: result.reference?.order ?? ''
		});

		return json({ redirect_url: result.transaction.url });
	} else {
		return json({ error: result.message || 'Payment failed' }, { status: 400 });
	}
}
