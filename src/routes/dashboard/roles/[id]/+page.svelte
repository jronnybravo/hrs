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
        role = {
            ...(data.role as Role),
            name: (data.role as Role)?.name || '',
            description: (data.role as Role)?.description || ''
        };
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

<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <Breadcrumb items={[
            { iconClass: "bi-house-door-fill", label: "Dashboard", href: "/dashboard" },
            { iconClass: "bi-person-fill", label: "Roles", href: "/dashboard/roles" },
            { label: breadcrumbLabel }
        ]} />

        {#if isView && role}
            <div class="d-flex gap-2">
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

    <Form {onsubmit} class="mb-5">
        <div class="card mb-4">
            <div class="card-body">
                <h2 class="card-title h5 mb-4">Basic Information</h2>
                <div class="row">
                    <div class="col-12">
                        <div class="mb-3">
                            <label for="txt_role_name" class="form-label">
                                Role Name {#if !isView}<span class="text-danger">*</span>{/if}
                            </label>
                            <Textbox bind:value={role.name}
                                id="txt_role_name"
                                placeholder="Role name"
                                required={!isView}
                                disabled={isView}
                            />
                        </div>

                        <div class="mb-3">
                            <label for="txt_role_description" class="form-label">Description</label>
                            <Textarea bind:value={role.description}
                                id="txt_role_description"
                                placeholder="Describe this role..."
                                disabled={isView} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mb-4">
            <div class="card-body">
                <h2 class="card-title h5 mb-4">Permissions</h2>
                <p class="small text-muted mb-3">
                    Define the permissions for this role.
                    Administrators with this role will inherit these permissions.
                </p>
                {#if isView}
                    {#if role.permissions?.length}
                        <div class="d-flex flex-wrap gap-2">
                            {#each role.permissions as permission}
                                <div class="badge bg-primary">
                                    {permission}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="small text-muted fst-italic">No permissions assigned</p>
                    {/if}
                {:else}
                    <PermissionTreeSelector bind:selectedPermissions={role.permissions} />
                {/if}
            </div>
        </div>

        {#if isView && role}
            <div class="card mb-4">
                <div class="card-body">
                    <h2 class="card-title h5 mb-4">Statistics</h2>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <h3 class="h6">Administrators</h3>
                            <p class="display-6 fw-bold">
                                {role.users?.length || 0}
                            </p>
                            <p class="small text-muted">administrators with this role</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <h3 class="h6">Created By</h3>
                            <p>
                                {role.createdByUser?.fullName || role.createdByUser?.username || 'System'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        {#if !isView}
            <div class="d-flex justify-content-between align-items-center pt-3 border-top">
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

