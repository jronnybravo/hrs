<script lang="ts">
    interface Props {
        method?: 'GET' | 'POST';
        action?: string;
        enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
        novalidate?: boolean;
        loading?: boolean;
        disabled?: boolean;
        onsubmit?: (event: CustomEvent<{ formData: FormData; event: SubmitEvent }>) => void;
        onreset?: (event: Event) => void;
        children?: import('svelte').Snippet;
        [key: string]: any;
    }

    let {
        method = 'POST',
        action = '',
        enctype = 'application/x-www-form-urlencoded',
        novalidate = false,
        loading = false,
        disabled = false,
        onsubmit,
        onreset,
        children,
        ...otherProps
    }: Props = $props();

    let { class: restClass = '', ...restProps } = otherProps;

    let formElement: HTMLFormElement;

    function handleSubmit(event: SubmitEvent) {
        if (loading || disabled) {
            event.preventDefault();
            return;
        }

        const formData = new FormData(formElement);
        onsubmit?.(new CustomEvent('submit', { detail: { formData, event } }));
    }

    function handleReset(event: Event) {
        onreset?.(event);
    }

    // Expose form methods
    export function submit() {
        formElement?.requestSubmit();
    }

    export function reset() {
        formElement?.reset();
    }

    export function getFormData(): FormData {
        return new FormData(formElement);
    }
</script>

<form bind:this={formElement}
    {method}
    {action}
    {enctype}
    {novalidate}
    class="space-y-6 {restClass}"
    class:opacity-50={loading || disabled}
    class:pointer-events-none={disabled}
    onsubmit={handleSubmit}
    onreset={handleReset}
    {...restProps}>
    {@render children?.()}
</form>
