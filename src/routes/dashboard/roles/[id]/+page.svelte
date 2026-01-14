<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';

    import { toastStore } from '$lib/stores/toast';

	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
    import Button from '$lib/components/forms/Button.svelte';
    import DeleteModal from '$lib/components/ui/DeleteModal.svelte';
	import Form from '$lib/components/forms/Form.svelte';
    import Textarea from '$lib/components/forms/Textarea.svelte';
	import PermissionTreeSelector from '$lib/components/forms/PermissionTreeSelector.svelte';

    import type { Role } from '$lib/db/entities/Role';
	import Textbox from '$lib/components/forms/Textbox.svelte';

    let { data } = $props();
    const capabilities = $derived(data.capabilities as {
        canUpdateRoles: boolean;
        canDeleteRoles: boolean;
    });

    let id = $derived(page.params.id);
    let isNew = $derived(id === 'new');
    let isEdit = $derived(!isNew && page.url.searchParams.has('edit'));
    let isView = $derived(!isNew && !isEdit);
    
    let role = $state<Role>({} as Role);
    $effect(() => {
        role = data.role as Role;
    });

    let isSaving = $state(false);

    let roleToDelete = $state<Role | null>(null);
    
    const onsubmit = async (e: CustomEvent) => {
        e.detail.event.preventDefault();

        if(!isFormValid) {
            toastStore.error('Please fill in all required fields');
            return;
        }

        try {
            isSaving = true;
            const url = '/api/roles' + (isEdit ? `/${id}` : '');
            const method = isNew ? 'post' : 'put';
            const response = await fetch(url, {
                method: method.toUpperCase(),
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: role.name,
                    description: role.description,
                    permissions: role.permissions
                })
            });
            const { success, message } = await response.json();
            if(success) {
                toastStore.success(`"${role.name}" saved successfully.`);
                goto('/dashboard/roles');
            } else {
                toastStore.error(message || 'Failed to save role. Try again later.');
            }
        } catch (error: any) {
            console.error(`Error on saving role:`, error);
            const message = error.response?.data?.message || 'Error on saving role. Try again later.';
            toastStore.error(message);
        } finally {
            isSaving = false;
        }
    }

    async function confirmDelete() {
        if (!roleToDelete) {
            return;
        }
        try {
            const response = await fetch(`/api/roles/${roleToDelete.id}`, { method: 'DELETE' });
            const { success, message } = await response.json();
            if (success) {
                toastStore.success(`"${roleToDelete.name}" deleted successfully.`);
                goto('/dashboard/roles');
            } else {
                toastStore.error(message || 'Failed to delete role. Try again later.');
            }
        } catch (error: any) {
            console.error('Error deleting role:', error);
            const message = error.response?.data?.message || 'Failed to delete role. Try again later.';
            toastStore.error(message);
        } finally {
            roleToDelete = null;
        }
    }

    let breadcrumbLabel = $derived.by(() => {
        if (isNew) {
            return 'Add New Role';
        }
        if(role.name) {
            return role.name;
        }
        if (isEdit) {
            return 'Edit Role';
        }
        return 'Role Details';
    });

    let isFormValid = $derived.by(() => {
        if(!role.name?.trim()){
            return false;
        }
        return true;
    });
</script>

<div class="container mx-auto p-2">
    <div class="flex justify-between items-center mb-6">
        <Breadcrumb items={[
            { iconClass: "bi-house-door-fill", label: "Dashboard", href: "/dashboard" },
            { iconClass: "bi-person-fill", label: "Roles", href: "/dashboard/roles" },
            { label: breadcrumbLabel }
        ]} />

        {#if isView && role}
            <div class="flex items-center gap-2">
                {#if capabilities.canUpdateRoles}
                    <Button href="/dashboard/roles/{id}?edit" variant="primary">
                        Edit Role
                    </Button>
                {/if}
                {#if capabilities.canDeleteRoles}
                    <Button onclick={() => roleToDelete = role} variant="danger">
                        Delete Role
                    </Button>
                {/if}
            </div>
        {:else if isEdit}
            <Button href="/dashboard/roles/{id}" variant="ghost">
                Cancel Edit
            </Button>
        {/if}
    </div>

    <Form {onsubmit} class="space-y-8">
        <div class="bg-surface-50 dark:bg-surface-800 p-6 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700">
            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-4">Basic Information</h2>
            <div class="grid gap-6 md:grid-cols-1">
                <div class="siq-form-group">
                    <label for="txt_role_name" class="siq-form-label">
                        Role Name {#if !isView}<span class="text-error-500">*</span>{/if}
                    </label>
                    <Textbox bind:value={role.name}
                        id="txt_role_name"
                        placeholder="Role name"
                        required={!isView}
                        disabled={isView}
                    />
                </div>

                <div class="siq-form-group">
                    <label for="txt_role_description" class="siq-form-label">Description</label>
                    <Textarea bind:value={role.description}
                        id="txt_role_description"
                        placeholder="Describe this role..."
                        disabled={isView} />
                </div>
            </div>
        </div>

        <div class="bg-surface-50 dark:bg-surface-800 p-6 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700">
            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-4">Permissions</h2>
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Define the permissions for this role.
                Administrators with this role will inherit these permissions.
            </p>
            {#if isView}
                {#if role.permissions?.length}
                    <div class="flex flex-wrap gap-2">
                        {#each role.permissions as permission}
                            <div class="flex items-center gap-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded">
                                <span class="text-sm">{permission}</span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-sm text-surface-500 dark:text-surface-400 italic">No permissions assigned</p>
                {/if}
            {:else}
                <PermissionTreeSelector bind:selectedPermissions={role.permissions} />
            {/if}
        </div>

        {#if isView && role}
            <div class="bg-surface-50 dark:bg-surface-800 p-6 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-4">Statistics</h2>
                <div class="grid gap-4 md:grid-cols-2">
                    <div>
                        <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Administrators</h3>
                        <p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
                            {role.users?.length || 0}
                        </p>
                        <p class="text-sm text-surface-600 dark:text-surface-400">administrators with this role</p>
                    </div>
                    <div>
                        <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Created By</h3>
                        <p class="text-surface-900 dark:text-surface-100">
                            {role.createdByUser?.fullName || role.createdByUser?.username || 'System'}
                        </p>
                    </div>
                </div>
            </div>
        {/if}

        {#if !isView}
            <div class="flex justify-between items-center pt-6 border-t border-surface-200 dark:border-surface-700">
                <Button href={isNew ? '/dashboard/roles' : `/dashboard/roles/${id}`}
                    type="button"
                    variant="ghost">
                    Cancel
                </Button>
                
                <Button type="submit"
                    variant="primary"
                    disabled={isSaving || !isFormValid}
                    loading={isSaving}>
                    {#if isSaving}
                        Saving...
                    {:else}
                        Save
                    {/if}
                </Button>
            </div>
        {/if}
    </Form>
</div>

<DeleteModal onconfirm={confirmDelete}
    onclose={() => roleToDelete = null}
    isOpen={!!roleToDelete}
    title="Delete Role"
    entityName={roleToDelete?.name || ''}
    entityType="role" />

