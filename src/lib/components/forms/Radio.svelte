<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let value: any = '';
    export let name: string = '';
    export let label: string = '';
    export let disabled: boolean = false;
    export let required: boolean = false;
    export let error: string = '';
    export let helpText: string = '';
    export let size: 'sm' | 'md' | 'lg' = 'md';

    const dispatch = createEventDispatcher<{
        change: { value: any };
        focus: FocusEvent;
        blur: FocusEvent;
    }>();

    let radioElement: HTMLInputElement;

    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        value = target.value;
        dispatch('change', { value });
    }

    function handleFocus(event: FocusEvent) {
        dispatch('focus', event);
    }

    function handleBlur(event: FocusEvent) {
        dispatch('blur', event);
    }

    // Expose focus method
    export function focus() {
        radioElement?.focus();
    }

    // Expose blur method
    export function blur() {
        radioElement?.blur();
    }

    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const labelSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };
</script>

<div class="siq-form-check">
    <input
        bind:this={radioElement}
        type="radio"
        class="siq-form-check-input {sizeClasses[size]}"
        class:opacity-50={disabled}
        class:cursor-not-allowed={disabled}
        id="radio-{Math.random().toString(36).substr(2, 9)}"
        {name}
        {value}
        {disabled}
        {required}
        on:change={handleChange}
        on:focus={handleFocus}
        on:blur={handleBlur}
    />
    
    {#if label}
        <label for="radio-{Math.random().toString(36).substr(2, 9)}" class="siq-form-check-label {labelSizeClasses[size]} {error ? 'text-red-600 dark:text-red-400' : ''}">
            {label}
            {#if required}
                <span class="text-red-500 ml-1">*</span>
            {/if}
        </label>
    {/if}
</div>

{#if error}
    <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
{/if}

{#if helpText && !error}
    <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">{helpText}</p>
{/if}
