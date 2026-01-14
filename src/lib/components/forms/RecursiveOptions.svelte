<script lang="ts">
    import RecursiveOptions from './RecursiveOptions.svelte';

    export let items: any[] = [];
    export let level: number = 0;

    export let nameField = 'name';
    export let valueField = 'id';
    export let childrenField = 'children';

    const getIndent = (lvl: number) => '—'.repeat(lvl);
</script>

{#each items as item}
    <option value={item[valueField]}>
        {getIndent(level)} {item[nameField]}
    </option>
    {#if item[childrenField]?.length}
        <RecursiveOptions items={item[childrenField]} level={level + 1} />
    {/if}
{/each}