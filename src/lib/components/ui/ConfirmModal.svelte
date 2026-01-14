<script lang="ts">
	import type { Snippet } from 'svelte';
    import Modal from './Modal.svelte';

    interface Props {
        isOpen?: boolean;
        title: string;
        confirmText?: string;
        cancelText?: string;
        confirmVariant?: 'primary' | 'danger' | 'success' | 'warning';
        icon?: Snippet;
        titleSlot?: Snippet
        message?: Snippet;        
        size?: 'sm' | 'md' | 'lg' | 'xl';
        onclose?: () => void;
        onconfirm?: () => void;
    }

    let {
        isOpen = false,
        title,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmVariant = 'primary',
        size = 'md',
        onclose,
        onconfirm,
        icon,
        titleSlot,
        message,
    }: Props = $props();

    function closeModal() {
        onclose?.();
    }

    function confirmAction() {
        onconfirm?.();
    }

    let confirmButtonClass = $derived({
        primary: 'siq-btn siq-btn-primary',
        danger: 'siq-btn siq-btn-danger',
        success: 'siq-btn siq-btn-success',
        warning: 'siq-btn siq-btn-warning'
    }[confirmVariant]);
</script>

<Modal {isOpen} {size} onclose={closeModal}>
    {#snippet header()}
        <div class="siq-modal-header">
            <div class="flex items-center">
                {#if icon}
                    {@render icon()}
                {:else}
                    <div class="flex-shrink-0 mr-3">
                        <i class="bi bi-check-circle-fill"></i>
                    </div>
                {/if}
                
                {#if titleSlot}
                    {@render titleSlot()}
                {:else}
                    <h3 class="siq-modal-title">
                        {title}
                    </h3>
                {/if}
            </div>
            
            <button onclick={closeModal}
                class="siq-modal-close"
                aria-label="Close modal">
                <i class="bi bi-x"></i>
            </button>
        </div>
    {/snippet}
    {#snippet content()}
        <div class="siq-modal-body text-center">
            {#if message}
                {@render message()}
            {:else}
                <p class="text-surface-600 dark:text-surface-400 mb-6">
                    {confirmText}
                </p>
            {/if}
        </div>
        <div class="siq-modal-footer">
            <button onclick={confirmAction} class={confirmButtonClass}>
                {confirmText}
            </button>
            <button onclick={closeModal} class="siq-btn siq-btn-light">
                {cancelText}
            </button>
        </div>
    {/snippet}
</Modal>