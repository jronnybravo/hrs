import type { Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/db';

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

	if (sessionId && userId) {
		event.locals.user = {
			id: parseInt(userId)
		};
	}

	return resolve(event);
};