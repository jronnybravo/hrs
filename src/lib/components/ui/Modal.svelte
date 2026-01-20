<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        isOpen?: boolean;
        size?: 'sm' | 'md' | 'lg' | 'xl';
        closeOnBackdrop?: boolean;
        closeOnEscape?: boolean;
        onclose?: () => void;
        header?: Snippet;
        content?: Snippet;
        footer?: Snippet;
        children?: Snippet;
    }

    let {
        isOpen = false,
        size = 'md',
        closeOnBackdrop = true,
        closeOnEscape = true,
        onclose,
        header,
        content,
        footer,
        children
    }: Props = $props();

    function closeModal() {
        onclose?.();
    }

    function handleBackdropClick() {
        if (closeOnBackdrop) {
            closeModal();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (closeOnEscape && event.key === 'Escape') {
            closeModal();
        }
    }

    let sizeClass = $derived({
        sm: 'modal-sm',
        md: '',
        lg: 'modal-lg',
        xl: 'modal-xl'
    }[size]);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <div class="modal-backdrop fade show"></div>
    
    <div class="modal fade show" onclick={handleBackdropClick} onkeydown={(e) => e.key === 'Enter' && handleBackdropClick()} role="dialog" tabindex="-1" aria-modal="true" style="display: block;">
        <div class="modal-dialog {sizeClass}" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
            <div class="modal-content">
                {#if header}
                    {@render header()}
                {:else}
                    <div class="modal-header">
                        <button onclick={closeModal}
                            class="btn-close"
                            aria-label="Close modal">
                            <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                {/if}
                
                {#if content}
                    {@render content()}
                {:else if children}
                    {@render children()}
                {/if}
                
                {#if footer}
                    {@render footer()}
                {/if}
            </div>
        </div>
    </div>
{/if}