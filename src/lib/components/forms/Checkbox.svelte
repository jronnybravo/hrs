<script lang="ts">

    let {
        id = `checkbox-${Math.random().toString(36).substr(2, 9)}`,
        checked = $bindable(false),
        label = '',
        disabled = false,
        required = false,
        error = '',
        helpText = '',
        size = 'md',
        class: className = '',
        onchange,
        onfocus,
        onblur,
    } = $props<{
        id?: string;
        checked: boolean;
        label?: string;
        disabled?: boolean;
        required?: boolean;
        error?: string;
        helpText?: string;
        size?: 'sm' | 'md' | 'lg';
        class?: string;
        onchange?: () => void;
        onfocus?: () => void;
        onblur?: () => void;
    }>();

    let checkboxElement: HTMLInputElement;

    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        checked = target.checked;
        if (!checked) {
            checkboxElement?.blur();
        }
        onchange?.();
    }

    let checkboxSizeClasses = $derived.by(() => {
        const sizes = {
            sm: 'w-3 h-3',
            md: 'w-4 h-4',
            lg: 'w-5 h-5'
        };
        return sizes[size as keyof typeof sizes];
    });
    let labelSizeClasses = $derived.by(() => {
        const sizes = {
            sm: 'text-xs',
            md: 'text-sm',
            lg: 'text-base'
        };
        return sizes[size as keyof typeof sizes];
    });
</script>

<div class="siq-form-check">
    <input {id}
        bind:this={checkboxElement}
        type="checkbox"
        class="siq-form-check-input {checkboxSizeClasses} {className}"
        class:opacity-50={disabled}
        class:cursor-not-allowed={disabled}
        {checked}
        {disabled}
        {required}
        onchange={handleChange}
        onfocus={() => onfocus?.()}
        onblur={() => onblur?.()} />
    {#if label}
        <label for={id}
            class="siq-form-check-label {labelSizeClasses} {error ? 'text-red-600 dark:text-red-400' : ''}">
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