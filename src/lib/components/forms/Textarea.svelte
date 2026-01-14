<script lang="ts">
    interface Props {
        id?: string;
        value?: string | null;
        label?: string;
        error?: string;
        helpText?: string;
        size?: 'sm' | 'md' | 'lg';
        variant?: 'default' | 'filled' | 'outlined';
        resize?: 'none' | 'vertical' | 'horizontal' | 'both';
        oninput?: (event: Event) => void;
        onfocus?: (event: FocusEvent) => void;
        onblur?: (event: FocusEvent) => void;
        class?: string;
        [key: string]: any;
    }

    let {
        id = `textarea-${Math.random().toString(36).slice(2, 9)}`,
        value = $bindable(''),
        label = '',
        error = '',
        helpText = '',
        size = 'md',
        variant = 'default',
        resize = 'vertical',
        oninput,
        onfocus,
        onblur,
        class: restClass = '',
        ...restProps
    }: Props = $props();

    let textareaElement = $state<HTMLTextAreaElement>();

    // Public methods
    export function focus() {
        textareaElement?.focus();
    }
    export function blur() {
        textareaElement?.blur();
    }
    export function select() {
        textareaElement?.select();
    }

    // Class maps
    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: '',
        lg: 'siq-btn-lg'
    };

    const variantClasses = {
        default: 'siq-form-control siq-form-textarea',
        filled: 'siq-form-control siq-form-textarea bg-surface-100 dark:bg-surface-700 border-0',
        outlined: 'siq-form-control siq-form-textarea border-2 bg-transparent'
    };

    const resizeClasses = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize'
    };
</script>

<div class="w-full siq-form-group">
    {#if label}
        <label for={id} class="siq-form-label">
            {label}
            {#if restProps.required}
                <span class="text-red-500 ml-1">*</span>
            {/if}
        </label>
    {/if}

    <textarea bind:this={textareaElement}
        bind:value
        id={id}
        oninput={oninput}
        onfocus={onfocus}
        onblur={onblur}
        class={`
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${resizeClasses[resize]}
            ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' : ''}
            ${restClass}
        `}
        {...restProps}></textarea>

    {#if error}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    {/if}

    {#if helpText && !error}
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">{helpText}</p>
    {/if}
</div>