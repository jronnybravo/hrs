import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { instanceToPlain } from 'class-transformer';

import { Role } from '$lib/db/entities/Role';
import { User } from '$lib/db/entities/User';
import { Permission } from '$lib/utils/Permission';

export const load: PageServerLoad = async ({ parent, url, params, locals }) => {
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

    const { id } = params;
    const isNew = id.toLowerCase() === 'new';
    const isEdit = !isNew && url.searchParams.has('edit');

    const capabilities = {
        canCreateRoles: user.can(Permission.CREATE_ROLES),
        canUpdateRoles: user.can(Permission.UPDATE_ROLES),
        canDeleteRoles: user.can(Permission.DELETE_ROLES),
    };

    if (isNew) {
        if(!capabilities.canCreateRoles) {
            throw error(403, 'Forbidden');
        }
        return { 
            capabilities,
            role: instanceToPlain(new Role())
        };
    } else if (isEdit) {
        if(!capabilities.canUpdateRoles) {
            throw error(403, 'Forbidden');
        }
    }

    const role = await Role.findOne({
        where: { id: parseInt(id) },
        relations: {
            createdByUser: true,
            users: true,
        }
    });

    if(!role) {
        throw error(404, 'Role not found');
    }
    
    return {
        capabilities,
        role: instanceToPlain(role)
    };
};
