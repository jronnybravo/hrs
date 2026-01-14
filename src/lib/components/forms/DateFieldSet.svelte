<script lang="ts">
    import { onMount } from 'svelte';
    import Select from './Select.svelte';

    let {
        id,
        legend,
        value = $bindable(null),
        class: classes = '',
        required = false,
        disabled = false,
        onchange,
    }: {
        id?: string;
        legend?: string;
        value?: Date | string | null;
        class?: string;
        required?: boolean;
        disabled?: boolean;
        onchange?: (event?: Event) => void;
    } = $props();

    let year: number | '' = $state('');
    let month: number | '' = $state('');
    let day: number | '' = $state('');

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // Helper function to get days in month
    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }
    
    let daysAvailable = $derived.by(() => {
        const YYYY = year || currentYear;
        const MM = month || 1;
        return getDaysInMonth(YYYY, MM);
    });

    function _onchange(event?: Event) {
        if(day && (day > daysAvailable)) {
            day = daysAvailable;
        }

        if(year && month && day) {
            value = new Date(Date.UTC(year, month - 1, day));
        } else {
            value = null;
        }

        onchange?.(event);
    }

    $effect(() => {
        if(typeof value == 'string') {
            value = new Date(value);
        }
    });

    onMount(() => {
        if (value instanceof Date) {
            year = value.getFullYear();
            month = value.getMonth() + 1;
            day = value.getDate();
        }
    });
</script>

<fieldset {id} class={classes}>
    {#if legend}
        <legend>{legend}</legend>
    {/if}
    <div class="grid grid-cols-3 gap-2">
        <div>
            <Select bind:value={month}
                onchange={_onchange}
                placeholder="Month"
                {disabled}
                {required}>
                {#each months as month, index}
                    <option value={index + 1}>{month}</option>
                {/each}
            </Select>
        </div>
        <div>
            <Select bind:value={day}
                onchange={_onchange}
                placeholder="Day"
                {disabled}
                {required}>
                {#each days as day}
                    {@const isAvailable = day <= daysAvailable}
                    <option value={day}
                        class:hidden={ !isAvailable }>
                        {day}
                    </option>
                {/each}
            </Select>
        </div>
        <div>
            <Select bind:value={year}
                onchange={_onchange}
                placeholder="Year"
                {disabled}
                {required}>
                {#each years as year}
                    <option value={year}>{year}</option>
                {/each}
            </Select>
        </div>
    </div>
</fieldset>
