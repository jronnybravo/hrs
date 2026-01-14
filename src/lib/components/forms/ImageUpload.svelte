<script lang="ts">
    import axios from 'axios';
    import { toastStore } from '$lib/stores/toast';
    import Button from './Button.svelte';
	import { MediaSize } from '$lib/entities/interfaces/IMedia';

    interface Props {
        value?: string | null;
        disabled?: boolean;
        label?: string;
        id?: string;
        required?: boolean;
    }

    let { 
        value = $bindable(''),
        disabled = false,
        label = 'Image',
        id = 'image-upload',
        required = false
    }: Props = $props();

    let isUploading = $state(false);
    let previewUrl = $state('');
    let fileInput: HTMLInputElement;
    let isDragOver = $state(false);

    async function uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('media', file);

        const response = await axios.post('/api/media', formData);
        const { success, data } = response.data;

        if(!success) {
            throw new Error('Upload failed');
        }

        const url  = data.url[MediaSize.SMALL] || '';
        if(!url) {
            throw new Error('Image URL not found in response');
        }

        return url;
    }

    async function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
            await handleFile(file);
        }
    }

    async function handleFile(file: File) {
        if (disabled || isUploading) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toastStore.error('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            toastStore.error('Image must be less than 10MB');
            return;
        }

        try {
            isUploading = true;
            
            // Create preview
            previewUrl = URL.createObjectURL(file);
            
            // Upload to server
            const uploadedUrl = await uploadFile(file);
            value = uploadedUrl;
            previewUrl = uploadedUrl;
            
            toastStore.success('Image uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            toastStore.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
            previewUrl = '';
            value = '';
        } finally {
            isUploading = false;
        }
    }

    function clearImage() {
        value = '';
        previewUrl = '';
        if (fileInput) {
            fileInput.value = '';
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (!disabled && !isUploading) {
            isDragOver = true;
        }
    }

    function handleDragLeave() {
        isDragOver = false;
    }

    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragOver = false;
        
        if (disabled || isUploading) return;

        const file = event.dataTransfer?.files[0];
        if (file) {
            await handleFile(file);
        }
    }

    function triggerFileInput() {
        if (!disabled && !isUploading) {
            fileInput?.click();
        }
    }

    $effect(() => {
        if (value === null || value === undefined) {
            value = '';
        }
    });

    $effect(() => {
        if (value && !previewUrl) {
            previewUrl = value;
        }
    });
</script>

<div class="space-y-3">
    {#if label}
        <label for={id} class="block text-sm font-medium text-surface-700 dark:text-surface-300">
            {label}
            {#if required}<span class="text-error-500">*</span>{/if}
        </label>
    {/if}
    
    <!-- Hidden File Input -->
    <input
        bind:this={fileInput}
        type="file"
        {id}
        accept="image/*"
        {disabled}
        onchange={handleFileChange}
        class="hidden"
    />

    <!-- Drop Zone / Preview Area -->
    <div
        class="relative border-2 border-dashed rounded-lg transition-all duration-200
            {isDragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 
             'border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800'}
            {disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400 hover:bg-surface-100 dark:hover:bg-surface-700'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        onclick={triggerFileInput}
        role="button"
        tabindex={disabled ? -1 : 0}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFileInput(); }}}
    >
        {#if isUploading}
            <!-- Uploading State -->
            <div class="flex flex-col items-center justify-center p-8">
                <svg class="animate-spin h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-sm text-primary-700 dark:text-primary-300 font-medium">Uploading image...</p>
            </div>
        {:else if previewUrl}
            <!-- Preview State -->
            <div class="relative group">
                <img 
                    src={previewUrl} 
                    alt="Preview" 
                    class="w-full h-auto rounded-lg object-cover max-h-96"
                />
                {#if !disabled}
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onclick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                        >
                            Change Image
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onclick={(e) => { e.stopPropagation(); clearImage(); }}
                        >
                            Remove
                        </Button>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- Empty State -->
            <div class="flex flex-col items-center justify-center p-8">
                <svg class="h-12 w-12 text-surface-400 dark:text-surface-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Click to upload or drag and drop
                </p>
                <p class="text-xs text-surface-500 dark:text-surface-400">
                    PNG, JPG, GIF up to 10MB
                </p>
            </div>
        {/if}
    </div>
</div>
