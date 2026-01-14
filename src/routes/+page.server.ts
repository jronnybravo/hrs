import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, type Redirect } from '@sveltejs/kit';
import { User } from '$lib/db/entities/User';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already logged in, redirect to dashboard
	if (locals.user) {
		redirect(302, '/dashboard');
	}
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const emailOrUsername = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!emailOrUsername || !password) {
			return fail(400, { error: 'Email/username and password are required' });
		}

		try {
			const user = await User.findOne({
				where: [
					{ email: emailOrUsername },
					{ username: emailOrUsername }
				]
			});

			if (!user || !User.verifyPassword(password, user.password)) {
				return fail(401, { error: 'Invalid email/username or password' });
			}

			// Create session cookies
			const sessionId = Math.random().toString(36).substring(2, 15);
			cookies.set('sessionId', sessionId, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			cookies.set('userId', user.id.toString(), {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30
			});

			redirect(302, '/dashboard');
		} catch (error) {
			// Re-throw redirect errors
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error;
			}
			console.error('Login error:', error);
			return fail(500, { error: 'An error occurred during login' });
		}
	}
};
