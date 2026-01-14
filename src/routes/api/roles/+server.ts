import { error, json, type RequestHandler } from "@sveltejs/kit";
import { Like } from "typeorm";
import type { FindManyOptions, FindOptionsOrder, FindOptionsWhere } from "typeorm"
import { instanceToPlain } from "class-transformer";
import qs from 'qs';

import { Role } from "$lib/db/entities/Role";
import { Permission } from '$lib/utils/Permission';
import { User } from "$lib/db/entities/User";

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
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

    try {
        const params = qs.parse(url.searchParams.toString()) as {
            start?: string;
            length?: string;
            search?: { value: string };
            filter?: {
                name?: string | null;
                description?: string | null;
            };
            order: { 
                name: string; 
                dir: 'asc' | 'desc' 
            }[];
        };

        const whereConditions: FindOptionsWhere<Role>[] = [];

        if (params.search?.value?.trim()) {
            const searchValue = `%${params.search.value.trim()}%`;
            whereConditions.push(
                { name: Like(searchValue) }
            );
        }

        const additionalFilters: FindOptionsWhere<Role> = {};

        const filterName = params.filter?.name;
        if (filterName) {
            additionalFilters.name = Like(`%${filterName}%`);
        }

        const filterDescription = params.filter?.description;
        if (filterDescription) {
            additionalFilters.description = Like(`%${filterDescription}%`);
        }

        let finalWhere: any;
        if (whereConditions.length > 0) {
            whereConditions.forEach(condition => {
                Object.assign(condition, additionalFilters);
            });
            finalWhere = whereConditions;
        } else {
            // No OR conditions, just use additional filters
            finalWhere = Object.keys(additionalFilters).length ? additionalFilters : {};
        }

        const start = Number(params.start) || 0;
        const length = Number(params.length) || null;
        let order: FindOptionsOrder<Role> = { id: 'ASC' };
        if (params.order && params.order.length) {
            const orderItem = params.order[0];
            order = { [orderItem.name]: orderItem.dir.toUpperCase() };
        }

        const findOptions: FindManyOptions<Role> = {
            where: finalWhere,
            relations: {
                createdByUser: true,
            },
            order,
            ...(length ? { skip: start, take: length } : {})
        };

        const recordsTotal = await Role.count();
        const recordsFiltered = await Role.count({ where: finalWhere });
        const data = await Role.find(findOptions);

        return json({
            success: true,
            recordsTotal,
            recordsFiltered,
            data,
            message: 'Roles retrieved successfully'
        });
    } catch (error) {
        console.error('Get roles error:', error);
        return json({
            success: false,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const POST: RequestHandler = async ({ request, cookies, locals }): Promise<Response> => {
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

    const requestData = await request.json();
    const role = new Role();
    Object.assign(role, requestData);
    role.createdByUserId = user.id;
    const success = await role.save();

    if(!success) {
        return json(
            { success, message: 'Failed to create role. Try again later.' },
            { status: 500 }
        );
    }

    const data = instanceToPlain(role);
    return json(
        { success, data, message: 'Role created successfully.' },
        { status: 201 }
    );
}