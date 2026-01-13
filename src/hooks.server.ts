import type { Handle } from '@sveltejs/kit';
import { initializeDatabase, closeDatabase } from '$lib/db';
import type { SessionUser } from '$lib/auth';

let dbInitialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!dbInitialized) {
		try {
			await initializeDatabase();
			dbInitialized = true;
		} catch {
			// Database failed to initialize, but continue anyway
			// This allows development to proceed without a database
			dbInitialized = true;
		}
	}

	// Get user from cookie/session
	const sessionId = event.cookies.get('sessionId');
	const userId = event.cookies.get('userId');
	const userEmail = event.cookies.get('userEmail');
	const userFirstName = event.cookies.get('userFirstName');
	const userLastName = event.cookies.get('userLastName');

	if (sessionId && userId && userEmail) {
		event.locals.user = {
			id: parseInt(userId),
			email: userEmail,
			firstName: userFirstName || '',
			lastName: userLastName || ''
		};
	}

	return resolve(event);
};