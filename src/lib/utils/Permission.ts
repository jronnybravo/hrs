export abstract class Permission {

    static DO_EVERYTHING = 'Do Everything';

    static MANAGE_DEPARTMENTS = 'Manage Departments';
    static CREATE_DEPARTMENTS = 'Create Departments';
    static READ_DEPARTMENTS = 'Read Departments';
    static UPDATE_DEPARTMENTS = 'Update Departments';
    static DELETE_DEPARTMENTS = 'Delete Departments';

    static MANAGE_USERS = 'Manage Users';
    static CREATE_USERS = 'Create Users';
    static READ_USERS = 'Read Users';
    static UPDATE_USERS = 'Update Users';
    static DELETE_USERS = 'Delete Users';

    static MANAGE_ROLES = 'Manage Roles';
    static CREATE_ROLES = 'Create Roles';
    static READ_ROLES = 'Read Roles';
    static UPDATE_ROLES = 'Update Roles';
    static DELETE_ROLES = 'Delete Roles';
    
    static READ_REPORTS = 'Read Reports';

    static getHierarchy() {
        return {
            [this.DO_EVERYTHING]: {
                [this.MANAGE_DEPARTMENTS]: {
                    [this.READ_DEPARTMENTS]:  true,
                    [this.CREATE_DEPARTMENTS]: { requires: [ this.READ_DEPARTMENTS ] },
                    [this.UPDATE_DEPARTMENTS]: { requires: [ this.READ_DEPARTMENTS ] },
                    [this.DELETE_DEPARTMENTS]: { requires: [ this.READ_DEPARTMENTS ] },
                },
                [this.MANAGE_USERS]: {
                    [this.READ_USERS]: true,
                    [this.CREATE_USERS]: { requires: [ this.READ_USERS ] },
                    [this.UPDATE_USERS]: { requires: [ this.READ_USERS ] },
                    [this.DELETE_USERS]: { requires: [ this.READ_USERS ] },
                },
                [this.MANAGE_ROLES]: {
                    [this.READ_ROLES]: true,
                    [this.CREATE_ROLES]: { requires: [ this.READ_ROLES ] },
                    [this.UPDATE_ROLES]: { requires: [ this.READ_ROLES ] },
                    [this.DELETE_ROLES]: { requires: [ this.READ_ROLES ] },
                },
                [this.READ_REPORTS]: true
            }
        };
    }

    static getPermissionPath(permission: string): string[] {
        const hierarchy = (this as any).getHierarchy();
        const stack: [Record<string, any>, string[]][] = [[hierarchy, []]];
        while (stack.length > 0) {
            const [obj, path] = stack.pop()!;
            for (const key in obj) {
                if (key === permission) {
                    return [...path, permission];
                }
                if (typeof obj[key] === 'object') {
                    stack.push([obj[key], [...path, key]]);
                }
            }
        }
        return [];
    }

    static getAllPermissions(): string[] {
        const permissions: string[] = [];

        const stack: Record<string, any>[] = [(this as any).getHierarchy()];
        while (stack.length > 0) {
            const obj = stack.pop()!;
            for (const key in obj) {
                permissions.push(key);
                if (typeof obj[key] === 'object') {
                    stack.push(obj[key]);
                }
            }
        }

        return permissions;
    }
}