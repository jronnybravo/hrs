<script lang="ts">
    export interface BreadcrumbItem {
        label: string;
        href?: string;
        iconClass?: string;
        class?: string;
        target?: string;
        onClick?: () => void;
        disabled?: boolean;
    }

    export interface BreadcrumbTheme {
        container?: string;
        list?: string;
        item?: string;
        link?: string;
        current?: string;
        separator?: string;
        icon?: string;
    }

    // Props
    let { 
        items = [],
        // Home/Root configuration
        showHome = false,
        homeHref = "",
        homeLabel = "",
        homeIconClass = "bi-house-door-fill",
        homeClass = "",
        // Styling and behavior
        maxItems = 0,
        collapseFrom = 'middle',
        collapseText = '...',
        theme = {} as Partial<BreadcrumbTheme>,
        // Accessibility
        ariaLabel = "breadcrumb",
        // Additional classes
        class: additionalClass = "",
        // Callbacks
        onItemClick = undefined as ((item: BreadcrumbItem, index: number) => void) | undefined
    }: {
        items: BreadcrumbItem[];
        showHome?: boolean;
        homeHref?: string;
        homeLabel?: string;
        homeIconClass?: string;
        homeClass?: string;
        maxItems?: number;
        collapseFrom?: 'start' | 'middle' | 'end';
        collapseText?: string;
        theme?: Partial<BreadcrumbTheme>;
        ariaLabel?: string;
        class?: string;
        onItemClick?: (item: BreadcrumbItem, index: number) => void;
    } = $props();

    // Default theme with Tailwind classes
    const defaultTheme: BreadcrumbTheme = {
        container: "",
        list: "flex items-center space-x-2",
        item: "flex items-center",
        link: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors",
        current: "text-gray-900 dark:text-gray-100",
        separator: "text-gray-400 dark:text-gray-500 mr-2",
        icon: "mr-1"
    };

    // Merge themes
    let appliedTheme = $derived({ ...defaultTheme, ...theme });

    // Home item configuration
    let homeItem = $derived((showHome && homeLabel) ? {
        label: homeLabel,
        href: homeHref,
        iconClass: homeIconClass,
        class: homeClass
    } as BreadcrumbItem : null);

    // Process items with home and collapse logic
    let processedItems = $derived((() => {
        let allItems = homeItem ? [homeItem, ...items] : [...items];
        
        // Apply collapse logic if maxItems is set
        if (maxItems > 0 && allItems.length > maxItems) {
            if (collapseFrom === 'start') {
                const keep = maxItems - 1;
                allItems = [
                    { label: collapseText, disabled: true } as BreadcrumbItem,
                    ...allItems.slice(-keep)
                ];
            } else if (collapseFrom === 'end') {
                const keep = maxItems - 1;
                allItems = [
                    ...allItems.slice(0, keep),
                    { label: collapseText, disabled: true } as BreadcrumbItem
                ];
            } else { // middle
                const keepStart = Math.floor((maxItems - 1) / 2);
                const keepEnd = Math.ceil((maxItems - 1) / 2);
                allItems = [
                    ...allItems.slice(0, keepStart),
                    { label: collapseText, disabled: true } as BreadcrumbItem,
                    ...allItems.slice(-keepEnd)
                ];
            }
        }
        
        return allItems;
    })());

    // Handle item click
    function handleItemClick(item: BreadcrumbItem, index: number, event: Event) {
        if (item.disabled) {
            event.preventDefault();
            return;
        }
        
        if (item.onClick) {
            event.preventDefault();
            item.onClick();
        }
        
        if (onItemClick) {
            onItemClick(item, index);
        }
    }

    // Check if current item
    function isCurrentItem(index: number): boolean {
        return index === processedItems.length - 1;
    }

</script>

<nav aria-label={ariaLabel} class="{appliedTheme.container} {additionalClass}">
    <ol class={appliedTheme.list}>
        {#each processedItems as item, index}
            <li class="{appliedTheme.item} {item.class || ''}">
                {#if index > 0}
                    <i class="bi-chevron-right {appliedTheme.separator} text-sm"></i>
                {/if}
                
                {#if item.href && !item.disabled && !isCurrentItem(index)}
                    <a
                        href={item.href}
                        class={appliedTheme.link}
                        target={item.target}
                        onclick={(e) => handleItemClick(item, index, e)}
                    >
                        {#if item.iconClass}
                            <i class="{item.iconClass} {appliedTheme.icon}"></i>
                        {/if}
                        {item.label}
                    </a>
                {:else if item.disabled}
                    <span class="text-gray-400 dark:text-gray-500">
                        {#if item.iconClass}
                            <i class="{item.iconClass} {appliedTheme.icon}"></i>
                        {/if}
                        {item.label}
                    </span>
                {:else}
                    <span class={appliedTheme.current}>
                        {#if item.iconClass}
                            <i class="{item.iconClass} {appliedTheme.icon}"></i>
                        {/if}
                        {item.label}
                    </span>
                {/if}
            </li>
        {/each}
    </ol>
</nav>
