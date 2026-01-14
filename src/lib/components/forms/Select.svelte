<script lang="ts">
    interface Props {
        value?: any;
        id?: string;
        name?: string;
        label?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        error?: string;
        helpText?: string;
        size?: 'sm' | 'md' | 'lg';
        clearable?: boolean;
        multiple?: boolean;
        onchange?: (event?: Event) => void;
        onfocus?: (event: FocusEvent) => void;
        onblur?: (event: FocusEvent) => void;
        children?: import('svelte').Snippet;
        // Allow any other select attributes to be passed through
        [key: string]: any;
    }

    let {
        value = $bindable(''),
        id,
        name,
        label = '',
        placeholder = 'Select an option',
        required = false,
        disabled = false,
        error = '',
        helpText = '',
        size = 'md',
        clearable = false,
        multiple = false,
        onchange,
        onfocus,
        onblur,
        children,
        ...restProps
    }: Props = $props();

    // Normalize value: convert null/undefined to empty string
    $effect(() => {
        if (value === null || value === undefined) {
            value = '';
        }
    });

    // Generate unique ID if not provided - use $derived to make reactive
    const uniqueId = $derived(id || `select-${Math.random().toString(36).substr(2, 9)}`);
    const selectName = $derived(name || uniqueId);

    function handleChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        if (multiple) {
            // Handle multiple selection
            const selectedOptions = Array.from(target.selectedOptions);
            const newValue = selectedOptions.map(option => {
                const val = option.value;
                const numValue = Number(val);
                return !isNaN(numValue) && val !== '' ? numValue : val;
            }).filter(val => val !== ''); // Filter out placeholder
            
            value = newValue;
        } else {
            // Handle single selection
            let newValue: any = target.value;
            
            // Handle empty string as null/undefined for proper placeholder display
            if (newValue === '') {
                newValue = '';
            } else {
                // Try to parse numeric values
                const numValue = Number(newValue);
                if (!isNaN(numValue) && newValue !== '') {
                    newValue = numValue;
                }
            }
            
            value = newValue;
        }
        onchange?.();
    }

    function handleFocus(event: FocusEvent) {
        onfocus?.(event);
    }

    function handleBlur(event: FocusEvent) {
        onblur?.(event);
    }

    function handleClear(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        const newValue = multiple ? [] : '';
        value = newValue;
        onchange?.();
    }

    // Check if select has a non-empty value for showing clear button
    let hasValue = $derived(
        multiple 
            ? Array.isArray(value) && value.length > 0
            : value !== '' && value !== null && value !== undefined
    );
    
    // Ensure proper value initialization
    $effect(() => {
        if (multiple) {
            if (!Array.isArray(value)) {
                value = [];
            }
        } else {
            if (value === null || value === undefined) {
                value = '';
            }
        }
    });

    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: '',
        lg: 'siq-btn-lg'
    };
</script>

