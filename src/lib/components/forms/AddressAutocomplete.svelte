<script lang="ts">
    import { createEventDispatcher, onDestroy } from 'svelte';
    import Textbox from './Textbox.svelte';
    import axios from 'axios';
    
    export let value = '' as string | null | undefined;
    export let placeholder = 'Enter address in Siquijor';
    export let disabled = false;
    export let readonly = false;
    export let required = false;
    export let id = '';
    export let label = '';
    export let error = '';
    export let helpText = '';
    
    const dispatch = createEventDispatcher<{
        change: string;
        select: { address: string; coordinates: { latitude: number; longitude: number } };
    }>();
    
    interface LocationResult {
        name: string;
        type: string;
        municipality?: string;
        barangay?: string;
        road?: string;
        postcode?: string;
        coordinates: { latitude: number; longitude: number };
        description?: string;
        displayName: string;
        fullAddress?: string;
        relevanceScore: number;
        category: 'municipality' | 'barangay' | 'tourist_spot' | 'landmark' | 'road';
    }

    let suggestions: LocationResult[] = [];
    
    let showSuggestions = false;
    let isLoading = false;
    let selectedIndex = -1;
    let textboxComponent: any;
    let suggestionsContainer: HTMLDivElement;
    
    let debounceTimer: ReturnType<typeof setTimeout>;
    
    // Handle input changes
    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        value = target.value;
        dispatch('change', value);
        
        // Clear previous debounce
        clearTimeout(debounceTimer);
        
        // Debounce search by 300ms
        debounceTimer = setTimeout(() => {
            searchAddresses(value);
        }, 300);
    }
    
    // API search function using Siquijor locations API
    async function searchAddresses(query: string | null | undefined) {
        if(query === null || query === undefined) {
            suggestions = [];
            showSuggestions = false;
            return;
        }

        if (query.length < 1) {
            suggestions = [];
            showSuggestions = false;
            return;
        }
        
        try {
            isLoading = true;
            
            // Call the API search endpoint
            const response = await axios.get(`/api/locations/search?query=${encodeURIComponent(query)}&limit=8`);
            
            if (response.data && response.data.success) {
                suggestions = response.data.data || [];
                showSuggestions = suggestions.length > 0;
                selectedIndex = -1;
            } else {
                console.error('API search failed:', response.data?.message);
                suggestions = [];
                showSuggestions = false;
            }
            
        } catch (error) {
            console.error('API search error:', error);
            suggestions = [];
            showSuggestions = false;
        } finally {
            isLoading = false;
        }
    }
    
    function selectSuggestion(suggestion: LocationResult) {
        // Use full address for complete address display
        const selectedAddress = suggestion.fullAddress || suggestion.displayName;
        value = selectedAddress;
        showSuggestions = false;
        suggestions = [];
        selectedIndex = -1;
        
        // Dispatch both the address and coordinates
        dispatch('change', value);
        dispatch('select', {
            address: selectedAddress,
            coordinates: suggestion.coordinates,
        });
        
        textboxComponent?.blur();
    }
    
    function handleKeydown(event: KeyboardEvent) {
        if (!showSuggestions || suggestions.length === 0) return;
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0) {
                    selectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                showSuggestions = false;
                selectedIndex = -1;
                textboxComponent?.blur();
                break;
        }
    }
    
    function handleBlur() {
        // Delay hiding suggestions to allow clicking on them
        setTimeout(() => {
            showSuggestions = false;
            selectedIndex = -1;
        }, 150);
    }
    
    function handleFocus() {
        if (suggestions.length > 0) {
            showSuggestions = true;
        }
    }
    
    // Cleanup debounce timer
    onDestroy(() => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
    });
</script>

<div class="relative">
    <Textbox
        bind:this={textboxComponent}
        {id}
        {label}
        {error}
        {helpText}
        bind:value
        {placeholder}
        {disabled}
        {readonly}
        {required}
        class="pr-8"
        autocomplete="off"
        oninput={handleInput}
        onkeydown={handleKeydown}
        onfocus={handleFocus}
        onblur={handleBlur} />
    
    {#if isLoading}
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <i class="animate-spin bi bi-arrow-clockwise"></i>
        </div>
    {/if}
    
    <!-- Suggestions dropdown -->
    {#if showSuggestions && suggestions.length > 0}
        <div bind:this={suggestionsContainer}
            class="absolute z-20 w-full mt-1 bg-surface-0 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {#each suggestions as suggestion, index}
                <button
                    type="button"
                    class="w-full text-left px-4 py-3 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150 border-b border-surface-200 dark:border-surface-700 last:border-b-0"
                    class:bg-primary-50={selectedIndex === index}
                    class:dark:bg-primary-900={selectedIndex === index}
                    class:text-primary-700={selectedIndex === index}
                    class:dark:text-primary-300={selectedIndex === index}
                    on:click={() => selectSuggestion(suggestion)}>
                    <div class="flex items-start gap-3">
                        <div class="min-w-0 flex-1">
                            <div class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                                {suggestion.fullAddress || suggestion.displayName}
                            </div>
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* Ensure dropdown appears above other elements */
    :global(.relative) {
        position: relative;
    }
</style>