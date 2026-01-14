<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import emblaCarouselSvelte from 'embla-carousel-svelte';
    import Autoplay from 'embla-carousel-autoplay';
    import Player from '@vimeo/player';
    import YouTubePlayer from 'youtube-player';

    interface MediaItem {
        url: { original: string; thumbnail?: string };
        type?: 'image' | 'video';
        name?: string;
        description?: string;
    }

    interface Props {
        media?: MediaItem[];
        altText?: string;
        height?: string;
        autoPlay?: boolean;
        interval?: number;
        showOverlay?: boolean;
        overlayContent?: any;
    }

    let {
        media = [],
        altText = '',
        height = 'h-96',
        autoPlay = true,
        interval = 5000,
        showOverlay = false,
        overlayContent = undefined
    }: Props = $props();

    let emblaApi: any;
    let selectedIndex = $state(0);
    let autoplayRef: any;
    let iframeElements: { [key: number]: HTMLIFrameElement } = {};
    let vimeoPlayers: { [key: number]: Player } = {};
    let youtubePlayers: { [key: number]: ReturnType<typeof YouTubePlayer> } = {};
    let videoElements: HTMLVideoElement[] = [];
    let isAutoplayActive = autoPlay;

    const options = { loop: true };
    const autoplayPluginFactory = Autoplay({ delay: interval, stopOnInteraction: false });
    const plugins = autoPlay ? [autoplayPluginFactory] : [];

    // --- Original Logic Restored ---

    function onInit(event: CustomEvent) {
        emblaApi = event.detail;
        selectedIndex = emblaApi.selectedScrollSnap();
        autoplayRef = emblaApi?.plugins?.().autoplay;
        isAutoplayActive = !!autoplayRef;

        emblaApi.on('select', () => {
            selectedIndex = emblaApi.selectedScrollSnap();
            if (browser) {
                videoElements.forEach((vid) => vid.pause());
                Object.values(youtubePlayers).forEach((player) => {
                    try { player.pauseVideo(); } catch {}
                });
                Object.values(vimeoPlayers).forEach((player) => {
                    try { player.pause(); } catch {}
                });
                resumeAutoplay();
                if (isAutoplayActive && emblaApi.plugins().autoplay?.reset) {
                    emblaApi.plugins().autoplay.reset();
                }
            }
        });
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!emblaApi) return;
        if (e.key === 'ArrowLeft') emblaApi.scrollPrev();
        if (e.key === 'ArrowRight') emblaApi.scrollNext();
    }

    function getVideoType(url: string): 'youtube' | 'vimeo' | 'direct' | null {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('vimeo.com')) return 'vimeo';
        if (url.match(/\.(mp4|webm|ogg)$/i)) return 'direct';
        return 'direct';
    }

    function getYouTubeVideoId(url: string): string | null {
        const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/i;
        const match = regExp.exec(url);
        return match ? match[1] : null;
    }

    function getVimeoVideoId(url: string): string | null {
        const regExp = /vimeo\.com\/(?:video\/)?(\d+)/i;
        const match = regExp.exec(url);
        return match ? match[1] : null;
    }

    function pauseAutoplay() {
        if (emblaApi && isAutoplayActive) {
            emblaApi.plugins().autoplay?.destroy?.();
            isAutoplayActive = false;
        }
    }

    function resumeAutoplay() {
        if (emblaApi && !isAutoplayActive) {
            emblaApi.reInit({ options, plugins: [autoplayPluginFactory] });
            isAutoplayActive = true;
        }
    }

    function handleEmbedMessage(event: MessageEvent) {
        try {
            const raw = event.data;
            let data = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : raw;
            if (!data) return;

            if (event.origin.includes('youtube.com') || event.origin.includes('youtu.be')) {
                if (data.event === 'onStateChange' && typeof data.info === 'number') {
                    if (data.info === 1) pauseAutoplay();
                    if (data.info === 2 || data.info === 0) resumeAutoplay();
                }
            }
            if (event.origin.includes('vimeo.com')) {
                if (data.event === 'play') pauseAutoplay();
                if (data.event === 'pause' || data.event === 'ended') resumeAutoplay();
            }
        } catch {}
    }

    onMount(() => {
        if (!browser) return;
        window.addEventListener('message', handleEmbedMessage);

        videoElements.forEach((video) => {
            video.addEventListener('play', pauseAutoplay);
            video.addEventListener('pause', resumeAutoplay);
            video.addEventListener('ended', resumeAutoplay);
        });

        Object.entries(iframeElements).forEach(([i, iframe]) => {
            const idx = Number(i);
            if (iframe?.src?.includes('vimeo.com')) {
                try {
                    vimeoPlayers[idx] = new Player(iframe);
                    vimeoPlayers[idx].on('play', pauseAutoplay);
                    vimeoPlayers[idx].on('pause', resumeAutoplay);
                    vimeoPlayers[idx].on('ended', resumeAutoplay);
                } catch {}
            }
            if (iframe?.src?.includes('youtube.com')) {
                try {
                    youtubePlayers[idx] = YouTubePlayer(iframe);
                    youtubePlayers[idx].on('stateChange', (event: any) => {
                        if (event.data === 1) pauseAutoplay();
                        if (event.data === 2 || event.data === 0) resumeAutoplay();
                    });
                } catch {}
            }
        });
    });

    onDestroy(() => {
        if (!browser) return;
        window.removeEventListener('message', handleEmbedMessage);
        videoElements.forEach((video) => {
            video.removeEventListener('play', pauseAutoplay);
            video.removeEventListener('pause', resumeAutoplay);
            video.removeEventListener('ended', resumeAutoplay);
        });
        Object.values(vimeoPlayers).forEach((player) => {
            try {
                player.off('play', pauseAutoplay);
                player.off('pause', resumeAutoplay);
                player.off('ended', resumeAutoplay);
            } catch {}
        });
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative w-full overflow-hidden bg-neutral-950 group {height}">
    {#if media.length === 0}
        <div class="w-full h-full flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-400">
            <i class="bi bi-image text-6xl mb-4"></i>
            <p>No media available</p>
        </div>
    {:else}
        <div class="embla h-full w-full"
            use:emblaCarouselSvelte={{ options, plugins }}
            onemblaInit={onInit}
            role="region"
            aria-label="Media carousel">
            <div class="embla__container h-full flex">
                {#each media as item, index}
                    <div class="embla__slide relative h-full w-full flex-[0_0_100%] min-w-0">
                        {#if item.type === 'video'}
                            {@const videoType = getVideoType(item.url.original)}
                            {#if videoType === 'youtube'}
                                {@const videoId = getYouTubeVideoId(item.url.original)}
                                {#if videoId}
                                    <iframe bind:this={iframeElements[index]}
                                        class="w-full h-full object-cover"
                                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&mute=0&playsinline=1&enablejsapi=1`}
                                        title={item.name || altText}
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowfullscreen>
                                    </iframe>
                                {/if}
                            {:else if videoType === 'vimeo'}
                                {@const videoId = getVimeoVideoId(item.url.original)}
                                {#if videoId}
                                    <iframe bind:this={iframeElements[index]}
                                        class="w-full h-full object-cover"
                                        src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&autoplay=0&muted=0`}
                                        title={item.name || altText}
                                        frameborder="0"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowfullscreen>
                                    </iframe>
                                {/if}
                            {:else}
                                <!-- svelte-ignore a11y_media_has_caption -->
                                <video bind:this={videoElements[index]}
                                    class="w-full h-full object-cover"
                                    controls
                                    preload="auto">
                                    <source src={item.url.original} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            {/if}
                        {:else}
                            <img src={item.url.original}
                                alt={item.name || item.description || altText}
                                class="w-full h-full object-cover select-none pointer-events-none"
                                draggable="false" />
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        {#if media.length > 1}
            <button onclick={() => emblaApi?.scrollPrev()}
                class="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/80 text-white w-12 h-12 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous slide">
                <i class="bi bi-chevron-left text-2xl"></i>
            </button>

            <button onclick={() => emblaApi?.scrollNext()}
                class="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/80 text-white w-12 h-12 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next slide">
                <i class="bi bi-chevron-right text-2xl"></i>
            </button>

            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
                <div class="flex gap-2">
                    {#each media as _, i}
                        <button onclick={() => emblaApi?.scrollTo(i)}
                            class="h-1.5 rounded-full transition-all duration-300 {i === selectedIndex ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60 w-2'}"
                            aria-label="Go to slide {i + 1}"></button>
                    {/each}
                </div>
            </div>

            <div class="absolute top-4 right-4 z-30 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                {selectedIndex + 1} / {media.length}
            </div>
        {/if}

        {#if overlayContent || showOverlay}
            <div class="absolute inset-x-0 bottom-0 pt-20 pb-8 px-6 z-20 pointer-events-none bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                {#if overlayContent}
                    <div class="pointer-events-auto text-white">
                        {@render overlayContent()}
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    .embla {
        overflow: hidden;
    }
    .embla__container {
        display: flex;
    }
    /* Simple ensures child elements respect the slide container */
    .embla__slide iframe, 
    .embla__slide video, 
    .embla__slide img {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>