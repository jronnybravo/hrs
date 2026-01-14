<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let email = '';
	let password = '';
	let isLoading = false;
</script>

<div class="login-container">
	<div class="container">
		<div class="row align-items-center min-vh-100">
			<div class="col-lg-4 mx-auto">
				<div class="card shadow-lg border-0">
					<div class="card-body p-5">
						<h1 class="h3 fw-bold text-center mb-4">HRS Login</h1>

						{#if form?.error}
							<div class="alert alert-danger" role="alert">
								{form.error}
							</div>
						{/if}

						<form
							method="POST"
							action="?/login"
							use:enhance={() => {
								isLoading = true;
								return async ({ update }) => {
									isLoading = false;
									await update();
								};
							}}
						>
							<div class="mb-3">
								<label for="email" class="form-label">Email Address</label>
								<input bind:value={email}
									class="form-control"
									id="email"
									name="email"
									required
									disabled={isLoading} />
							</div>

							<div class="mb-3">
								<label for="password" class="form-label">Password</label>
								<input
									type="password"
									class="form-control"
									id="password"
									name="password"
									bind:value={password}
									required
									disabled={isLoading}
								/>
							</div>

							<button
								type="submit"
								class="btn btn-primary w-100 fw-bold"
								disabled={isLoading}
							>
								{isLoading ? 'Logging in...' : 'Login'}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.login-container {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
