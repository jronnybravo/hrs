import type { User } from '$lib/db/entities/User';

export interface UserAuthorization {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
}

export function getCurrentUserAuthorization(user: User | null): UserAuthorization | null {
	if (!user) {
		return null;
	}

	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email
	};
}

export function isAuthorized(user: UserAuthorization | null): boolean {
	return user !== null;
}
