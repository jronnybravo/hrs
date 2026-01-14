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
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    }[size]);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <div class="siq-modal" onclick={handleBackdropClick} onkeydown={(e) => e.key === 'Enter' && handleBackdropClick()} role="button" tabindex="0" aria-label="Close modal">
        <div class="siq-modal-backdrop"></div>
        
        <div class="siq-modal-dialog {sizeClass}" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
            <div class="siq-modal-content">
                {#if header}
                    {@render header()}
                {:else}
                    <div class="siq-modal-header">
                        <button onclick={closeModal}
                            class="siq-modal-close"
                            aria-label="Close modal">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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