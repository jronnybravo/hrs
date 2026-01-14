<script lang="ts">
    interface Props {
        value?: any;
        options?: Array<{ label: string; value: any; disabled?: boolean }>;
        placeholder?: string;
        label?: string;
        required?: boolean;
        disabled?: boolean;
        error?: string;
        helpText?: string;
        size?: 'sm' | 'md' | 'lg';
        searchable?: boolean;
        multiple?: boolean;
        clearable?: boolean;
        onchange?: (event: { value: any }) => void;
        onfocus?: (event: FocusEvent) => void;
        onblur?: (event: FocusEvent) => void;
        children?: import('svelte').Snippet;
    }

    let {
        value = $bindable(''),
        options = [],
        placeholder = 'Select an option',
        label = '',
        required = false,
        disabled = false,
        error = '',
        helpText = '',
        size = 'md',
        searchable = false,
        multiple = false,
        clearable = false,
        onchange,
        onfocus,
        onblur,
        children
    }: Props = $props();

    let dropdownElement: HTMLDivElement | undefined = $state();
    let dropdownMenu: HTMLDivElement | undefined = $state();
    let searchInput: HTMLInputElement | undefined = $state();
    let slotElement: HTMLDivElement | undefined = $state();
    let isOpen = $state(false);
    let searchTerm = $state('');
    let selectedValues: any[] = $state([]);
    let showAbove = $state(false);
    let slotOptions: Array<{ label: string; value: any; disabled?: boolean }> = $state([]);
    
    // Portal container for dropdown menu
    let portalContainer: HTMLDivElement | undefined = $state();
    
    // Throttling and scroll state
    let positionUpdateTimeout: number | undefined = $state();
    let isScrolling = $state(false);
    let scrollTimeout: ReturnType<typeof setTimeout> | undefined = $state();
    
    // Configuration for scroll behavior
    const CLOSE_ON_SCROLL = false; // Set to true to close dropdown when scrolling starts


    
    // Generate consistent IDs for ARIA attributes
    const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;
    const listboxId = `${dropdownId}-listbox`;

    // Extract options from slot content
    function extractSlotOptions(): Array<{ label: string; value: any; disabled?: boolean }> {
        if (!slotElement) return [];
        
        const optionElements = slotElement.querySelectorAll('option');
        return Array.from(optionElements).map((option: HTMLOptionElement) => {
            let value: any = option.value;
            const textContent = option.textContent?.trim() || '';
            
            // If no value attribute, use text content
            if (!option.hasAttribute('value')) {
                value = textContent;
            }
            
            // Try to parse numeric values
            const numValue = Number(value);
            if (!isNaN(numValue) && value !== '') {
                value = numValue;
            }
            
            return {
                label: textContent,
                value: value,
                disabled: option.disabled
            };
        });
    }

    // Update slot options when slot element is available
    function updateSlotOptions() {
        if (slotElement) {
            slotOptions = extractSlotOptions();
        }
    }

    // Observe changes in slot content
    let slotObserver: MutationObserver | null = $state(null);
    
    // Combine prop options with slot options
    let allOptions = $derived([...options, ...slotOptions]);

    // Filter options based on search term
    let filteredOptions = $derived(searchable 
        ? allOptions.filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allOptions);

    // Get display text for single select
    let displayText = $derived(multiple 
        ? selectedValues.length > 0 
            ? allOptions.filter(opt => selectedValues.includes(opt.value)).map(opt => opt.label).join(', ')
            : placeholder
        : allOptions.find(opt => opt.value === value)?.label || placeholder);

    function handleClick() {
        if (disabled) return;
        isOpen = !isOpen;
        
        // Don't manually handle portal creation here - let the effects handle it
    }
    
    function calculatePosition() {
        if (!dropdownElement || !dropdownMenu || !portalContainer) return;
        
        const triggerRect = dropdownElement.getBoundingClientRect();
        const menuHeight = dropdownMenu.offsetHeight;
        const menuWidth = dropdownElement.offsetWidth;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate available space
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const spaceLeft = triggerRect.left;
        const spaceRight = viewportWidth - triggerRect.right;
        
        // Determine vertical positioning
        showAbove = spaceBelow < menuHeight && spaceAbove > menuHeight;
        
        let top = showAbove 
            ? Math.max(0, triggerRect.top - menuHeight)
            : triggerRect.bottom;
            
        // Ensure dropdown doesn't go off screen vertically
        if (top + menuHeight > viewportHeight) {
            top = viewportHeight - menuHeight;
        }
        if (top < 0) {
            top = 0;
        }
        
        // Determine horizontal positioning
        let left = triggerRect.left;
        
        // Ensure dropdown doesn't go off screen horizontally
        if (left + menuWidth > viewportWidth) {
            left = Math.max(0, viewportWidth - menuWidth);
        }
        
        // Check if trigger is still visible in viewport
        const isVisible = triggerRect.bottom > 0 && 
                         triggerRect.top < viewportHeight && 
                         triggerRect.right > 0 && 
                         triggerRect.left < viewportWidth;
        
        // Apply position to portal container with visibility control
        portalContainer.style.cssText = `
            position: fixed;
            top: ${top}px;
            left: ${left}px;
            width: ${menuWidth}px;
            min-width: ${menuWidth}px;
            z-index: 9999;
            pointer-events: ${!isVisible ? 'none' : 'auto'};
            opacity: ${!isVisible || isScrolling ? '0' : '1'};
            transform: ${!isVisible || isScrolling ? 'translateY(-4px) scale(0.98)' : 'translateY(0) scale(1)'};
            transition: opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
            box-sizing: border-box;
            transform-origin: top;
        `;
        
        // Enable pointer events on the dropdown menu itself
        if (dropdownMenu) {
            dropdownMenu.style.pointerEvents = 'auto';
        }
    }
    
    function throttledCalculatePosition() {
        if (positionUpdateTimeout) {
            cancelAnimationFrame(positionUpdateTimeout);
        }
        
        positionUpdateTimeout = requestAnimationFrame(() => {
            calculatePosition();
        });
    }
    
    function createPortal() {
        if (portalContainer) return; // Already exists
        
        portalContainer = document.createElement('div');
        portalContainer.setAttribute('data-dropdown-portal', dropdownId);
        portalContainer.style.pointerEvents = 'none'; // Will be enabled on menu
        
        // Prevent events from bubbling up from the portal
        portalContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        document.body.appendChild(portalContainer);
    }
    
    function destroyPortal() {
        if (portalContainer && portalContainer.parentNode) {
            // Remove all event listeners from portal content
            const buttons = portalContainer.querySelectorAll('button');
            buttons.forEach(button => {
                button.removeEventListener('click', () => {});
            });
            
            const inputs = portalContainer.querySelectorAll('input');
            inputs.forEach(input => {
                input.removeEventListener('input', () => {});
            });
            
            portalContainer.parentNode.removeChild(portalContainer);
        }
        portalContainer = undefined;
        dropdownMenu = undefined;
        searchInput = undefined;
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
            isOpen = false;
        }
        
        onchange?.({ value });
    }

    function handleClear() {
        if (multiple) {
            selectedValues = [];
            value = [];
        } else {
            value = '';
        }
        onchange?.({ value });
    }

    function handleSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        searchTerm = target.value;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            isOpen = false;
        }
    }

    function handleFocus(event: FocusEvent) {
        onfocus?.(event);
    }

    function handleBlur(event: FocusEvent) {
        // Don't auto-close on blur since we're using portal - rely on click outside instead
        onblur?.(event);
    }

    // Handle cleanup only
    $effect(() => {        
        return () => {
            // Clean up observer
            if (slotObserver) {
                slotObserver.disconnect();
                slotObserver = null;
            }
        };
    });

    // Initialize selected values for multiple select
    $effect(() => {
        if (multiple) {
            if (Array.isArray(value)) {
                selectedValues = value;
            } else {
                selectedValues = [];
                value = [];
            }
        } else {
            selectedValues = [];
        }
    });

    // Handle slot content changes
    $effect(() => {
        if (slotElement && !slotObserver) {
            updateSlotOptions();
            
            // Watch for changes in slot content
            slotObserver = new MutationObserver(() => {
                updateSlotOptions();
            });
            
            slotObserver.observe(slotElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['value', 'disabled']
            });
        }
    });



    // Handle portal lifecycle only
    $effect(() => {
        if (isOpen) {
            createPortal();
            
            // Handle scroll state management
            const handleScrollStart = () => {
                if (CLOSE_ON_SCROLL) {
                    isOpen = false;
                    return;
                }
                
                isScrolling = true;
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                throttledCalculatePosition();
            };
            
            const handleScrollEnd = () => {
                if (CLOSE_ON_SCROLL) return;
                
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                    calculatePosition();
                }, 100);
            };
            
            const handleScroll = () => {
                handleScrollStart();
                handleScrollEnd();
            };
            
            const handleResize = () => {
                throttledCalculatePosition();
            };
            
            // Add event listeners for position updates
            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', handleResize, { passive: true });
            
            // Also listen for scroll on scrollable parents
            let element = dropdownElement?.parentElement;
            const scrollElements: Element[] = [];
            while (element && element !== document.body) {
                const style = window.getComputedStyle(element);
                if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    element.addEventListener('scroll', handleScroll, { passive: true });
                    scrollElements.push(element);
                }
                element = element.parentElement;
            }
            
            // Handle click outside to close dropdown
            const handleClickOutside = (e: MouseEvent) => {
                const target = e.target as Node;
                if (
                    dropdownElement && 
                    !dropdownElement.contains(target) && 
                    portalContainer && 
                    !portalContainer.contains(target)
                ) {
                    isOpen = false;
                }
            };
            
            // Use setTimeout to avoid immediate closure when opening
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
            
            return () => {
                // Clear timeouts and animation frames
                if (positionUpdateTimeout) {
                    cancelAnimationFrame(positionUpdateTimeout);
                }
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                
                // Remove event listeners
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('click', handleClickOutside);
                scrollElements.forEach(el => {
                    el.removeEventListener('scroll', handleScroll);
                });
            };
        } else {
            destroyPortal();
            
            // Reset scroll state
            isScrolling = false;
            if (positionUpdateTimeout) {
                cancelAnimationFrame(positionUpdateTimeout);
                positionUpdateTimeout = undefined;
            }
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
                scrollTimeout = undefined;
            }
        }
    });
    
    // Handle dropdown content rendering with dependency tracking
    let lastRenderState = $state({ 
        isOpen: false,
        filteredOptionsLength: 0, 
        searchTerm: '', 
        selectedValuesStr: '', 
        valueStr: '' 
    });
    
    $effect(() => {
        if (isOpen && portalContainer) {
            // Only re-render if something actually changed OR if we just opened
            const currentState = {
                isOpen: isOpen,
                filteredOptionsLength: filteredOptions.length,
                searchTerm: searchTerm,
                selectedValuesStr: JSON.stringify(selectedValues),
                valueStr: JSON.stringify(value)
            };
            
            const hasChanged = 
                lastRenderState.isOpen !== currentState.isOpen ||
                lastRenderState.filteredOptionsLength !== currentState.filteredOptionsLength ||
                lastRenderState.searchTerm !== currentState.searchTerm ||
                lastRenderState.selectedValuesStr !== currentState.selectedValuesStr ||
                lastRenderState.valueStr !== currentState.valueStr;
            
            if (hasChanged) {
                lastRenderState = currentState;
                renderDropdownInPortal();
                
                // Position and focus after rendering
                setTimeout(() => {
                    calculatePosition();
                    if (searchable && searchInput) {
                        searchInput.focus();
                    }
                }, 0);
            }
        } else if (!isOpen) {
            // Reset state when closed
            lastRenderState = { 
                isOpen: false,
                filteredOptionsLength: 0, 
                searchTerm: '', 
                selectedValuesStr: '', 
                valueStr: '' 
            };
        }
    });
    
    function renderDropdownInPortal() {
        if (!portalContainer) return;
        
        // Clear existing content and event listeners
        portalContainer.innerHTML = '';
        
        // Create dropdown menu element
        const dropdownMenuEl = document.createElement('div');
        dropdownMenuEl.id = listboxId;
                dropdownMenuEl.className = 'siq-dropdown-menu w-full max-h-60 overflow-auto text-sm';
        dropdownMenuEl.style.cssText = `
            animation: dropdownFadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
        `;
        dropdownMenuEl.setAttribute('role', 'listbox');
        
        // Ensure dropdown menu matches the control width and font size exactly
        dropdownMenuEl.style.width = '100%';
        dropdownMenuEl.style.boxSizing = 'border-box';
        dropdownMenuEl.style.minWidth = '0'; // Override min-w-max from CSS
        
        // Get font size from the original control element
        if (dropdownElement) {
            const controlStyles = window.getComputedStyle(dropdownElement.querySelector('.siq-form-control') || dropdownElement);
            dropdownMenuEl.style.fontSize = controlStyles.fontSize;
            dropdownMenuEl.style.fontFamily = controlStyles.fontFamily;
            dropdownMenuEl.style.lineHeight = controlStyles.lineHeight;
        }
        
        // Add search input if searchable
        if (searchable) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'px-4 py-2 border-b border-surface-200 dark:border-surface-700';
            
            const searchInputEl = document.createElement('input');
            searchInputEl.type = 'text';
            searchInputEl.placeholder = 'Search...';
            searchInputEl.className = `siq-form-control w-full ${sizeClasses[size]} border-0 bg-transparent focus:ring-0 focus:border-0`;
            searchInputEl.value = searchTerm;
            searchInputEl.style.fontSize = 'inherit';
            searchInputEl.style.padding = '0.5rem 0.75rem';
            
            // Handle search input without causing infinite loop
            searchInputEl.addEventListener('input', (e) => {
                e.stopPropagation();
                const target = e.target as HTMLInputElement;
                searchTerm = target.value;
                // Don't call renderDropdownInPortal here - let the effect handle it
            });
            
            searchContainer.appendChild(searchInputEl);
            dropdownMenuEl.appendChild(searchContainer);
            searchInput = searchInputEl;
        }
        
        // Add options
        if (filteredOptions.length === 0) {
            const noOptionsEl = document.createElement('div');
            noOptionsEl.className = `px-4 py-2 text-surface-500 dark:text-surface-400 ${sizeClasses[size]}`;
            noOptionsEl.textContent = 'No options found';
            noOptionsEl.style.fontSize = 'inherit';
            dropdownMenuEl.appendChild(noOptionsEl);
        } else {
            filteredOptions.forEach(option => {
                const buttonEl = document.createElement('button');
                buttonEl.type = 'button';
                buttonEl.className = `siq-dropdown-item w-full text-left ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
                
                // Add selection styling
                if (multiple) {
                    if (selectedValues.includes(option.value)) {
                        buttonEl.className += ' bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400';
                    }
                } else {
                    if (value === option.value) {
                        buttonEl.className += ' bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400';
                    }
                }
                
                buttonEl.disabled = option.disabled || false;
                
                // Override the default siq-dropdown-item font size to inherit from parent
                buttonEl.style.fontSize = 'inherit';
                buttonEl.style.width = '100%';
                buttonEl.style.boxSizing = 'border-box';
                
                // Match padding based on control size
                const padding = size === 'sm' ? '0.375rem 0.75rem' : size === 'lg' ? '0.75rem 1rem' : '0.5rem 0.75rem';
                buttonEl.style.padding = padding;
                
                // Set content
                if (multiple) {
                    const span = document.createElement('span');
                    span.className = 'flex items-center w-full';
                    span.style.fontSize = 'inherit';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'siq-form-check-input mr-2 flex-shrink-0';
                    checkbox.checked = selectedValues.includes(option.value);
                    checkbox.readOnly = true;
                    checkbox.style.margin = '0 0.5rem 0 0';
                    
                    const labelText = document.createElement('span');
                    labelText.textContent = option.label;
                    labelText.style.fontSize = 'inherit';
                    labelText.className = 'flex-1 truncate';
                    
                    span.appendChild(checkbox);
                    span.appendChild(labelText);
                    buttonEl.appendChild(span);
                } else {
                    buttonEl.textContent = option.label;
                }
                
                // Handle click without causing infinite loop
                buttonEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!option.disabled) {
                        handleOptionClick(option);
                        // Don't call renderDropdownInPortal here - let the effect handle it
                    }
                });
                
                dropdownMenuEl.appendChild(buttonEl);
            });
        }
        
        portalContainer.appendChild(dropdownMenuEl);
        dropdownMenu = dropdownMenuEl;
    }







    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: '',
        lg: 'siq-btn-lg'
    };
</script>

<div class="w-full" bind:this={dropdownElement}>
    {#if label}
        <label for="dropdown-{Math.random().toString(36).substr(2, 9)}" class="siq-form-label">
            {label}
            {#if required}
                <span class="text-red-500 ml-1">*</span>
            {/if}
        </label>
    {/if}

    <div class="relative">
        <div
            id={dropdownId}
            class="
                siq-form-control w-full text-left
                {sizeClasses[size]}
                {error ? 'border-red-500 dark:border-red-400' : ''}
            "
            class:opacity-50={disabled}
            class:cursor-not-allowed={disabled}
            onclick={handleClick}
            onfocus={handleFocus}
            onblur={handleBlur}
            onkeydown={handleKeydown}
            role="combobox"
            tabindex={disabled ? -1 : 0}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-disabled={disabled}
        >
            <div class="flex items-center gap-1 flex-wrap">
                {#if multiple && selectedValues.length > 0}
                    {#each selectedValues as selectedValue}
                        {@const selectedOption = allOptions.find(opt => opt.value === selectedValue)}
                        {#if selectedOption}
                            <span class="siq-badge siq-badge-light inline-flex items-center gap-1">
                                {selectedOption.label}
                                <button
                                    type="button"
                                    class="hover:bg-surface-300 dark:hover:bg-surface-700 rounded-full p-0.5 -mr-1 transition-colors duration-150"
                                    onclick={(e) => { e.stopPropagation(); handleOptionClick(selectedOption); }}
                                    aria-label="Remove {selectedOption.label}"
                                >
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </span>
                        {/if}
                    {/each}
                {:else}
                    <span class="text-surface-500 dark:text-surface-400">{displayText}</span>
                {/if}
            </div>
            <span class="absolute inset-y-0 right-0 flex items-center pr-2">
                {#if clearable && ((multiple && selectedValues.length > 0) || (!multiple && value))}
                    <span
                        class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 mr-1 cursor-pointer pointer-events-auto"
                        onclick={(e) => { e.stopPropagation(); handleClear(); }}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) => e.key === 'Enter' && handleClear()}
                        aria-label="Clear selection"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </span>
                {/if}
                <svg 
                    class="w-4 h-4 text-surface-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''} pointer-events-none" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </span>
        </div>

        <!-- Dropdown menu will be rendered in portal -->
    </div>

    {#if error}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    {/if}

    {#if helpText && !error}
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">{helpText}</p>
    {/if}

    <!-- Hidden slot container for parsing option elements -->
    <div bind:this={slotElement} class="hidden">
        {@render children?.()}
    </div>
</div>

<style>
    :global(.siq-dropdown-menu) {
        --dropdown-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        box-shadow: var(--dropdown-shadow);
        border-radius: 0.5rem;
    }
</style>