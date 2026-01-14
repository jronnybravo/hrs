<script lang="ts">
    import { validateMediaFile, extractVideoThumbnail, extractVideoThumbnailFromUrl, isYouTubeUrl, isVimeoUrl, detectMediaType } from '$lib/utils/Media';
    import { toastStore } from '$lib/stores/toast';
    import axios from 'axios';
    import type { IMedia } from '$lib/entities/interfaces/IMedia';
    import { MediaSize as MediaSizeEnum } from '$lib/entities/interfaces/IMedia';

    interface Props {
        label?: string;
        accept?: string;
        multiple?: boolean;
        maxFiles?: number;
        disabled?: boolean;
        media?: IMedia[] | null;
        onchange?: () => void
    }

    let {
        label = 'Upload Media',
        accept = 'image/*,video/*',
        multiple = false,
        maxFiles = 10,
        disabled = false,
        media = $bindable(null),
        onchange,
    }: Props = $props();

    interface MediaItem {
        id: string;
        file?: File;
        url: string;
        type: 'image' | 'video' | 'link';
        source: 'upload' | 'url';
        thumbnail?: string;
        uploading?: boolean;
        error?: string;
        isDefault?: boolean;
    }

    let mediaItems: MediaItem[] = $state([]);
    let mediaUrl = $state('');
    let isDragOver = $state(false);
    let draggedItem: MediaItem | null = $state(null);
    let dragOverTarget: { index: number; type: 'image' | 'video' } | null = $state(null);
    let fileInput: HTMLInputElement;
    let uploadMode: 'file' | 'url' = $state('file');
    let showDropdown = $state(false);

    /**
     * Convert internal MediaItem[] to IMedia[] format for entity storage
     * This ensures the data structure matches the Event.media field requirements
     * Filter out blob URLs to prevent them from being saved
     */
    function convertMediaItemsToIMedia(items: MediaItem[]): IMedia[] {
        return items
            .filter(item => !item.thumbnail?.startsWith('blob:') && item.url) // Skip items with blob thumbnails or no URL
            .map(item => ({
                name: item.id,
                type: item.type === 'video' ? 'video' : 'image',
                description: '',
                isDefault: item.isDefault || false,
                url: {
                    [MediaSizeEnum.ORIGINAL]: item.url,
                    [MediaSizeEnum.THUMBNAIL]: item.thumbnail || item.url,
                    [MediaSizeEnum.SMALL]: item.url,
                    [MediaSizeEnum.MEDIUM]: item.url,
                    [MediaSizeEnum.LARGE]: item.url,
                }
            } as IMedia));
    }

    // Helper functions for media organization
    const imageItems = $derived(mediaItems.filter(item => item.type === 'image'));
    const videoItems = $derived(mediaItems.filter(item => item.type === 'video'));

    /**
     * Load initial media from prop when component mounts
     * If media is malformed, reset to empty array
     */
    $effect.pre(() => {
        if (media && media.length > 0 && mediaItems.length === 0) {
            try {
                // Validate that media items have the expected IMedia structure
                const isValid = media.every(item => 
                    item && typeof item === 'object' && 
                    'url' in item && typeof item.url === 'object' &&
                    'original' in item.url
                );
                
                if (isValid) {
                    setMediaItems(media as any[]);
                } else {
                    // Reset malformed media to empty array
                    media = [];
                }
            } catch (error) {
                console.warn('Media prop validation failed, resetting to empty array:', error);
                media = [];
            }
        }
    });

    /**
     * Sync mediaItems changes back to media prop
     * This keeps the media prop updated whenever internal mediaItems change
     */
    $effect(() => {
        media = convertMediaItemsToIMedia(mediaItems);
    });

    function setDefaultMedia(itemId: string) {
        const selectedItem = mediaItems.find(item => item.id === itemId);
        if (!selectedItem) return;
        
        // Clear defaults for all items, set only the selected item as default
        mediaItems = mediaItems.map(item => ({
            ...item,
            isDefault: item.id === itemId
        }));
        onchange?.();
    }

    /**
     * Set media items (for loading existing media)
     */
    export function setMediaItems(items: MediaItem[]) {
        mediaItems = items.map((item, index) => {
            // Check if it's an IMedia object (has url as object) or MediaItem (has url as string)
            const isIMedia = typeof item.url === 'object';
            
            let processedItem: MediaItem;
            
            if (isIMedia) {
                // Convert IMedia to MediaItem
                const iMediaItem = item as any as IMedia;
                const isVideo = iMediaItem.type === 'video';
                const url = iMediaItem.url[MediaSizeEnum.ORIGINAL] || '';
                
                // Ensure ID is always unique and not undefined
                const id = item.id && typeof item.id === 'string' && item.id.trim() ? item.id : generateId();
                
                processedItem = {
                    id,
                    url,
                    type: isVideo ? 'video' : 'image',
                    source: 'url',
                    thumbnail: isVideo ? undefined : (iMediaItem.url[MediaSizeEnum.THUMBNAIL] || url),
                    isDefault: iMediaItem.isDefault || false
                };
            } else {
                // Ensure ID is always unique and not undefined
                const id = item.id && typeof item.id === 'string' && item.id.trim() ? item.id : generateId();
                
                processedItem = {
                    ...item,
                    id
                };
            }
            
            // Process each item to set appropriate thumbnails
            if (processedItem.type === 'video') {
                // For videos, generate proper thumbnails or leave undefined
                if (isYouTubeUrl(processedItem.url)) {
                    processedItem.thumbnail = getYouTubeThumbnail(processedItem.url);
                } else if (isVimeoUrl(processedItem.url)) {
                    // Vimeo thumbnail will be set asynchronously
                    processedItem.thumbnail = undefined;
                    // Generate Vimeo thumbnail asynchronously
                    getVimeoThumbnail(processedItem.url).then(thumbnail => {
                        if (thumbnail) {
                            mediaItems = mediaItems.map(mediaItem => 
                                mediaItem.id === processedItem.id ? { ...mediaItem, thumbnail } : mediaItem
                            );
                        }
                    });
                } else {
                    // For uploaded videos or other video URLs, try to generate thumbnail
                    processedItem.thumbnail = undefined;
                    // Generate thumbnail asynchronously for uploaded videos
                    extractVideoThumbnailFromUrl(processedItem.url).then(thumbnail => {
                        mediaItems = mediaItems.map(mediaItem => 
                            mediaItem.id === processedItem.id ? { ...mediaItem, thumbnail } : mediaItem
                        );
                    }).catch(error => {
                        console.warn('Failed to generate thumbnail for video:', processedItem.url, error);
                        // Leave thumbnail as undefined if generation fails
                    });
                }
            } else {
                // For images, use the URL as thumbnail if not already set
                processedItem.thumbnail = processedItem.thumbnail || processedItem.url;
            }
            
            return processedItem;
        });
        
        onchange?.();
    }

    /**
     * Get current media items as IMedia[] format
     * This converts internal MediaItem representation to the IMedia structure
     * required by the Event entity
     */
    export function getMediaItems(): IMedia[] {
        return convertMediaItemsToIMedia(mediaItems);
    }

    /**
     * Handle drag start for media items
     */
    function handleDragStart(event: DragEvent, item: MediaItem) {
        if (disabled) return;
        draggedItem = item;
        event.dataTransfer!.effectAllowed = 'move';
        event.dataTransfer!.setData('text/html', '');
    }

    /**
     * Handle drag over for media items
     */
    function handleItemDragOver(event: DragEvent, index: number, type: 'image' | 'video') {
        if (disabled || !draggedItem) return;
        
        // Only allow dropping within the same type
        if (draggedItem.type !== type) return;
        
        event.preventDefault();
        dragOverTarget = { index, type };
    }

    /**
     * Handle drop for media items
     */
    function handleItemDrop(event: DragEvent, dropIndex: number, type: 'image' | 'video') {
        if (disabled || !draggedItem) return;
        
        event.preventDefault();
        
        // Only allow dropping within the same type
        if (draggedItem.type !== type) {
            draggedItem = null;
            dragOverTarget = null;
            return;
        }
        
        const items = type === 'image' ? imageItems : videoItems;
        const draggedItemIndex = items.findIndex(item => item.id === draggedItem!.id);
        
        if (draggedItemIndex === -1 || draggedItemIndex === dropIndex) {
            draggedItem = null;
            dragOverTarget = null;
            return;
        }
        
        // Find global indices in mediaItems array
        const draggedGlobalIndex = mediaItems.findIndex(item => item.id === draggedItem!.id);
        const targetItem = items[dropIndex];
        const targetGlobalIndex = mediaItems.findIndex(item => item.id === targetItem.id);
        
        // Reorder items
        const newMediaItems = [...mediaItems];
        const [movedItem] = newMediaItems.splice(draggedGlobalIndex, 1);
        newMediaItems.splice(targetGlobalIndex, 0, movedItem);
        
        mediaItems = newMediaItems;
        onchange?.();
        
        draggedItem = null;
        dragOverTarget = null;
    }

    /**
     * Handle drag end
     */
    function handleDragEnd() {
        draggedItem = null;
        dragOverTarget = null;
    }

    /**
     * Upload file to API endpoint
     */
    async function uploadFileToAPI(file: File, mediaItem: MediaItem) {
        try {
            const formData = new FormData();
            formData.append('media', file);

            const response = await axios.post('/api/media', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000 // 60 second timeout
            });
            
            if (response.data && response.data.success && response.data.data) {
                // Extract the original URL from the IMedia response
                const mediaData = response.data.data as IMedia;
                return mediaData.url[MediaSizeEnum.ORIGINAL] || '';
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            
            // Log more detailed error info for debugging
            if (axios.isAxiosError(error)) {
                console.error('Response status:', error.response?.status);
                console.error('Response data:', error.response?.data);
                console.error('Error message:', error.message);
            }
            
            throw error;
        }
    }

    async function handleFiles(files: FileList | File[]) {
        if (disabled) return;

        const fileArray = Array.from(files);

        // Check max files limit
        if (mediaItems.length + fileArray.length > maxFiles) {
            toastStore.error(`Maximum ${maxFiles} files allowed`);
            return;
        }

        for (const file of fileArray) {
            const validation = validateMediaFile(file);
            if (!validation.valid) {
                toastStore.error(`${file.name}: ${validation.error}`);
                continue;
            }

            // Determine media type from file
            const isVideo = file.type.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'image';

            // Check if there's already a default for any media item
            const hasDefault = mediaItems.some(item => item.isDefault);
            
            const itemId = generateId();
            
            // Create temporary blob URL for preview only
            let previewUrl: string | undefined;
            if (!isVideo) {
                previewUrl = URL.createObjectURL(file);
            }
            
            const mediaItem: MediaItem = {
                id: itemId,
                file,
                url: '',
                type: mediaType,
                source: 'upload',
                thumbnail: previewUrl,
                uploading: true,
                isDefault: !hasDefault
            };

            mediaItems = [...mediaItems, mediaItem];

            // Upload immediately
            try {
                const uploadedUrl = await uploadFileToAPI(file, mediaItem);
                
                // Update the media item with the uploaded URL and use uploaded URL as thumbnail
                mediaItems = mediaItems.map(item => 
                    item.id === mediaItem.id 
                        ? { 
                            ...item, 
                            url: uploadedUrl, 
                            uploading: false,
                            thumbnail: !isVideo ? uploadedUrl : item.thumbnail
                          }
                        : item
                );

                // Revoke the temporary blob URL after upload for images
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }

                toastStore.success(`${file.name} uploaded successfully`);
                
                // Generate video thumbnail if needed
                if (file.type.startsWith('video/')) {
                    try {
                        const thumbnail = await extractVideoThumbnail(file);
                        if (thumbnail) {
                            mediaItems = mediaItems.map(item => 
                                item.id === mediaItem.id 
                                    ? { ...item, thumbnail }
                                    : item
                            );
                        }
                    } catch (thumbError) {
                        console.warn('Failed to generate video thumbnail:', thumbError);
                    }
                }
            } catch (uploadError) {
                console.error('Upload failed for', file.name, ':', uploadError);
                toastStore.error(`Failed to upload ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
                
                // Remove the failed item from the list
                mediaItems = mediaItems.filter(item => item.id !== mediaItem.id);
            }
        }

        onchange?.();
    }

    function generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    function validateMediaUrl(url: string): { valid: boolean; error?: string } {
        if (!url || !url.trim()) {
            return { valid: false, error: 'URL is empty' };
        }

        const trimmedUrl = url.trim();

        // Basic URL format validation
        try {
            new URL(trimmedUrl);
        } catch (error) {
            return { valid: false, error: 'Invalid URL format' };
        }

        // Check if URL starts with http or https
        if (!trimmedUrl.match(/^https?:\/\//i)) {
            return { valid: false, error: 'URL must start with http:// or https://' };
        }

        // Accept all valid HTTP/HTTPS URLs
        // This allows:
        // - Images/videos with file extensions (traditional)
        // - CDN URLs without extensions (e.g., https://cdn.example.com/image/123)
        // - API endpoint URLs (e.g., https://api.example.com/media/abc)
        // - YouTube and Vimeo URLs
        // - Any other valid media URLs
        
        // We already validated that it's a proper HTTP/HTTPS URL above,
        // so we'll accept any valid URL as potentially containing media
        // The actual media validation will happen when the URL is loaded

        return { valid: true };
    }

    function getYouTubeThumbnail(url: string): string {
        const videoId = extractYouTubeVideoId(url);
        return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    }

    function getVimeoThumbnail(url: string): Promise<string> {
        const videoId = extractVimeoVideoId(url);
        if (!videoId) return Promise.resolve('');
        
        return fetch(`https://vimeo.com/api/v2/video/${videoId}.json`)
            .then(response => response.json())
            .then(data => data[0]?.thumbnail_large || '')
            .catch(() => '');
    }

    function extractYouTubeVideoId(url: string): string | null {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : null;
    }

    function extractVimeoVideoId(url: string): string | null {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
    }

    async function handleUrlAdd() {
        if (!mediaUrl.trim() || disabled) return;

        const url = mediaUrl.trim();
        
        // Validate URL format
        const validation = validateMediaUrl(url);
        if (!validation.valid) {
            toastStore.error(validation.error || 'Invalid URL');
            return;
        }
        
        // Check if URL already exists
        if (mediaItems.some(item => item.url === url)) {
            toastStore.error('This URL has already been added');
            return;
        }

        // Check max files limit
        if (mediaItems.length >= maxFiles) {
            toastStore.error(`Maximum ${maxFiles} items allowed`);
            return;
        }

        const mediaType = detectMediaType(url);
        // Check if there's already a default for any media item
        const hasDefault = mediaItems.some(item => item.isDefault);
        
        const mediaItem: MediaItem = {
            id: generateId(),
            url,
            type: mediaType,
            source: 'url',
            isDefault: !hasDefault
        };

        mediaItems = [...mediaItems, mediaItem];
        mediaUrl = '';

        // Generate thumbnail based on detected media type
        if (mediaItem.type === 'video') {
            if (isYouTubeUrl(url)) {
                const thumbnail = getYouTubeThumbnail(url);
                if (thumbnail) {
                    mediaItems = mediaItems.map(item => 
                        item.id === mediaItem.id ? { ...item, thumbnail } : item
                    );
                }
            } else if (isVimeoUrl(url)) {
                getVimeoThumbnail(url).then(thumbnail => {
                    if (thumbnail) {
                        mediaItems = mediaItems.map(item => 
                            item.id === mediaItem.id ? { ...item, thumbnail } : item
                        );
                    }
                });
            }
            // For other video URLs, no thumbnail is set (will show video icon placeholder)
        } else {
            // For image URLs, use the URL as thumbnail
            mediaItems = mediaItems.map(item => 
                item.id === mediaItem.id ? { ...item, thumbnail: url } : item
            );
        }

        onchange?.();
    }

    function removeMediaItem(id: string) {
        if (disabled) return;
        
        const item = mediaItems.find(item => item.id === id);
        
        // Remove from DOM first to prevent image loading errors
        mediaItems = mediaItems.filter(item => item.id !== id);
        
        // Then revoke blob URL after a brief delay to ensure DOM is updated
        if (item?.thumbnail && item.thumbnail.startsWith('blob:')) {
            setTimeout(() => {
                try {
                    URL.revokeObjectURL(item.thumbnail!);
                } catch (e) {
                    console.warn('Failed to revoke blob URL:', e);
                }
            }, 0);
        }
        
        onchange?.();
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragOver = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        isDragOver = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        const currentTarget = event.currentTarget as HTMLElement;
        const relatedTarget = event.relatedTarget as Node;
        if (!currentTarget?.contains(relatedTarget)) {
            isDragOver = false;
        }
    }

    function handleFileInput(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            handleFiles(input.files);
        }
    }

    function triggerFileInput() {
        if (!disabled) {
            fileInput?.click();
        }
    }

    // Update isUploading state
    const isUploading = $derived(mediaItems.some(item => item.uploading));

    // Automatically set first item as default if none is set
    $effect(() => {
        if (mediaItems.length > 0) {
            const hasDefault = mediaItems.some(item => item.isDefault);
            
            if (!hasDefault && mediaItems[0]) {
                mediaItems = mediaItems.map((item, index) =>
                    index === 0 ? { ...item, isDefault: true } : item
                );
            }
        }
    });

    // Close dropdown when clicking outside
    $effect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Element;
            if (!target.closest('.dropdown-container')) {
                showDropdown = false;
            }
        }

        if (showDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    });
