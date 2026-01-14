<script lang="ts">
    type AlertType = 'info' | 'success' | 'warning' | 'danger';
    
    export let type: AlertType = 'info';
    export let title: string = '';
    export let dismissible: boolean = false;
    export let visible: boolean = true;
    
    function dismiss() {
        visible = false;
    }
</script>

{#if visible}
    <div class="siq-alert siq-alert-{type}" role="alert">
        <div class="flex items-start gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0">
                {#if type === 'info'}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                {:else if type === 'success'}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                {:else if type === 'warning'}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                {:else if type === 'danger'}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                {/if}
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
                {#if title}
                    <div class="font-medium mb-1">{title}</div>
                {/if}
                <div>
                    <slot />
                </div>
            </div>
            
            <!-- Dismiss button -->
            {#if dismissible}
                <button
                    onclick={dismiss}
                    class="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Dismiss alert"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            {/if}
        </div>
    </div>
{/if}