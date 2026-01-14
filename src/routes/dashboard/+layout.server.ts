import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { User } from '$lib/db/entities/User';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		redirect(302, '/');
	}

	// Fetch full user data from database
	let fullUser = {
		id: locals.user.id,
		firstName: '',
		lastName: '',
		email: ''
	};

	try {
		const user = await User.findOne({ where: { id: locals.user.id } });
		if (user) {
			fullUser = {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email
			};
		}
	} catch (error) {
		console.error('Failed to fetch user:', error);
	}

	return {
		user: fullUser
	};
};
