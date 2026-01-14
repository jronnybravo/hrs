<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme';

	interface Props {
		value: string | null;
		id?: string;
		placeholder?: string;
		disabled?: boolean;
	}

	let {
		value = $bindable(''),
		id = 'hugerte-editor',
		placeholder = '',
		disabled = false 
	}: Props = $props();

	let editorElement: HTMLTextAreaElement | undefined = $state();
	let editor: any;
	let unsubscribe: (() => void) | null = null;

	async function initializeEditor(isDark: boolean) {
		// Destroy existing editor first
		if (editor) {
			try {
				editor.destroy();
			} catch (e) {
				// ignore
			}
		}

		if (!browser || !editorElement) {
			return;
		}
		
		// Load hugerte from static folder
		const hugerte = (window as any).hugerte;
		
		if (!hugerte) {
			console.error('Hugerte not loaded');
			return;
		}
		
		const editors = await hugerte.init({
			selector: `textarea#${id}`,
			plugins: ['lists', 'link', 'image', 'code'],
			toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | code',
			placeholder: placeholder || 'Enter content...',
			height: 400,
			htmlEditMode: true,
			base_url: '/plugins/hugerte',
			suffix: '.min',
			skin: isDark ? 'oxide-dark' : 'oxide',
			content_css: 'default',
			content_style: `
				body {
					background-color: ${isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)'};
					color: ${isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'};
					font-family: inherit;
				}
			`
		});

		editor = editors?.[0];

		if (editor) {
			editor.setContent(value || '');

			editor.on('change', () => {
				value = editor.getContent();
			});

			if (disabled) {
				editor.mode.set('readonly');
			}
		} else {
			console.error('No editor instance created');
		}
	}

	onMount(async () => {
		if (!browser) {
			return;
		}
		
		// Initialize editor with current theme
		const currentTheme = themeStore.getCurrentTheme();
		await initializeEditor(currentTheme === 'dark');

		// Subscribe to theme changes
		unsubscribe = themeStore.subscribe((theme) => {
			initializeEditor(theme === 'dark');
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (editor) {
			try {
				editor.destroy();
			} catch (e) {
				// ignore
			}
		}
	});
</script>

<div class="hugerte-editor-wrapper">
	<textarea {id} bind:this={editorElement} class="hugerte-editor">{value}</textarea>
</div>

<style>
	.hugerte-editor-wrapper {
		position: relative;
	}

	/* Hide the textarea */
	:global(#hugerte-editor) {
		display: none;
	}

	/* Main editor container - use built-in themes */
	:global(.tox.tox-tinymce) {
		border: 1px solid rgb(229, 231, 235) !important;
		border-radius: 0.375rem !important;
	}

	:global(.dark .tox.tox-tinymce) {
		border-color: rgb(55, 65, 81) !important;
	}
</style>
