<script lang="ts">
    import { themeStore } from '$lib/stores/theme';
</script>

<button
    type="button"
    class="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-200"
    onclick={() => themeStore.toggle()}
    aria-label="Toggle theme">
    {#if $themeStore === 'light'}
        <!-- Moon icon for dark mode - using secondary colors (tropical gold) -->
        <svg class="w-5 h-5 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    {:else}
        <!-- Sun icon for light mode - using primary colors (bonfire orange) -->
        <svg class="w-5 h-5 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    {/if}
</button>
