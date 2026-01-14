<script lang="ts">
	import { onMount } from 'svelte';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { toUriParams } from '$lib/utils/URI';

	interface Option {
		value: string;
		label: string;
	}

	interface Props {
		value?: any;
		placeholder?: string;
		clearable?: boolean;
		disabled?: boolean;
		api?: string;
		apiSearchParam?: string;
		apiValueKey?: string;
		apiLabelKey?: string;
		onchange?: (value: string) => void;
		onclear?: () => void;
		class?: string;
		children?: any;
	}

	let {
		value = $bindable(''),
		placeholder = 'Select an option',
		clearable = true,
		disabled = false,
		api = undefined,
		apiSearchParam = 'search',
		apiValueKey = 'value',
		apiLabelKey = 'label',
		onchange,
		onclear,
		class: className = '',
		children
	}: Props = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let options = $state<Option[]>([]);
	let loading = $state(false);
	let containerRef = $state<HTMLDivElement | undefined>(undefined);
	let inputRef = $state<HTMLInputElement | undefined>(undefined);
	let debounceTimer: number;

	// Selected option label for display
	let selectedLabel = $derived(
		options.find((opt) => opt.value === value)?.label || ''
	);

	// Filtered options based on search query
	let filteredOptions = $derived(
		options.filter((opt) =>
			opt.label.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Parse options from children (option elements)
	function parseOptionsFromChildren() {
		if (!containerRef || api) return;

		const optionElements = containerRef.querySelectorAll('option');
		const parsedOptions: Option[] = [];

		optionElements.forEach((opt) => {
			parsedOptions.push({
				value: opt.value,
				label: opt.textContent?.trim() || opt.value
			});
		});

		options = parsedOptions;
	}

	// Fetch options from API
	async function fetchOptionsFromAPI(search = '') {
		if (!api) return;

		loading = true;
		try {
			let url = new URL(api);
			if (search) {
				const uriParams = toUriParams({
					search: { value: search },
				});	
				url = new URL(`${api}?${uriParams}`);
			}

			const response = await fetch(url.toString());
			const { success, data } = await response.json();

			// Assume API returns an array of objects
			if (Array.isArray(data)) {
				options = data
					.map((item) => ({
						value: item[apiValueKey],
						label: item[apiLabelKey]
					}))
					.filter((opt: Option) => opt.value !== undefined && opt.value !== null);
			} else if (data.results && Array.isArray(data.results)) {
				// Support paginated responses
				options = data.results
					.map((item: any) => ({
						value: item[apiValueKey],
						label: item[apiLabelKey]
					}))
					.filter((opt: Option) => opt.value !== undefined && opt.value !== null);
			}
		} catch (error) {
			console.error('Error fetching options:', error);
		} finally {
			loading = false;
		}
	}

	// Handle search input with debounce
	function handleSearchInput(e: Event) {
		const input = e.target as HTMLInputElement;
		searchQuery = input.value;

		if (api) {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				fetchOptionsFromAPI(searchQuery);
			}, 300) as unknown as number;
		}
	}

	// Select an option
	function selectOption(option: Option) {
		value = option.value;
		searchQuery = '';
		isOpen = false;
		onchange?.(value);
	}

	// Clear selection
	function clearSelection(e: Event) {
		e.stopPropagation();
		value = '';
		searchQuery = '';

		onclear?.();
		onchange?.('');
	}

	// Toggle dropdown
	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			setTimeout(() => inputRef?.focus(), 0);
		}
	}

	// Close dropdown
	function closeDropdown() {
		isOpen = false;
		searchQuery = '';
	}

	// Handle keyboard navigation
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeDropdown();
		}
	}

	onMount(() => {
		if (api) {
			fetchOptionsFromAPI();
			// If there's an initial value, fetch that specific option to display it
			if (value) {
				fetchSelectedOption();
			}
		} else {
			parseOptionsFromChildren();
		}
	});

	// Fetch the selected option details when value is set
	async function fetchSelectedOption() {
		if (!api || !value) return;

		try {
			// Try to fetch the specific item by ID
			const itemUrl = api.endsWith('/') ? `${api}${value}` : `${api}/${value}`;
			const response = await fetch(itemUrl);
			
			if (!response.ok) {
				console.warn(`Selected option with value ${value} not found`);
				return;
			}

			const { success, data } = await response.json();

			if (success && data) {
				const selectedOption = {
					value: data[apiValueKey],
					label: data[apiLabelKey]
				};

				// Add to options if not already there
				if (!options.find(opt => opt.value === selectedOption.value)) {
					options = [selectedOption, ...options];
				}
			}
		} catch (error) {
			console.error('Error fetching selected option:', error);
			// Silently fail - the dropdown will just show the placeholder
		}
	}

	// Watch for value changes and fetch the option if needed
	$effect(() => {
		if (value && api && !options.find(opt => opt.value === value)) {
			fetchSelectedOption();
		}
	});
</script>

<div
	bind:this={containerRef}
	class="relative w-full {className}"
	use:clickOutside={() => closeDropdown()}
>
	<!-- Hidden slot for option children -->
	<div class="hidden">
		{@render children?.()}
	</div>

	<!-- Select button/trigger -->
	<button
		type="button"
		onclick={toggleDropdown}
		disabled={disabled}
		class="relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
		class:opacity-50={disabled}
	>
		<span class="block truncate">
			{selectedLabel || placeholder}
		</span>

		<!-- Icons -->
		<span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
			{#if clearable && value && !disabled}
				<div
					role="button"
					tabindex="0"
					aria-label="Clear selection"
					onclick={clearSelection}
					onkeydown={(e) => e.key === 'Enter' && clearSelection(e)}
					class="pointer-events-auto rounded p-1 hover:bg-gray-200 cursor-pointer"
				>
					<svg
						class="h-4 w-4 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</div>
			{:else}
				<svg
					class="h-5 w-5 text-gray-400 transition-transform"
					class:rotate-180={isOpen}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			{/if}
		</span>
	</button>

	<!-- Dropdown -->
	{#if isOpen}
		<div
			class="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
			role="listbox"
			tabindex="0"
			onkeydown={handleKeydown}
		>
			<!-- Search input -->
			<div class="border-b border-gray-200 p-2">
				<input
					bind:this={inputRef}
					type="text"
					value={searchQuery}
					oninput={handleSearchInput}
					placeholder="Search..."
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			<!-- Options list -->
			<div class="max-h-60 overflow-auto py-1">
				{#if loading}
					<div class="px-3 py-2 text-center text-sm text-gray-500">
						Loading...
					</div>
				{:else if filteredOptions.length === 0}
					<div class="px-3 py-2 text-center text-sm text-gray-500">
						No options found
					</div>
				{:else}
					{#each filteredOptions as option (option.value)}
						<button
							type="button"
							onclick={() => selectOption(option)}
							class="w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50"
							class:bg-blue-100={option.value === value}
							class:font-semibold={option.value === value}
						>
							{option.label}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.rotate-180 {
		transform: rotate(180deg);
	}
</style>
