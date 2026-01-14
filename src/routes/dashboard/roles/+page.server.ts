import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { Permission } from '$lib/utils/Permission';
import { User } from '$lib/db/entities/User';

export const load: PageServerLoad = async ({ locals }) => {
    const user = await User.findOne({
        where: { id: locals.user?.id },
        relations: { role: true }
    });
    if(!user) {
        throw error(401, 'Unauthorized');
    }
    if(!user.can(Permission.READ_ROLES)) {
        throw error(403, 'Forbidden');
    }

    const capabilities = {
        canCreateRoles: user.can(Permission.CREATE_ROLES),
        canUpdateRoles: user.can(Permission.UPDATE_ROLES),
        canDeleteRoles: user.can(Permission.DELETE_ROLES),
    };
    
    return { capabilities };
};