</script>

<div class="space-y-3">
    <!-- File Input (Hidden) -->
    <input
        bind:this={fileInput}
        type="file"
        {accept}
        {multiple}
        onchange={handleFileInput}
        class="hidden"
        {disabled}
    />

    <!-- Input Group with Dropdown -->
    <div class="flex">
        <!-- Dropdown Button Group -->
        <div class="relative dropdown-container">
            <button
                type="button"
                onclick={() => showDropdown = !showDropdown}
                class="inline-flex items-center px-3 py-2 border border-surface-300 dark:border-surface-600 border-r-0 rounded-l-lg bg-surface-50 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-10"
                {disabled}
                aria-label="Select upload method"
            >
                <!-- Current Mode Icon -->
                {#if uploadMode === 'file'}
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                {:else}
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                {/if}
                
                <!-- Dropdown Arrow -->
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            <!-- Dropdown Menu -->
            {#if showDropdown}
                <div class="absolute z-10 mt-1 w-40 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg shadow-lg">
                    <button
                        type="button"
                        onclick={() => { uploadMode = 'file'; showDropdown = false; }}
                        class="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center rounded-t-lg {uploadMode === 'file' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : ''}"
                        {disabled}
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        Upload Files
                    </button>
                    <button
                        type="button"
                        onclick={() => { uploadMode = 'url'; showDropdown = false; }}
                        class="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center rounded-b-lg {uploadMode === 'url' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : ''}"
                        {disabled}
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                        Add URL
                    </button>
                </div>
            {/if}
        </div>

        <!-- Input Area -->
        <div class="flex-1 flex">
            {#if uploadMode === 'file'}
                <!-- File Upload Input -->
                <div class="flex-1 border border-surface-300 dark:border-surface-600 rounded-r-lg px-3 py-2 text-sm transition-colors cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 bg-white dark:bg-surface-700 h-10 flex items-center {isDragOver ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20' : ''} {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
                    ondrop={handleDrop}
                    ondragover={handleDragOver}
                    ondragleave={handleDragLeave}
                    onclick={triggerFileInput}
                    onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? triggerFileInput() : null}
                    role="button"
                    tabindex="0"
                    aria-label="Upload media files">
                    <div class="flex items-center text-surface-600 dark:text-surface-400">
                        <svg class="w-4 h-4 mr-2 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>Drag & drop files or click to browse</span>
                        <span class="ml-auto text-xs text-surface-500">Max {maxFiles} files, 10MB each</span>
                    </div>
                </div>
            {:else}
                <!-- URL Input -->
                <input type="url"
                    placeholder="Paste media URL (images, videos, YouTube, Vimeo)"
                    bind:value={mediaUrl}
                    onkeydown={(e) => e.key === 'Enter' && handleUrlAdd()}
                    class="flex-1 px-3 py-2 border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-10 {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
                    {disabled} />
                <button onclick={handleUrlAdd}
                    type="button"
                    class="px-4 py-2 border border-l-0 border-surface-300 dark:border-surface-600 rounded-r-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 h-10 {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
                    {disabled}>
                    Add
                </button>
            {/if}
        </div>
    </div>

    <!-- Upload Progress Indicator -->
    {#if isUploading}
        <div class="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <svg class="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
                <p class="text-sm text-blue-800 dark:text-blue-300 font-medium">Uploading files...</p>
                <p class="text-xs text-blue-700 dark:text-blue-400">Please wait while your files are being uploaded.</p>
            </div>
        </div>
    {:else if mediaItems.some(item => item.source === 'upload' && item.url)}
        <div class="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <svg class="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
                <p class="text-sm text-green-800 dark:text-green-300 font-medium">Files uploaded successfully</p>
                <p class="text-xs text-green-700 dark:text-green-400 mt-1">
                    Your media files are ready to be saved with the place.
                </p>
            </div>
        </div>
    {/if}

    <!-- Media Preview by Type -->
    {#if mediaItems.length > 0}
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Media Preview ({mediaItems.length}/{maxFiles})
                </h4>
            </div>

            <!-- Combined Media Grid -->
            <div class="space-y-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {#each mediaItems as item, index (item.id)}
                        <div class="space-y-2">
                            <!-- Media Thumbnail -->
                            <div class="relative group bg-surface-100 dark:bg-surface-700 overflow-hidden transition-all duration-200 aspect-square rounded-lg {draggedItem?.id === item.id ? 'opacity-50' : ''} {dragOverTarget?.index === index && dragOverTarget?.type === item.type ? 'ring-2 ring-primary-500' : ''}"
                                class:cursor-move={!disabled}
                                class:hover:scale-105={!disabled}
                                draggable={!disabled}
                                role="button"
                                tabindex="0"
                                aria-label="Drag to reorder media"
                                ondragstart={(e) => handleDragStart(e, item)}
                                ondragover={(e) => handleItemDragOver(e, index, item.type === 'image' ? 'image' : 'video')}
                                ondrop={(e) => handleItemDrop(e, index, item.type === 'image' ? 'image' : 'video')}
                                ondragend={handleDragEnd}>
                                <button onclick={() => removeMediaItem(item.id)}
                                    type="button"
                                    class="absolute top-2 right-2 w-6 h-6 bg-error-500 hover:bg-error-600 text-white rounded-full flex items-center justify-center text-sm opacity-0 transition-all duration-200 hover:scale-110 shadow-md z-30"
                                    class:group-hover:opacity-100={!disabled}
                                    class:pointer-events-none={disabled}
                                    title="Remove media"
                                    disabled={disabled}>
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>

                                <div class="absolute inset-0">
                                    {#if item.thumbnail}
                                        <img src={item.thumbnail}
                                            alt="Media preview"
                                            class="w-full h-full object-cover"
                                            class:opacity-60={disabled}
                                            loading="lazy"
                                            onerror={(e) => {
                                                const target = e.currentTarget as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    {:else}
                                        <div class="absolute inset-0 flex items-center justify-center bg-surface-200 dark:bg-surface-600">
                                            <div class="text-center">
                                                {#if item.type === 'image'}
                                                    <svg class="w-8 h-8 text-surface-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                {:else}
                                                    <svg class="w-8 h-8 text-surface-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                                    </svg>
                                                {/if}
                                                <div class="text-xs text-surface-500">{item.type === 'image' ? 'Image' : 'Video'}</div>
                                            </div>
                                        </div>
                                    {/if}

                                    {#if item.type === 'video'}
                                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div class="w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                                                <svg class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    {/if}

                                    {#if item.uploading}
                                        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                                            <div class="text-center text-white">
                                                <svg class="animate-spin h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <div class="text-xs">Uploading...</div>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            {#if !disabled || (disabled && item.isDefault)}
                                <button type="button"
                                    onclick={() => !disabled && setDefaultMedia(item.id)}
                                    class="w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                                        {item.isDefault ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 border border-surface-300 dark:border-surface-600'}
                                        {disabled ? 'pointer-events-none opacity-50' : ''}"
                                    disabled={disabled}>
                                    {item.isDefault ? 'Default' : 'Set as Default'}
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
</style>