<script lang="ts">
	import { enhance } from '$app/forms';

	export let user: { firstName: string; lastName: string; email: string };

	let showDropdown = false;

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
</script>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
	<div class="container-fluid">
		<a class="navbar-brand fw-bold" href="/dashboard">HRS Dashboard</a>
		<div class="d-flex align-items-center">
			<div class="dropdown">
				<button
					class="btn btn-outline-light dropdown-toggle"
					type="button"
					on:click={toggleDropdown}
					aria-expanded={showDropdown}
				>
					{user.firstName} {user.lastName}
				</button>
				{#if showDropdown}
					<ul class="dropdown-menu dropdown-menu-end show" style="display: block;">
						<li>
							<a class="dropdown-item" href="/dashboard/account-settings">Account Settings</a>
						</li>
						<li><hr class="dropdown-divider" /></li>
						<li>
							<form method="POST" action="/dashboard?/logout" use:enhance>
								<button type="submit" class="dropdown-item text-danger w-100 text-start">
									Logout
								</button>
							</form>
						</li>
					</ul>
				{/if}
			</div>
		</div>
	</div>
</nav>

<style>
	.dropdown-menu {
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 1000;
	}

	.dropdown-item {
		border: none;
		background: none;
		cursor: pointer;
	}

	.dropdown-item:hover {
		background-color: #f8f9fa;
	}
</style>
