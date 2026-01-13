import type { PageServerLoad } from './$types';
import { Setting } from '$lib/db/entities/Setting';

export const load: PageServerLoad = async () => {
	try {
        const companyName = await Setting.get('company_name') || 'HRS';
		return {
			companyName
		};
	} catch (error) {
		console.error('Error loading company name:', error);
		return {
			companyName: 'HRS'
		};
	}
};
