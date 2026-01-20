<script lang="ts">
    import type { Snippet } from 'svelte';
    import Modal from './Modal.svelte';

    interface Props {
        isOpen?: boolean;
        title?: string;
        entityName?: string;
        entityType?: string;
        size?: 'sm' | 'md' | 'lg' | 'xl';
        disabled?: boolean;
        confirmText?: string;
        cancelText?: string;
        onclose?: () => void;
        onconfirm?: () => void;
        icon?: Snippet;
        titleSlot?: Snippet;
        message?: Snippet;
        warning?: Snippet;
        options?: Snippet;
        defaultWarning?: Snippet;
        actions?: Snippet;
    }

    let {
        isOpen = false,
        title = 'Confirm Delete',
        entityName = '',
        entityType = 'item',
        size = 'md',
        disabled = false,
        confirmText = 'Yes, delete it',
        cancelText = 'Cancel',
        onclose,
        onconfirm,
        icon,
        titleSlot,
        message,
        warning,
        options,
        defaultWarning,
        actions
    }: Props = $props();

    function closeModal() {
        onclose?.();
    }

    function confirmDelete() {
        if (!disabled) {
            onconfirm?.();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<Modal {isOpen} {size} onclose={closeModal}>
    {#snippet header()}
        <div class="modal-header">
            <div class="d-flex align-items-center">
                <!-- Delete icon - can be overridden with icon snippet -->
                {#if icon}
                    {@render icon()}
                {:else}
                    <div class="flex-shrink-0 me-3">
                        <svg style="width: 1.5rem; height: 1.5rem;" class="text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </div>
                {/if}
                
                <!-- Title - can be overridden with titleSlot snippet -->
                {#if titleSlot}
                    {@render titleSlot()}
                {:else}
                    <h5 class="modal-title">
                        {title}
                    </h5>
                {/if}
            </div>
            
            <button
                onclick={closeModal}
                class="btn-close"
                aria-label="Close modal"
            >
                <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    {/snippet}

    {#snippet content()}
        <div class="modal-body">
            <!-- Main message - can be overridden with message snippet -->
            {#if message}
                {@render message()}
            {:else}
                {#if entityName}
                    <p class="text-muted mb-3">
                        Are you sure you want to delete "<strong>{entityName}</strong>"?
                    </p>
                {:else}
                    <p class="text-muted mb-3">
                        Are you sure you want to delete this {entityType}?
                    </p>
                {/if}
            {/if}

            <!-- Warning section - for complex entities with relationships -->
            {#if warning}
                {@render warning()}
            {/if}

            <!-- Additional options - for complex delete operations -->
            {#if options}
                {@render options()}
            {/if}

            <!-- Default warning if no custom content -->
            {#if defaultWarning}
                {@render defaultWarning()}
            {:else}
                <p class="text-muted small">
                    This action cannot be undone.
                </p>
            {/if}
        </div>
    {/snippet}
    
    {#snippet footer()}
        {#if actions}
            {@render actions()}
        {:else}
            <div class="modal-footer">
                <button onclick={closeModal} class="btn btn-secondary">
                    {cancelText}
                </button>
                <button 
                    onclick={confirmDelete} 
                    class="btn btn-danger"
                    {disabled}
                >
                    {confirmText}
                </button>
            </div>
        {/if}
    {/snippet}
</Modal>