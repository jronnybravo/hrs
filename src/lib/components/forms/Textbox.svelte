<script lang="ts">
    interface Props {
        id?: string;
        value?: string | null;
        label?: string;
        error?: string;
        helpText?: string;
        size?: 'sm' | 'md' | 'lg';
        variant?: 'default' | 'filled' | 'outlined';
        icon?: string;
        iconPosition?: 'left' | 'right';
        clearable?: boolean;
        oninput?: (event: Event) => void;
        onkeydown?: (event: KeyboardEvent) => void;
        onfocus?: (event: FocusEvent) => void;
        onblur?: (event: FocusEvent) => void;
        onclear?: () => void;
        class?: string;
        [key: string]: any;
    }

    let {
        id = `textbox-${Math.random().toString(36).slice(2, 9)}`,
        value = $bindable(''),
        label = '',
        error = '',
        helpText = '',
        size = 'md',
        variant = 'default',
        icon = '',
        iconPosition = 'left',
        clearable = false,
        oninput,
        onkeydown,
        onfocus,
        onblur,
        onclear,
        class: restClass = '',
        ...restProps
    }: Props = $props();

    const disabled = restProps.disabled ?? false;

    let inputElement = $state<HTMLInputElement>();

    // Public methods
    export function focus() {
        inputElement?.focus();
    }
    export function blur() {
        inputElement?.blur();
    }
    export function select() {
        inputElement?.select();
    }

    // Class maps
    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: 'px-4 py-2 text-base',
        lg: 'siq-btn-lg'
    };

    const variantClasses = {
        default: 'siq-form-control',
        filled: 'siq-form-control bg-surface-100 dark:bg-surface-700 border-0',
        outlined: 'siq-form-control border-2 bg-transparent'
    };

    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };
</script>

<div class="w-full">
    {#if label}
        <label for={id} class="siq-form-label">
            {label}
            {#if restProps.required}
                <span class="text-red-500 ml-1">*</span>
            {/if}
        </label>
    {/if}

    <div class="relative">
        {#if icon && iconPosition === 'left'}
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <img src={icon} alt="" class={iconSizeClasses[size]} />
            </div>
        {/if}

        <input bind:this={inputElement}
            bind:value
            {id}
            oninput={oninput}
            onkeydown={onkeydown}
            onfocus={onfocus}
            onblur={onblur}
            class={`
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${icon && iconPosition === 'left' ? '!pl-10' : ''}
                ${(icon && iconPosition === 'right') || (clearable && value) ? '!pr-10' : ''}
                ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' : ''}
                ${restClass}
            `}
            class:siq-form-control-static={disabled}
            {...restProps} />

        {#if clearable && value}
            <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-surface-700 dark:hover:text-surface-200 text-surface-500 dark:text-surface-400 transition-colors"
                onclick={() => {
                    value = '';
                    onclear?.();
                    inputElement?.focus();
                }}
                aria-label="Clear input"
            >
                <svg class={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        {:else if icon && iconPosition === 'right'}
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <img src={icon} alt="" class={iconSizeClasses[size]} />
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