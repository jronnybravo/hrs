<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/state';
    
    // Helper functions for point string conversion
    function parsePointString(point: string | null): { latitude: number; longitude: number } | null {
        if (!point || typeof point !== 'string') return null;
        // Parse POINT(longitude latitude) format
        const match = point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match && match[1] && match[2]) {
            const longitude = parseFloat(match[1]);
            const latitude = parseFloat(match[2]);
            if (!isNaN(longitude) && !isNaN(latitude)) {
                return { latitude, longitude };
            }
        }
        return null;
    }
    
    function encodePointString(coordinates: { latitude: number; longitude: number } | null): string | null {
        if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
            return null;
        }
        if (isNaN(coordinates.latitude) || isNaN(coordinates.longitude)) {
            return null;
        }
        return `POINT(${coordinates.longitude} ${coordinates.latitude})`;
    }
    
    // Props
    let {
        value = $bindable(null),
        center = { latitude: 9.2048, longitude: 123.5504 }, // Default to Siquijor
        zoom = 12,
        height = '320px',
        disabled = false,
        placeholder = 'Click on the map to select coordinates or drag the marker to adjust the position.',
        showCoordinates = true,
        clearable = true,
        onchange
    }: {
        value?: string | { latitude: number; longitude: number } | null;
        center?: { latitude: number; longitude: number };
        zoom?: number;
        height?: string;
        disabled?: boolean;
        placeholder?: string;
        showCoordinates?: boolean;
        clearable?: boolean;
        onchange?: (coordinates: { latitude: number; longitude: number } | null) => void;
    } = $props();

    let id = $derived(page.params.id);
    let isEdit = $derived(page.url.searchParams.has("edit"));
    let isNew = $derived(id === "new");
    let isView = $derived(!isNew && !isEdit);
    
    // Derive coordinate object from value (handles both string and object formats)
    let coordinatesObject = $derived.by(() => {
        if (typeof value === 'string') {
            return parsePointString(value);
        }
        return value;
    });

    // Internal state
    let mapComponent: any = $state(null);
    let markerComponent: any = $state(null);
    let isInitialized = $state(false);
    let mapComponentsLoaded = $state(false);
    let currentMapCenter = $state(center);
    let currentZoom = $state(zoom);
    let markerPosition: [number, number] | null = $state(null);
    
    // Sveaflet components
    let Map: any = $state();
    let TileLayer: any = $state();
    let Marker: any = $state();
    let Popup: any = $state();

    // Watch for external value changes
    $effect(() => {
        if (coordinatesObject && (markerPosition === null || markerPosition[0] !== coordinatesObject.latitude || markerPosition[1] !== coordinatesObject.longitude)) {
            updateMarkerFromValue();
        }
    });

    function updateMarkerFromValue() {
        if (coordinatesObject && typeof coordinatesObject.latitude === 'number' && typeof coordinatesObject.longitude === 'number' && !isNaN(coordinatesObject.latitude) && !isNaN(coordinatesObject.longitude)) {
            markerPosition = [coordinatesObject.latitude, coordinatesObject.longitude];
            // Update map center when value changes externally
            currentMapCenter = { latitude: coordinatesObject.latitude, longitude: coordinatesObject.longitude };
        } else {
            markerPosition = null;
        }
    }

    function handleMapClick(event: any) {
        if (disabled) return;
        
        // For sveaflet, the latlng is directly on the event object
        const latlng = event.latlng;
        
        if (!latlng) {
            console.error('Could not find latlng in event:', event);
            return;
        }
        
        const coordinates = { latitude: latlng.lat, longitude: latlng.lng };
        
        // Always encode as point string to maintain consistency
        value = encodePointString(coordinates);
        markerPosition = [latlng.lat, latlng.lng];
        
        onchange?.(coordinates);
    }

    function handleMarkerDragEnd(event: any) {
        if (disabled) return;
        
        // sveaflet dragend doesn't include latlng, we need to get it from the marker
        const marker = event.target;
        
        if (!marker || !marker.getLatLng) {
            console.error('Could not get marker position from dragend event:', event);
            return;
        }
        
        const latlng = marker.getLatLng();
        const coordinates = { latitude: latlng.lat, longitude: latlng.lng };
        
        // Always encode as point string to maintain consistency
        value = encodePointString(coordinates);
        markerPosition = [latlng.lat, latlng.lng];
        
        onchange?.(coordinates);
    }

    function handleClear() {
        if (disabled) return;
        
        value = null;
        markerPosition = null;
        onchange?.(null);
    }

    // Public API for external access
    export function updateCoordinates(newValue: { latitude: number; longitude: number } | null) {
        value = newValue;
        if (newValue) {
            updateMarkerFromValue();
        }
    }

    $effect(() => {
        if (browser) {
            // Load sveaflet components dynamically
            (async () => {
                const sveaflet = await import('sveaflet');
                Map = sveaflet.Map;
                TileLayer = sveaflet.TileLayer;
                Marker = sveaflet.Marker;
                Popup = sveaflet.Popup;
                mapComponentsLoaded = true;
                
                isInitialized = true;
                // Initialize marker position from value
                if (coordinatesObject) {
                    updateMarkerFromValue();
                }
            })();
        }
        
        // Cleanup function (equivalent to onDestroy)
        return () => {
            isInitialized = false;
            mapComponent = null;
            markerComponent = null;
        };
    });
</script>

