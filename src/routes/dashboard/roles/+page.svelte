<script lang="ts">
    import { onMount } from "svelte";

    import Breadcrumb from "$lib/components/ui/Breadcrumb.svelte";
    import DeleteModal from "$lib/components/ui/DeleteModal.svelte";
    import Button from "$lib/components/forms/Button.svelte";
    import Select from "$lib/components/forms/Select.svelte";
    import Textbox from "$lib/components/forms/Textbox.svelte";
    import Alert from "$lib/components/ui/Alert.svelte";
    import Pagination from "$lib/components/ui/Pagination.svelte";
    import Checkbox from "$lib/components/forms/Checkbox.svelte";


    import { toUriParams } from "$lib/utils/URI.js";
    import { toastStore } from "$lib/stores/Toast";

    import type { Role } from "$lib/db/entities/Role";

    const { data } = $props();
    const capabilities = $derived(data.capabilities as {
        canCreateRoles: boolean;
        canUpdateRoles: boolean;
        canDeleteRoles: boolean;
    });
    const showFirstColumn = capabilities.canUpdateRoles || capabilities.canDeleteRoles;
    const columnCount = 4 - +!showFirstColumn;

    let isLoading = $state(false);
    let error = $state("");

    let roles: Role[] = $state([]);

    let search = $state({ value: '' });
    let filter = $state({
        name: '' as string | null,
        description: '' as string | null,
    });
    let order = $state([
        { name: 'id', dir: 'desc' as 'asc' | 'desc' }
    ]);

    let itemsPerPage = $state(10);
    let currentPage = $state(1);
    let recordsFiltered = $state(0);
    let recordsTotal = $state(0);
    let totalPages = $derived(itemsPerPage ? Math.ceil(recordsFiltered / itemsPerPage) : 1);

    let selectedRoles: Set<Role> = $state(new Set());
    let selectedRolesAll: boolean = $derived(selectedRoles.size === roles.length && roles.length > 0);

    let roleToDelete: Role | null = $state(null);
    let rolesToDelete: Set<Role> = $state(new Set());

    onMount(async () => {
        loadRoles();
    });

    async function loadRoles(page: number | null = null) {
        if(page !== null) {
            currentPage = page;
        }

        isLoading = true;
        error = "";

        try {
            const uriParams = toUriParams({
                start: (currentPage - 1) * (itemsPerPage || 0),
                length: itemsPerPage,
                search,
                filter,
                order,
            });
            const response = await fetch(`/api/roles/?${uriParams}`);
            const result = await response.json();
            if (result.success && result.data) {
                roles = result.data;
                recordsTotal = result.total;
                recordsFiltered = result.filtered;
            } else {
                error = result.message || "Failed to load roles";
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load roles';
        } finally {
            selectedRoles = new Set();
            isLoading = false;
        }
    }

    function handleSort(column: string) {
        if (order[0].name === column) {
            order[0].dir = (order[0].dir === 'asc') ? 'desc' : 'asc';
        } else {
            order[0] = { name: column, dir: 'asc' }
        }
        loadRoles(1);
    }

    const getSortIconClass = (column: string) => {
        if (order[0]?.name !== column) {
            return 'bi-arrows-vertical';
        }
        return (order[0]?.dir === "asc") 
            ? 'bi-sort-alpha-up'
            : 'bi-sort-alpha-down-alt';
    };

    let filterTimeouts: { [key: string]: NodeJS.Timeout } = {};
    const handleFilterTextbox = (column: string, timeout: number = 1000) => {
        if (filterTimeouts[column]) {
            clearTimeout(filterTimeouts[column]);
        }
        filterTimeouts[column] = setTimeout(() => loadRoles(1), timeout);
    }

    const deleteRole = async (role: Role) => {
        let result = false;
        try {
            const response = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
            const { success, message } = await response.json();
            if (success) {
                toastStore.success(`"${role.name}" deleted successfully.`);
                result = true;
            } else {
                toastStore.error(message || 'Failed to delete role. Try again later.');
            }
        } catch (err: any) {
            console.error('Error deleting role:', err);
            const message = err.response?.data?.message || 'Failed to delete role. Try again later.';
            toastStore.error(message);
        }
        return result;
    }

    async function confirmDelete() {
        if(!roleToDelete) {
            return;
        }

        const result = await deleteRole(roleToDelete);
        if(result) {
            loadRoles(1);
        }

        roleToDelete = null;
    }

    async function confirmBulkDelete() {
        for(const roleToDelete of rolesToDelete) {
            await deleteRole(roleToDelete);
        }

        rolesToDelete = new Set();
        selectedRoles = new Set();
        loadRoles(1);
    }

    let breadcrumbLabel = $derived(isLoading  && !recordsTotal ? 'Roles...' : `Roles (${recordsTotal} total)`);
</script>

<svelte:head>
    <title>Visit Siquijor Admin - Roles</title>
</svelte:head>

<div class="container mx-auto p-2">
    <div class="flex justify-between items-center mb-6">
        <Breadcrumb items={[
            { iconClass: "bi-house-door-fill", label: "Dashboard", href: "/dashboard" },
            { iconClass: "bi-person-fill", label: breadcrumbLabel }
        ]} />

        <div class="flex items-center gap-2">
            {#if capabilities.canDeleteRoles && selectedRoles.size > 0}
                <Button onclick={() => rolesToDelete = new Set(selectedRoles)}
                    variant="danger">
                    <i class="bi bi-trash mr-1"></i>
                    Delete Selected ({selectedRoles.size})
                </Button>
            {/if}
            {#if capabilities.canCreateRoles}
                <Button href="/dashboard/roles/new">
                    <i class="bi bi-person-fill-add mr-1"></i>
                    Add New Role
                </Button>
            {/if}
        </div>
    </div>

    {#if !!error}
        <Alert on:dismiss={() => error = ""} 
            type="danger"
            title="Error"
            dismissible>
            {error}
        </Alert>
    {/if}

    <div class="siq-card-table">
        <div class="siq-table-container">
            <table class="siq-table w-full min-w-[800px]">
                <thead>
                    <tr>
                        {#if showFirstColumn}
                            <th class="w-16">
                                {#if capabilities.canDeleteRoles}
                                    <div class="flex items-center">
                                        <Checkbox bind:checked={selectedRolesAll}
                                            onchange={() => {
                                                selectedRoles = selectedRolesAll ? new Set(roles) : new Set();
                                            }}
                                        />
                                    </div>
                                {/if}
                            </th>
                        {/if}
                        <th onclick={() => handleSort('name')}
                            class="min-w-[250px] cursor-pointer">
                            Name <i class="bi {getSortIconClass('name')}"></i>
                        </th>
                        <th onclick={() => handleSort('description')}
                            class="min-w-[250px] cursor-pointer">
                            Description <i class="bi {getSortIconClass('description')}"></i>
                        </th>
                        <th>
                            Permissions
                        </th>
                    </tr>
                    <tr>
                        {#if showFirstColumn}
                            <td>&nbsp;</td>
                        {/if}
                        <td>
                            <Textbox bind:value={filter.name}
                                oninput={() => handleFilterTextbox('name')}
                                onclear={() => {
                                    filter.name = '';
                                    handleFilterTextbox('name', 0);
                                }}
                                placeholder="Filter by name or username"
                                size="sm"
                                clearable />
                        </td>
                        <td>
                            <Textbox bind:value={filter.description}
                                oninput={() => handleFilterTextbox('description')}
                                onclear={() => {
                                    filter.description = '';
                                    handleFilterTextbox('description', 0);
                                }}
                                placeholder="Filter by description"
                                size="sm"
                                clearable />
                        </td>
                        <td>&nbsp;</td>
                    </tr>
                </thead>
                <tbody>
                    {#if isLoading}
                        <tr>
                            <td colspan={columnCount}>
                                <div class="flex justify-center items-center py-12">
                                    <div class="siq-spinner-border text-primary-500"></div>
                                </div>
                            </td>
                        </tr>
                    {:else if !roles.length}
                        <tr>
                            <td colspan={columnCount}>
                                <div class="text-center py-12">
                                    <div class="text-surface-500 dark:text-surface-400 mb-4">
                                        <i class="bi bi-person text-6xl"></i>
                                    </div>
                                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                                        No roles found
                                    </h3>
                                </div>
                            </td>
                        </tr>
                    {:else}
                        {#each roles as role}
                            <tr>
                                {#if showFirstColumn}
                                    <td>
                                        <div class="flex items-center justify-center">
                                            {#if capabilities.canDeleteRoles}
                                                <Checkbox checked={selectedRoles.has(role)}
                                                    onchange={() => {
                                                        if(selectedRoles.has(role)) {
                                                            selectedRoles.delete(role);
                                                        } else {
                                                            selectedRoles.add(role);
                                                        }
                                                        selectedRoles = new Set(selectedRoles);
                                                    }}
                                                    class="mr-2" />
                                            {/if}
                                            {#if capabilities.canUpdateRoles}
                                                <a href="/dashboard/roles/{role.id}/?edit"
                                                    class="p-1 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                                    aria-label="Edit role">
                                                    <i class="bi bi-pencil-square"></i>
                                                </a>
                                            {/if}
                                            {#if capabilities.canDeleteRoles}
                                                <button onclick={() => roleToDelete = role}
                                                    class="p-1 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    aria-label="Delete Role">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            {/if}
                                        </div>
                                    </td>
                                {/if}
                                <td>
                                    <a href="/dashboard/roles/{role.id}/" class="font-bold">
                                        {role.name}
                                    </a>
                                </td>
                                <td>
                                    {role.description}
                                </td>
                                <td>
                                    {#each role.permissions as permission}
                                        <div>{permission}</div>
                                    {/each}
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    </div>

    {#if recordsTotal}
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div class="flex flex-col sm:flex-row items-center gap-4">
                <div class="text-sm text-surface-600 dark:text-surface-300">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, recordsFiltered)} of {recordsFiltered} items
                </div>
                <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                    <span>Show:</span>
                    <div class="w-[80px]">
                        <Select bind:value={itemsPerPage}
                            onchange={() => {
                                loadRoles(1);
                            }}
                            size="sm">
                            {#each [10, 25, 50, 100] as count}
                                <option value={count}>{count}</option>
                            {/each}
                        </Select>
                    </div>
                </div>
            </div>
            <Pagination onPageChange={loadRoles} {currentPage} {totalPages} />
        </div>
    {/if}
</div>

{#if capabilities.canDeleteRoles}
    <DeleteModal onconfirm={confirmDelete}
        onclose={() => roleToDelete = null}
        isOpen={!!roleToDelete}
        title="Delete Role"
        confirmText="Yes, delete it">
        {#snippet message()}
            <p class="text-surface-600 dark:text-surface-400 mb-4">
                Are you sure you want to delete <strong>{roleToDelete?.name}</strong>?
            </p>
        {/snippet}
    </DeleteModal>

    <DeleteModal onconfirm={confirmBulkDelete}
        onclose={() => rolesToDelete = new Set()}
        isOpen={rolesToDelete.size > 0}
        title="Delete Selected Roles"
        confirmText="Yes, delete {selectedRoles.size > 1 ? 'them' : 'it'}">
        {#snippet message()}
            <p class="text-surface-600 dark:text-surface-400 mb-4">
                Are you sure you want to delete {selectedRoles.size} 
                selected {selectedRoles.size > 1 ? 'roles' : 'role'}?
            </p>
        {/snippet}
    </DeleteModal>
{/if}