<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="container">
	<div class="row align-items-center min-vh-100">
		<div class="col-lg-6 mx-auto text-center">
			<h1 class="display-4 fw-bold mb-4">Welcome to {data.companyName}</h1>
			<p class="lead mb-4">A modern Human Resource System built with Svelte and Bootstrap</p>
			<div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
				<button type="button" class="btn btn-primary btn-lg px-4 gap-3">Get Started</button>
				<button type="button" class="btn btn-outline-secondary btn-lg px-4">Learn More</button>
			</div>
		</div>
	</div>
</div>
