import type { Handle } from '@sveltejs/kit';
import { initializeDatabase, closeDatabase } from '$lib/db';

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
	return resolve(event);
};