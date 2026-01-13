<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="mb-4">Welcome to Dashboard</h1>
<p class="lead">Hello, {data.user.firstName}!</p>
<div class="card">
	<div class="card-body">
		<h5 class="card-title">Dashboard Content</h5>
		<p class="card-text">Your dashboard content will go here.</p>
	</div>
</div>

<style>
	h1 {
		margin-top: 0;
	}
</style>
