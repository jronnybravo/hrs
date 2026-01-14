<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let label: string = '';
    export let required: boolean = false;
    export let disabled: boolean = false;
    export let error: string = '';
    export let helpText: string = '';
    export const size: 'sm' | 'md' | 'lg' = 'md';
    export const variant: 'default' | 'filled' | 'outlined' = 'default';
    export let accept: string = '';
    export let multiple: boolean = false;
    export let maxSize: number | undefined = undefined; // in MB
    export let maxFiles: number | undefined = undefined;

    const dispatch = createEventDispatcher<{
        change: { files: FileList | null };
        focus: FocusEvent;
        blur: FocusEvent;
        error: { message: string };
    }>();

    let fileInputElement: HTMLInputElement;
    let dragOver = false;
    let selectedFiles: File[] = [];

    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        
        if (files) {
            validateFiles(files);
        }
        
        dispatch('change', { files });
    }

    function handleFocus(event: FocusEvent) {
        dispatch('focus', event);
    }

    function handleBlur(event: FocusEvent) {
        dispatch('blur', event);
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        dragOver = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        dragOver = false;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        dragOver = false;
        
        const files = event.dataTransfer?.files;
        if (files) {
            validateFiles(files);
            // Update the file input
            const dataTransfer = new DataTransfer();
            Array.from(files).forEach(file => dataTransfer.items.add(file));
            fileInputElement.files = dataTransfer.files;
            dispatch('change', { files: fileInputElement.files });
        }
    }

    function validateFiles(files: FileList) {
        const fileArray = Array.from(files);
        selectedFiles = fileArray;

        // Check max files
        if (maxFiles && fileArray.length > maxFiles) {
            dispatch('error', { message: `Maximum ${maxFiles} files allowed` });
            return;
        }

        // Check file sizes
        if (maxSize) {
            const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                dispatch('error', { message: `Files must be smaller than ${maxSize}MB` });
                return;
            }
        }
    }

    function handleClick() {
        if (!disabled) {
            fileInputElement.click();
        }
    }

    function removeFile(index: number) {
        selectedFiles = selectedFiles.filter((_, i) => i !== index);
        
        // Update the file input
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(file => dataTransfer.items.add(file));
        fileInputElement.files = dataTransfer.files;
        dispatch('change', { files: fileInputElement.files });
    }

    // Expose focus method
    export function focus() {
        fileInputElement?.focus();
    }

    // Expose blur method
    export function blur() {
        fileInputElement?.blur();
    }

    const sizeClasses = {
        sm: 'siq-btn-sm',
        md: '',
        lg: 'siq-btn-lg'
    };

    const variantClasses = {
        default: 'siq-form-control',
        filled: 'siq-form-control bg-surface-100 dark:bg-surface-700 border-0',
        outlined: 'siq-form-control border-2 bg-transparent'
    };

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
</script>

<div class="w-full siq-form-group">
    {#if label}
        <label for="file-{Math.random().toString(36).substr(2, 9)}" class="siq-form-label">
            {label}
            {#if required}
                <span class="text-red-500 ml-1">*</span>
            {/if}
        </label>
    {/if}

    <div
        class="
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            {dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-300 dark:border-surface-600'}
            {error ? 'border-red-500 dark:border-red-400' : ''}
            {disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 dark:hover:border-primary-500'}
        "
        on:click={handleClick}
        on:keydown={(e) => e.key === 'Enter' && handleClick()}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        role="button"
        tabindex="0"
    >
        <input
            bind:this={fileInputElement}
            type="file"
            class="hidden"
            id="file-{Math.random().toString(36).substr(2, 9)}"
            {accept}
            {multiple}
            {required}
            {disabled}
            on:change={handleChange}
            on:focus={handleFocus}
            on:blur={handleBlur}
        />

        <div class="space-y-2">
            <svg class="mx-auto h-12 w-12 text-surface-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            
            <div class="text-sm text-surface-600 dark:text-surface-400">
                <span class="font-medium text-primary-600 dark:text-primary-400">Click to upload</span>
                or drag and drop
            </div>
            
            {#if accept}
                <p class="text-xs text-surface-500 dark:text-surface-500">
                    {accept.split(',').map(type => type.trim()).join(', ')}
                </p>
            {/if}
            
            {#if maxSize}
                <p class="text-xs text-surface-500 dark:text-surface-500">
                    Max size: {maxSize}MB
                </p>
            {/if}
        </div>
    </div>

    {#if selectedFiles.length > 0}
        <div class="mt-4 space-y-2">
            {#each selectedFiles as file, index}
                <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <svg class="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <div>
                            <p class="text-sm font-medium text-surface-900 dark:text-surface-100">{file.name}</p>
                            <p class="text-xs text-surface-500 dark:text-surface-400">{formatFileSize(file.size)}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="text-surface-400 hover:text-red-500 dark:hover:text-red-400"
                        aria-label="Remove file"
                        on:click={() => removeFile(index)}
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    {/if}

    {#if error}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    {/if}

    {#if helpText && !error}
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">{helpText}</p>
    {/if}
</div>
