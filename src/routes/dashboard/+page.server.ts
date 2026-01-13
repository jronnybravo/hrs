import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
	logout: async ({ cookies }) => {
		// Clear all session cookies
		cookies.delete('sessionId', { path: '/' });
		cookies.delete('userId', { path: '/' });
		cookies.delete('userEmail', { path: '/' });
		cookies.delete('userFirstName', { path: '/' });
		cookies.delete('userLastName', { path: '/' });

		redirect(302, '/');
	}
};
