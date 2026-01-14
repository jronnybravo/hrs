import { error, json, type RequestHandler } from '@sveltejs/kit';
import { instanceToPlain } from 'class-transformer';

import { Role } from '$lib/db/entities/Role';
import { Permission } from '$lib/utils/Permission';

import { User } from '$lib/db/entities/User';

const getRoleResponseById = async (id: string) => {
    const roleId = parseInt(id);
    if(isNaN(roleId)) {
        return {
            role: null,
            response: json(
                { success: false, message: 'Invalid role id.' },
                { status: 400 }
            )
        };
    }

    const role = await Role.findOne({ where: { id: roleId } });
    if (!role) {
        return {
            role,
            response: json(
                { success: false, message: 'Role not found.' },
                { status: 404 }
            )
        };
    }

    return { 
        role,
        response: null
    };
};

export const PUT: RequestHandler = async ({ params, request, locals }): Promise<Response> => {
    const user = await User.findOne({
        where: { id: locals.user?.id },
        relations: { role: true }
    });
    if(!user) {
        throw error(401, 'Unauthorized');
    }
    if(!user.can(Permission.UPDATE_ROLES)) {
        throw error(403, 'Forbidden');
    }

    const { role, response: roleResponse } = await getRoleResponseById(params.id!);
    if(roleResponse) {
        return roleResponse as Response;
    }

    const requestData = await request.json();
    Object.assign(role, requestData);
    const success = await role.save();

    if(!success) {
        return json(
            { success, message: 'Failed to update role. Try again later.' },
            { status: 500 }
        );
    }

    const data = instanceToPlain(role);
    return json(
        { success, data, message: 'Role updated successfully.' },
        { status: 200 }
    );
}

export const DELETE: RequestHandler = async ({ params, locals }): Promise<Response> => {
    const user = await User.findOne({
        where: { id: locals.user?.id },
        relations: { role: true }
    });
    if(!user) {
        throw error(401, 'Unauthorized');
    }
    if(!user.can(Permission.DELETE_ROLES)) {
        throw error(403, 'Forbidden');
    }

    const { role, response: roleResponse } = await getRoleResponseById(params.id!);
    if(roleResponse) {
        return roleResponse as Response;
    }

    const success = await role.remove();

    if(!success) {
        return json(
            { success, message: 'Failed to delete role. Try again later.' },
            { status: 500 }
        );
    }

    return json(
        { success, message: 'Role deleted successfully.' },
        { status: 200 }
    );
}