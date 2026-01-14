<script lang="ts">
    interface Props {
        currentPage?: number;
        totalPages?: number;
        maxVisiblePages?: number;
        onPageChange?: (page: number) => void;
    }
    
    let { 
        currentPage = 1, 
        totalPages = 1, 
        maxVisiblePages = 5,
        onPageChange 
    }: Props = $props();
    
    function handlePageChange(page: number) {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange?.(page);
        }
    }

    const visiblePages = $derived.by(() => {
        const pages: number[] = [];
        const half = Math.floor(maxVisiblePages / 2);
        
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisiblePages - 1);
        
        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return pages;
    });
</script>

{#if totalPages > 1}
    <div class="siq-pagination">
        {#if !visiblePages.includes(1)}
            <div class="siq-page-item" class:disabled={currentPage === 1}>
                <button onclick={() => handlePageChange(1)}
                    class="siq-page-link"
                    title="First page"
                    aria-label="Go to first page">
                    <i class="bi bi-chevron-double-left"></i>
                </button>
            </div>
        {/if}
        <div class="siq-page-item" class:disabled={currentPage === 1}>
            <button onclick={() => handlePageChange(currentPage - 1)}
                class="siq-page-link"
                title="Previous page"
                aria-label="Go to previous page">
                <i class="bi bi-chevron-left"></i>
            </button>
        </div>
        {#each visiblePages as page}
            {@const activeClass = page === currentPage ? 'active' : ''}
            <div class="siq-page-item {activeClass}">
                <button onclick={() => handlePageChange(page)}
                    class="siq-page-link"
                    aria-label="Go to page {page}">
                    {page}
                </button>
            </div>
        {/each}
        <div class="siq-page-item" class:disabled={currentPage === totalPages}>
            <button onclick={() => handlePageChange(currentPage + 1)}
                class="siq-page-link"
                title="Next page"
                aria-label="Go to next page">
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
        {#if !visiblePages.includes(totalPages)}
            <div class="siq-page-item" class:disabled={currentPage === totalPages}>
                <button onclick={() => handlePageChange(totalPages)}
                    class="siq-page-link"
                    title="Last page"
                    aria-label="Go to last page">
                    <i class="bi bi-chevron-double-right"></i>
                </button>
            </div>
        {/if}
    </div>
{/if}