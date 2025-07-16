import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  return {
    user: {
      email: locals.user.email,
      phone: locals.user.phone || ''
    }
  };
}
