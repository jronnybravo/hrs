<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { PlaceCategory, EventCategory } from '$lib/entities/Category';

    $effect(() => {
        dispatch('change', { selectedIds });
    });
    // Store refs to checkbox elements by categoryId
    let checkboxRefs: Record<number, HTMLInputElement | null> = $state({});

    $effect(() => {
        // 1. Reset all checkboxes: unchecked and not indeterminate
        for (const cat of flatCategories) {
            const el = checkboxRefs[cat.id];
            if (el) {
                el.checked = selectedIds.includes(cat.id);
                el.indeterminate = false;
            }
        }
        // 4. Ensure directly selected categories are always checked (already handled above)

        // 2. If a parent is checked directly, all descendants are indeterminate (partial) and unchecked
        function setDescendantsIndeterminate(parentId: number) {
            const parent = categoryMap.get(parentId);
            if (!parent) return;
            if (isCategoryDirectlySelected(parentId)) {
                for (const childId of parent.children) {
                    const childEl = checkboxRefs[childId];
                    if (childEl && !isCategoryDirectlySelected(childId)) {
                        childEl.checked = false;
                        childEl.indeterminate = true;
                    }
                    setDescendantsIndeterminate(childId);
                }
            } else {
                for (const childId of parent.children) {
                    setDescendantsIndeterminate(childId);
                }
            }
        }
        for (const selectedId of selectedIds) {
            setDescendantsIndeterminate(selectedId);
        }

        // 3. If a child is checked, traverse up ancestors
        for (const selectedId of selectedIds) {
            let cat = categoryMap.get(selectedId);
            while (cat && cat.parentId) {
                const parent = categoryMap.get(cat.parentId);
                if (!parent) break;
                const parentEl = checkboxRefs[parent.id];
                const allChildrenChecked = parent.children.every(cid => selectedIds.includes(cid));
                if (parentEl) {
                    if (allChildrenChecked) {
                        parentEl.checked = true;
                        parentEl.indeterminate = false;
                        // Do NOT set children to indeterminate or unchecked here
                    } else {
                        parentEl.checked = false;
                        parentEl.indeterminate = true;
                    }
                }
                cat = parent;
            }
        }
    });

    // Track expanded state for each category
    let expanded: Record<number, boolean> = $state({});

    function toggleExpand(categoryId: number) {
        expanded[categoryId] = !expanded[categoryId];
    }
    
    interface Props {
        categories: PlaceCategory[] | EventCategory[];
        selectedIds: number[];
        disabled?: boolean;
        placeholder?: string;
        id?: string;
    }
    
    let { 
        categories = [], 
        selectedIds = $bindable([]), 
        disabled = false, 
        placeholder = "Select categories",
        id = `category-selector-${Math.random().toString(36).substr(2, 9)}`
    }: Props = $props();
    
    const dispatch = createEventDispatcher<{
        change: { selectedIds: number[] }
    }>();
    
    // Convert tree structure to flat structure with metadata
    interface FlatCategory {
        id: number;
        name: string;
        parentId: number | null;
        level: number;
        path: string;
        hasChildren: boolean;
        children: number[]; // Array of child IDs
    }
    

    let flatCategories: FlatCategory[] = $state([]);
    let categoryMap: Map<number, FlatCategory> = $state(new Map());
    let isOpen = $state(false);
    
    // Build flat structure and category relationships
    $effect(() => {
        if (categories?.length > 0) {
            buildFlatStructure();
        }
    });
    
    function buildFlatStructure() {
        const flat: FlatCategory[] = [];
        const map = new Map<number, FlatCategory>();
        
        function processCategories(cats: any[], level = 0, parentPath = '') {
            for (const cat of cats) {
                const path = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
                const children = cat.children?.map((c: any) => c.id) || [];
                
                const flatCat: FlatCategory = {
                    id: cat.id,
                    name: cat.name,
                    parentId: cat.parentId || null,
                    level,
                    path,
                    hasChildren: children.length > 0,
                    children
                };
                
                flat.push(flatCat);
                map.set(cat.id, flatCat);
                
                if (cat.children?.length > 0) {
                    processCategories(cat.children, level + 1, path);
                }
            }
        }
        
        processCategories(categories);
        flatCategories = flat;
        categoryMap = map;
    }
    
    function isDescendantOf(childId: number, ancestorId: number): boolean {
        const child = categoryMap.get(childId);
        if (!child || !child.parentId) return false;
        
        if (child.parentId === ancestorId) return true;
        return isDescendantOf(child.parentId, ancestorId);
    }

    function deselectCategoryAndDescendants(categoryId: number, selected: number[]): number[] {
        const category = categoryMap.get(categoryId);
        if (!category) return selected;
        
        let result = selected.filter(id => id !== categoryId);
        
        // Remove all descendants if they exist
        result = result.filter(id => !isDescendantOf(id, categoryId));
        
        // If parent was selected (meaning this category was inherited), 
        // we need to expand the parent selection to individual siblings
        if (category.parentId && selected.includes(category.parentId)) {
            const parent = categoryMap.get(category.parentId);
            if (parent && parent.hasChildren) {
                // Remove parent from selection
                result = result.filter(id => id !== category.parentId);
                
                // Add all siblings except the one being deselected
                for (const siblingId of parent.children) {
                    if (siblingId !== categoryId && !result.includes(siblingId)) {
                        result.push(siblingId);
                    }
                }
            }
        }
        
        return result;
    }
    
    function isCategorySelected(categoryId: number): boolean {
        // A category is considered selected if:
        // 1. It's directly selected, OR
        // 2. One of its ancestors is selected
        if (selectedIds.includes(categoryId)) return true;
        
        const category = categoryMap.get(categoryId);
        if (!category || !category.parentId) return false;
        
        return isCategorySelected(category.parentId);
    }
    
    function isCategoryDirectlySelected(categoryId: number): boolean {
        return selectedIds.includes(categoryId);
    }
    
    function getSelectedCategories(): FlatCategory[] {
        return selectedIds
            .map(id => categoryMap.get(id))
            .filter(cat => cat !== undefined)
            .sort((a, b) => a.level - b.level);
    }
    
    function toggleCategory(categoryId: number, event: Event) {
        event.stopPropagation();
        const category = categoryMap.get(categoryId);
        if (!category) return;
        let newSelected = [...selectedIds];
        const isCurrentlySelected = selectedIds.includes(categoryId);
        if (isCurrentlySelected) {
            // Deselecting: remove only this category
            newSelected = newSelected.filter(id => id !== categoryId);
        } else {
            // Selecting: add only this category
            newSelected.push(categoryId);
        }
        selectedIds = newSelected;
        dispatch('change', { selectedIds: newSelected });
    }
    
    function removeCategory(categoryId: number, event: Event) {
        event.stopPropagation();
        // Deselect the category and all its descendants
        let newSelected = deselectCategoryAndDescendants(categoryId, selectedIds);
        selectedIds = newSelected;
        dispatch('change', { selectedIds: newSelected });
    }
