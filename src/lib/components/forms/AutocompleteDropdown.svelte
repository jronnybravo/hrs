<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { clickOutside } from '$lib/actions/clickOutside';

    export let options: Array<{ value: any; label: string; subtitle?: string | null; image?: string }> = [];
    export let placeholder = 'Search...';
    export let disabled = false;
    export const searchKey = 'label';
    export let onSelect: (option: any) => void = () => {};

    const dispatch = createEventDispatcher();

    let searchTerm = '';
    let isOpen = false;
    let highlightedIndex = -1;
    let inputElement: HTMLInputElement;

    // Filter options based on search term
    $: filteredOptions = options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        searchTerm = target.value;
        isOpen = searchTerm.length > 0;
        highlightedIndex = -1;
    }

    function handleSelect(option: any) {
        searchTerm = option.label;
        isOpen = false;
        highlightedIndex = -1;
        onSelect(option);
        dispatch('select', option);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!isOpen) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, -1);
                break;
            case 'Enter':
                event.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                isOpen = false;
                highlightedIndex = -1;
                break;
        }
    }

    function handleFocus() {
        if (searchTerm.length > 0) {
            isOpen = true;
        }
    }

    function handleClickOutside() {
        isOpen = false;
        highlightedIndex = -1;
    }

    function clearSearch() {
        searchTerm = '';
        isOpen = false;
        highlightedIndex = -1;
        onSelect(null);
        dispatch('select', null);
        inputElement?.focus();
    }
</script>

<div class="relative w-full" use:clickOutside={handleClickOutside}>
    <div class="relative">
        <input
            bind:this={inputElement}
            type="text"
            bind:value={searchTerm}
            oninput={handleInput}
            onfocus={handleFocus}
            onkeydown={handleKeydown}
            {placeholder}
            {disabled}
            class="w-full px-3 py-2 pr-10 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-500 dark:placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
        />
        
        <!-- Clear button -->
        {#if searchTerm}
            <button type="button"
                onclick={clearSearch}
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
                aria-label="Clear search">
                <i class="bi bi-x"></i>
            </button>
        {:else}
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-4 h-4 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
        {/if}
    </div>

    <!-- Dropdown -->
    {#if isOpen && filteredOptions.length > 0}
        <div class="absolute z-50 w-full mt-1 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {#each filteredOptions as option, index}
                <button
                    type="button"
                    onclick={() => handleSelect(option)}
                    class="w-full px-3 py-2 text-left hover:bg-surface-100 dark:hover:bg-surface-700 {index === highlightedIndex ? 'bg-surface-100 dark:bg-surface-700' : ''}"
                >
                    <div class="flex items-center">
                        <!-- Image if provided -->
                        {#if option.image}
                            <img 
                                src={option.image} 
                                alt={option.label}
                                class="w-8 h-8 rounded object-cover mr-3 flex-shrink-0"
                            />
                        {/if}
                        
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                                {option.label}
                            </div>
                            {#if option.subtitle}
                                <div class="text-xs text-surface-600 dark:text-surface-400 truncate">
                                    {option.subtitle}
                                </div>
                            {/if}
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    {:else if isOpen && searchTerm && filteredOptions.length === 0}
        <div class="absolute z-50 w-full mt-1 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-md shadow-lg">
            <div class="px-3 py-2 text-sm text-surface-600 dark:text-surface-400">
                No results found
            </div>
        </div>
    {/if}
</div>