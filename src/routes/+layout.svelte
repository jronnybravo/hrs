<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-wrapper">
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.app-wrapper {
		min-height: 100vh;
		background-color: #ffffff;
	}
</style>