</script>

<!-- Category Tree Selector -->
<div class="relative">
    <!-- Dropdown trigger -->
    <div
        class="siq-form-control w-full text-left cursor-pointer transition-all duration-200 ease-in-out hover:border-primary-400 dark:hover:border-primary-600 focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
        class:opacity-50={disabled}
        class:cursor-not-allowed={disabled}
        onclick={() => !disabled && (isOpen = !isOpen)}
        onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                !disabled && (isOpen = !isOpen);
            }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        aria-controls="{id}-dropdown"
        tabindex={disabled ? -1 : 0}
        role="combobox"
    >
        <div class="flex items-center justify-between min-h-[2.5rem] py-2">
            <div class="flex-1 min-w-0">
                {#if getSelectedCategories().length > 0}
                    <div class="flex flex-wrap gap-2">
                        {#each getSelectedCategories() as category}
                            <span class="siq-badge siq-badge-primary siq-badge-sm inline-flex items-center gap-1">
                                <span class="truncate max-w-[200px]">{category.path}</span>
                                {#if !disabled}
                                    <button
                                        type="button"
                                        class="ml-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors rounded-full p-0.5 -mr-1 flex-shrink-0"
                                        onclick={(e) => removeCategory(category.id, e)}
                                        onkeydown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                removeCategory(category.id, e);
                                            }
                                        }}
                                        aria-label="Remove {category.name}"
                                        tabindex="0"
                                    >
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                {/if}
                            </span>
                        {/each}
                    </div>
                {:else}
                    <span class="text-surface-500 dark:text-surface-400">{placeholder}</span>
                {/if}
            </div>
            <svg 
                class="w-5 h-5 text-surface-400 dark:text-surface-500 transition-transform duration-200 flex-shrink-0 ml-2 {isOpen ? 'rotate-180' : ''}" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </div>

    <!-- Dropdown menu -->
    {#if isOpen}
        <div id="{id}-dropdown" class="siq-dropdown-menu w-full mt-1 max-h-80 overflow-auto">
            <div class="py-2">
                {#each flatCategories as category (category.id)}
                    {#if !category.parentId || expanded[category.parentId]}
                        <div
                            class="flex items-center py-2 px-4 text-sm select-none transition-colors duration-150 ease-in-out hover:bg-surface-100 dark:hover:bg-surface-700"
                            class:opacity-50={disabled}
                            class:cursor-not-allowed={disabled}
                            class:bg-surface-100={isCategorySelected(category.id)}
                            class:dark:bg-surface-700={isCategorySelected(category.id)}
                            class:border-l-4={isCategorySelected(category.id)}
                            class:border-primary-500={isCategorySelected(category.id)}
                            class:text-primary-700={isCategorySelected(category.id)}
                            class:dark:text-primary-500={isCategorySelected(category.id)}
                            style="padding-left: {category.level * 1.5 + 1}rem;"
                        >
                            <!-- Expand/Collapse button -->
                            {#if category.hasChildren}
                                <button
                                    type="button"
                                    class="mr-3 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 bg-transparent border-none p-1 cursor-pointer flex-shrink-0 rounded transition-colors duration-150"
                                    class:text-primary-600={isCategorySelected(category.id)}
                                    class:dark:text-primary-500={isCategorySelected(category.id)}
                                    onclick={() => toggleExpand(category.id)}
                                    aria-label={expanded[category.id] ? 'Collapse' : 'Expand'}
                                >
                                    <svg class="w-4 h-4 transition-transform duration-200 {expanded[category.id] ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            {:else}
                                <span class="w-6 h-6 mr-3 flex-shrink-0"></span>
                            {/if}

                            <!-- Checkbox -->
                            <input
                                type="checkbox"
                                class="siq-checkbox mr-3 flex-shrink-0"
                                checked={selectedIds.includes(category.id)}
                                disabled={disabled}
                                bind:this={checkboxRefs[category.id]}
                                onchange={(e) => {
                                    e.stopPropagation();
                                    toggleCategory(category.id, e);
                                }}
                                tabindex="-1"
                                aria-label={category.name}
                            />

                            <!-- Category name -->
                            <button
                                type="button"
                                class="flex-1 text-left truncate font-medium bg-transparent border-none p-0 m-0 cursor-pointer transition-colors duration-150 hover:text-primary-600 dark:hover:text-primary-400"
                                class:text-surface-700={isCategorySelected(category.id)}
                                class:dark:text-white={isCategorySelected(category.id)}
                                class:text-surface-800={!isCategorySelected(category.id)}
                                class:dark:text-surface-100={!isCategorySelected(category.id)}
                                onclick={(e) => {
                                    e.stopPropagation();
                                    toggleCategory(category.id, e);
                                }}
                                aria-label={category.name}
                            >
                                {category.name}
                            </button>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}

    <!-- Click outside to close -->
    {#if isOpen}
        <div 
            class="fixed inset-0 z-40" 
            role="button"
            tabindex="-1"
            onclick={() => isOpen = false}
            onkeydown={(e) => {
                if (e.key === 'Escape') {
                    isOpen = false;
                }
            }}
        ></div>
    {/if}
</div>