<div class="w-full">
    {#if label}
        <label for={uniqueId} class="siq-form-label">
            {label}
            {#if required}
                <span class="text-red-500 ml-1">*</span>
            {/if}
        </label>
    {/if}

    <div class="relative">
        {#if multiple}
            <select
                bind:value
                multiple
                id={uniqueId}
                name={selectName}
                class="
                    siq-form-control w-full
                    {sizeClasses[size]}
                    {size === 'sm' ? 'min-h-[5rem]' : size === 'lg' ? 'min-h-[7rem]' : 'min-h-[6rem]'}
                    {error ? '!border-red-500 dark:!border-red-400' : ''}
                    {clearable && hasValue ? 'pr-12' : 'pr-3'}
                "
                class:placeholder-mode={!hasValue}
                class:opacity-50={disabled}
                class:cursor-not-allowed={disabled}
                {disabled}
                {required}
                onchange={handleChange}
                onfocus={handleFocus}
                onblur={handleBlur}
                {...restProps}
            >
                {#if placeholder}
                    <option value="" disabled>
                        {placeholder}
                    </option>
                {/if}
                {@render children?.()}
            </select>
        {:else}
            <select
                bind:value
                id={uniqueId}
                name={selectName}
                class="
                    siq-form-control w-full
                    {sizeClasses[size]}
                    {error ? 'border-red-500 dark:border-red-400' : ''}
                    {clearable && hasValue ? 'pr-12' : ''}
                "
                class:placeholder-mode={!hasValue}
                class:opacity-50={disabled}
                class:cursor-not-allowed={disabled}
                {disabled}
                {required}
                onchange={handleChange}
                onfocus={handleFocus}
                onblur={handleBlur}
                {...restProps}>
                {#if placeholder}
                    <option value="" disabled>
                        {placeholder}
                    </option>
                {/if}
                {@render children?.()}
            </select>
        {/if}

        {#if clearable && hasValue && !disabled}
            <button
                type="button"
                class="absolute text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors cursor-pointer p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                class:top-2={size === 'sm'}
                class:top-3={size === 'md'}
                class:top-4={size === 'lg'}
                style="right: {multiple ? '8px' : '28px'}; z-index: 1000; line-height: 1;"
                onclick={handleClear}
                tabindex="-1"
                aria-label="Clear selection"
            >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        {/if}
    </div>

    {#if error}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    {/if}

    {#if helpText && !error}
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">{helpText}</p>
    {/if}
</div>

<style>
    /* Style the select element itself when no value is selected (placeholder mode) */
    select.placeholder-mode {
        color: var(--color-surface-500) !important;
    }
    
    :global(.dark) select.placeholder-mode {
        color: var(--color-surface-400) !important;
    }
    
    /* Ensure normal color when value is selected */
    select:not(.placeholder-mode) {
        color: var(--color-surface-900) !important;
    }
    
    :global(.dark) select:not(.placeholder-mode) {
        color: var(--color-surface-100) !important;
    }
    
    /* All options should have proper text color from the start - both single and multiple */
    select option {
        color: var(--color-surface-900);
    }
    
    :global(.dark) select option {
        color: var(--color-surface-50);
    }
    
    /* Regular options should have normal color */
    
    /* Remove only the select container padding, not option padding */
    select[multiple] {
        padding: 0px !important;
        color: var(--color-surface-900) !important;
        background-color: white !important;
    }
    
    :global(.dark select[multiple].siq-form-control) {
        color: var(--color-surface-100) !important;
        background-color: var(--color-surface-50) !important;
    }

    /* Force styling on all options following component theming patterns */
    :global(select[multiple].siq-form-control option) {
        padding: 12px 16px !important;
        margin: 0 !important;
        line-height: 1.5 !important;
        min-height: 32px !important;
        box-sizing: border-box !important;
        border: none !important;
        color: var(--color-surface-900) !important;
        background-color: white !important;
    }
    
    :global(.dark select[multiple].siq-form-control option) {
        color: var(--color-surface-100) !important;
        background-color: var(--color-surface-800) !important;
    }
    
    /* Hover states for better UX */
    :global(select[multiple].siq-form-control option:hover) {
        background-color: var(--color-surface-100) !important;
    }
    
    :global(.dark select[multiple].siq-form-control option:hover) {
        background-color: var(--color-surface-700) !important;
    }

    /* Placeholder option should be muted and not selectable in multiple */
    :global(select[multiple].siq-form-control option[value=""]) {
        color: var(--color-surface-500) !important;
        cursor: not-allowed !important;
        position: sticky !important;
        top: 0px !important;
        background-color: white !important;
        border-bottom: 1px solid var(--color-surface-200) !important;
        font-weight: 400 !important;
        z-index: 999 !important;
        padding: 12px 16px 12px 16px !important;
        margin: 0 !important;
        line-height: 1.5 !important;
        height: auto !important;
        min-height: 32px !important;
        /* Override any inherited padding and use full width */
        width: 100% !important;
        box-sizing: border-box !important;
        display: block !important;
        border-left: none !important;
        border-right: none !important;
        border-top: none !important;
    }
    
    :global(.dark select[multiple].siq-form-control option[value=""]) {
        color: var(--color-surface-400) !important;
        background-color: var(--color-surface-50) !important;
        border-bottom-color: var(--color-surface-700) !important;
    }
    
    /* Prevent hover effects on placeholder option */
    select[multiple] option[value=""]:hover {
        background-color: white !important;
        cursor: not-allowed;
    }
    
    :global(.dark) select[multiple] option[value=""]:hover {
        background-color: var(--color-surface-50) !important;
    }

    /* Specific styling for regular options - align with placeholder */
    :global(select[multiple].siq-form-control option:not([value=""])) {
        border-radius: 4px !important;
        margin: 0 !important;
        padding: 12px 16px !important;
        line-height: 1.5 !important;
        background-color: transparent !important;
        min-height: 32px !important;
        box-sizing: border-box !important;
        border: none !important;
    }
    
    :global(select[multiple].siq-form-control option:checked) {
        background-color: rgb(59 130 246) !important;
        color: white !important;
        font-weight: 500 !important;
    }
    
    :global(select[multiple].siq-form-control option:checked:hover) {
        background-color: rgb(37 99 235) !important;
    }

    /* Ensure unselected options maintain original styling */
    :global(select[multiple].siq-form-control option:not(:checked):not([value=""])) {
        background-color: transparent !important;
        color: var(--color-surface-900) !important;
    }
    
    :global(.dark select[multiple].siq-form-control option:not(:checked):not([value=""])) {
        color: var(--color-surface-100) !important;
    }
    
    /* Fix focus styles */
    select[multiple]:focus {
        outline: 2px solid rgb(59 130 246);
        outline-offset: 2px;
        border-color: rgb(59 130 246);
    }
</style>