<div class="space-y-4">
    <div>
        {#if placeholder}
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
                {placeholder}
            </p>
        {/if}
        
        {#if showCoordinates && value}
            <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg mb-3 shadow-sm">
                <div class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-blue-600 dark:text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span class="font-medium text-surface-700 dark:text-surface-300">Location:</span>
                    <span class="text-surface-600 dark:text-surface-400 ml-2 font-mono text-xs {isView ? 'opacity-60' : ''}">
                        {coordinatesObject?.latitude?.toFixed(6)}, {coordinatesObject?.longitude?.toFixed(6)}
                    </span>
                </div>
                {#if clearable && !disabled}
                    <button
                        type="button"
                        disabled={isView}
                        onclick={handleClear}
                        class="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors rounded-full p-1 flex-shrink-0"
                        aria-label="Clear location"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                {/if}
            </div>
        {/if}

        <div class="relative">
            {#if browser && isInitialized && mapComponentsLoaded}
                <div 
                    class="w-full rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm {disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary-300 dark:hover:border-primary-600'} transition-all duration-200 overflow-hidden relative"
                    style="min-height: {height}; height: {height};"
                >
                    {#if Map}
                        {@const MapComponent = Map}
                        <MapComponent 
                            bind:this={mapComponent}
                            options={{
                                center: [currentMapCenter.latitude, currentMapCenter.longitude],
                                zoom: currentZoom,
                                dragging: !disabled,
                                touchZoom: !disabled,
                                doubleClickZoom: !disabled,
                                scrollWheelZoom: !disabled,
                                boxZoom: !disabled,
                                keyboard: !disabled,
                                zoomControl: !disabled,
                                attributionControl: true
                            }}
                            onclick={handleMapClick}
                        >
                            {#if TileLayer}
                                {@const TileLayerComponent = TileLayer}
                                <TileLayerComponent 
                                    url={'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
                                    options={{
                                        attribution: '© OpenStreetMap contributors',
                                        maxZoom: 19
                                    }}
                                />
                            {/if}
                            
                            {#if markerPosition && Marker}
                                {@const MarkerComponent = Marker}
                                <MarkerComponent 
                                    bind:this={markerComponent}
                                    latLng={markerPosition}
                                    options={{
                                        draggable: !disabled
                                    }}
                                    ondragend={handleMarkerDragEnd}
                                >
                                    {#if Popup}
                                        {@const PopupComponent = Popup}
                                        <PopupComponent>
                                            <div class="text-surface-900 dark:text-surface-100 p-2">
                                                <div class="font-semibold text-sm">Selected Location</div>
                                                <div class="text-xs text-surface-600 dark:text-surface-400 font-mono mt-1">
                                                    {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                                                </div>
                                            </div>
                                        </PopupComponent>
                                    {/if}
                                </MarkerComponent>
                            {/if}
                        </MapComponent>
                    {/if}
                    
                    {#if disabled}
                        <!-- Disabled overlay to prevent interactions while still showing the map -->
                        <div class="absolute inset-0 bg-transparent cursor-not-allowed z-10" title="Map is disabled"></div>
                    {/if}
                </div>
            {:else}
                <div 
                    class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-500 dark:text-surface-400"
                    style="height: {height};"
                >
                    Loading map...
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Map container styling */
    :global(.sveaflet-map) {
        width: 100%;
        height: 100%;
        border-radius: 0.5rem;
    }

    /* Leaflet control styling for dark mode */
    :global(.dark .leaflet-control-zoom a) {
        background-color: rgba(0, 0, 0, 0.7) !important;
        color: white !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
    }

    :global(.dark .leaflet-control-zoom a:hover) {
        background-color: rgba(0, 0, 0, 0.9) !important;
    }

    :global(.dark .leaflet-control-attribution) {
        background: rgba(0, 0, 0, 0.7) !important;
        color: rgba(255, 255, 255, 0.8) !important;
    }

    :global(.dark .leaflet-control-attribution a) {
        color: rgba(255, 255, 255, 0.9) !important;
    }

    /* Popup styling */
    :global(.leaflet-popup-content-wrapper) {
        border-radius: 0.5rem !important;
    }

    :global(.dark .leaflet-popup-content-wrapper) {
        background-color: rgba(30, 41, 59, 0.95) !important;
        color: white !important;
    }

    :global(.dark .leaflet-popup-tip) {
        background-color: rgba(30, 41, 59, 0.95) !important;
    }

    /* Ensure map interactions work properly and proper z-index */
    :global(.leaflet-container) {
        cursor: grab;
        position: relative;
        z-index: 1 !important;
    }
    
    :global(.leaflet-container:active) {
        cursor: grabbing;
    }

    /* Ensure all leaflet panes stay below headers/footers */
    :global(.leaflet-pane) {
        z-index: 1 !important;
    }

    :global(.leaflet-map-pane) {
        z-index: 1 !important;
    }

    :global(.leaflet-tile-pane) {
        z-index: 1 !important;
    }

    :global(.leaflet-overlay-pane) {
        z-index: 2 !important;
    }

    :global(.leaflet-shadow-pane) {
        z-index: 3 !important;
    }

    :global(.leaflet-marker-pane) {
        z-index: 4 !important;
    }

    :global(.leaflet-tooltip-pane) {
        z-index: 5 !important;
    }

    :global(.leaflet-popup-pane) {
        z-index: 6 !important;
    }

    /* Ensure controls stay accessible but below navigation */
    :global(.leaflet-control-container) {
        z-index: 10 !important;
    }

    :global(.leaflet-control) {
        z-index: 10 !important;
    }
</style>