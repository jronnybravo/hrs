<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	export let data;
</script>

<div class="app-container">
	<Header user={data.user} />
	
	<div class="main-content">
		<Sidebar />
		
		<main class="content">
			<div class="content-wrapper">
				<div class="container-fluid">
					<slot />
				</div>
				<Footer />
			</div>
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.content-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: 2rem 0;
	}

	:global(.content-wrapper > .container-fluid) {
		flex: 1;
	}
</style>
