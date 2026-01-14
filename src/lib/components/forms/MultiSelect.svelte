<script lang="ts">
    interface Props {
        value?: any;
        options?: Array<{ label: string; value: any; disabled?: boolean }>;
        label?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        error?: string;
        helpText?: string;
        size?: 'sm' | 'md' | 'lg';
        clearable?: boolean;
        multiple?: boolean;
        onchange?: (event: { value: any }) => void;
        onfocus?: (event: FocusEvent) => void;
        onblur?: (event: FocusEvent) => void;
    }

    let {
        value = $bindable(''),
        options = [],
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
        onblur
    }: Props = $props();

    let isOpen = $state(false);
    let containerElement: HTMLDivElement | undefined = $state();
    let selectedValues: any[] = $state([]);

    // Initialize selected values for multiple select
    $effect(() => {
        if (multiple) {
            if (Array.isArray(value)) {
                selectedValues = [...value];
            } else {
                selectedValues = [];
                value = [];
            }
        } else {
            selectedValues = [];
            if (value === null || value === undefined) {
                value = '';
            }
        }
    });

    // Check if has value for clear button
    let hasValue = $derived(
        multiple 
            ? selectedValues.length > 0
            : value !== '' && value !== null && value !== undefined
    );

    // Display text
    let displayText = $derived(() => {
        if (multiple) {
            if (selectedValues.length === 0) {
                return placeholder;
            } else if (selectedValues.length === 1) {
                const option = options.find(opt => opt.value === selectedValues[0]);
                return option?.label || '';
            } else {
                return `${selectedValues.length} selected`;
            }
        } else {
            const option = options.find(opt => opt.value === value);
            return option?.label || placeholder;
        }
    });

    function handleToggle() {
        if (disabled) return;
        isOpen = !isOpen;
        
        if (isOpen) {
            onfocus?.(new FocusEvent('focus'));
        } else {
            onblur?.(new FocusEvent('blur'));
        }
    }

    function handleOptionClick(option: { label: string; value: any; disabled?: boolean }) {
        if (option.disabled) return;

        if (multiple) {
            const index = selectedValues.indexOf(option.value);
            if (index > -1) {
                selectedValues = selectedValues.filter((_, i) => i !== index);
            } else {
                selectedValues = [...selectedValues, option.value];
            }
            value = selectedValues;
        } else {
            value = option.value;
            selectedValues = [];
            isOpen = false;
        }
        
        onchange?.({ value });
    }

    function handleClear(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (multiple) {
            selectedValues = [];
            value = [];
        } else {
            value = '';
        }
        
        onchange?.({ value });
    }

    // Close dropdown when clicking outside
    $effect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerElement && !containerElement.contains(event.target as Node)) {
                isOpen = false;
            }
        }

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    });

    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: '',
        lg: 'siq-btn-lg'
    };
</script>

<div class="w-full" bind:this={containerElement}>
    {#if label}
        <label for="multiselect-{Math.random().toString(36).substr(2, 9)}" class="siq-form-label">
            {label}
            {#if required}
                <span class="text-red-500 ml-1">*</span>
            {/if}
        </label>
    {/if}

    <div class="relative">
        <!-- Select trigger -->
        <button
            type="button"
            class="
                siq-form-control w-full text-left
                {sizeClasses[size]}
                {error ? 'border-red-500 dark:border-red-400' : ''}
                {clearable && hasValue ? 'pr-12' : 'pr-8'}
                flex items-center justify-between
            "
            class:opacity-50={disabled}
            class:cursor-not-allowed={disabled}
            class:text-surface-500={!hasValue}
            class:dark:text-surface-400={!hasValue}
            onclick={handleToggle}
            {disabled}
        >
            <span class="truncate">{displayText}</span>
            
            <!-- Icons -->
            <div class="flex items-center gap-1">
                {#if clearable && hasValue && !disabled}
                    <span
                        class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors cursor-pointer"
                        onclick={(e) => {
                            e.stopPropagation();
                            handleClear(e);
                        }}
                        onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                handleClear(e);
                            }
                        }}
                        tabindex="0"
                        role="button"
                        aria-label="Clear selection"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </span>
                {/if}
                
                <svg 
                    class="w-4 h-4 text-surface-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        </button>

        <!-- Dropdown menu -->
        {#if isOpen && !disabled}
            <div class="absolute z-50 w-full mt-1 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {#if options.length === 0}
                    <div class="px-3 py-2 text-sm text-surface-500 dark:text-surface-400">
                        No options available
                    </div>
                {:else}
                    {#each options as option}
                        <button
                            type="button"
                            class="
                                w-full px-3 py-2 text-left text-sm hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2
                                {option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                {multiple 
                                    ? (selectedValues.includes(option.value) ? 'bg-surface-50 dark:bg-surface-700/50' : '')
                                    : (value === option.value ? 'bg-surface-50 dark:bg-surface-700/50 text-primary-600 dark:text-primary-400' : '')
                                }
                            "
                            onclick={() => handleOptionClick(option)}
                            disabled={option.disabled}
                        >
                            {#if multiple}
                                <input
                                    type="checkbox"
                                    class="siq-form-check-input"
                                    checked={selectedValues.includes(option.value)}
                                    readonly
                                    tabindex="-1"
                                />
                            {/if}
                            <span>{option.label}</span>
                        </button>
                    {/each}
                {/if}
            </div>
        {/if}
    </div>

    {#if error}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    {/if}

    {#if helpText && !error}
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">{helpText}</p>
    {/if}
</div>