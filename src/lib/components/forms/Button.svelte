<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        type?: 'button' | 'submit' | 'reset';
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
        size?: 'sm' | 'md' | 'lg' | 'xl';
        disabled?: boolean;
        fullWidth?: boolean;
        icon?: string;
        iconPosition?: 'left' | 'right';
        href?: string;
        target?: string;
        onclick?: (event: MouseEvent) => void;
        children?: Snippet;
        [key: string]: any;
    }

    let {
        type = 'button',
        variant = 'primary',
        size = 'md',
        disabled = false,
        fullWidth = false,
        icon = '',
        iconPosition = 'left',
        href = '',
        target = '',
        onclick,
        children,
        ...otherProps
    }: Props = $props();

    let { class: restClass = '', ...restProps } = otherProps;

    function handleClick(event: MouseEvent) {
        if (disabled) {
            event.preventDefault();
            return;
        }
        onclick?.(event);
    }

    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: '',
        lg: 'siq-btn-lg',
        xl: 'px-8 py-4 text-xl'
    };

    const variantClasses = {
        primary: 'siq-btn siq-btn-primary',
        secondary: 'siq-btn siq-btn-secondary',
        outline: 'siq-btn siq-btn-outline-primary',
        ghost: 'siq-btn siq-btn-light',
        danger: 'siq-btn siq-btn-danger',
        success: 'siq-btn siq-btn-success'
    };

    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-7 h-7'
    };
</script>

{#if href}
    <a {href} target={target || undefined}
        class="
            {variantClasses[variant]}
            {sizeClasses[size]}
            {fullWidth ? 'w-full' : ''}
            {restClass}
        "
        class:pointer-events-none={disabled}
        onclick={handleClick}
        {...restProps}>
        
        {@render children?.()}

        {#if icon && iconPosition === 'right'}
            <img src={icon} alt="" class="ml-2 {iconSizeClasses[size]}" />
        {/if}
    </a>
    
{:else}
    <button {type} {disabled}
        class="
            {variantClasses[variant]}
            {sizeClasses[size]}
            {fullWidth ? 'w-full' : ''}
            {restClass}
        "
        onclick={handleClick}
        {...restProps}>

        {@render children?.()}

        {#if icon && iconPosition === 'right'}
            <img src={icon} alt="" class="ml-2 {iconSizeClasses[size]}" />
        {/if}
    </button>
{/if}

<style>
    button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
</style>