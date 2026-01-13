<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="mb-4">Account Settings</h1>

<div class="row">
	<div class="col-lg-6">
		<div class="card">
			<div class="card-header">
				<h5 class="card-title mb-0">Personal Information</h5>
			</div>
			<div class="card-body">
				<div class="mb-3">
					<label for="firstName" class="form-label">First Name</label>
					<input
						type="text"
						class="form-control"
						id="firstName"
						value={data.user.firstName}
						disabled
					/>
				</div>
				<div class="mb-3">
					<label for="lastName" class="form-label">Last Name</label>
					<input
						type="text"
						class="form-control"
						id="lastName"
						value={data.user.lastName}
						disabled
					/>
				</div>
				<div class="mb-3">
					<label for="email" class="form-label">Email Address</label>
					<input
						type="email"
						class="form-control"
						id="email"
						value={data.user.email}
						disabled
					/>
				</div>
			</div>
		</div>
	</div>

	<div class="col-lg-6">
		<div class="card">
			<div class="card-header">
				<h5 class="card-title mb-0">Change Password</h5>
			</div>
			<div class="card-body">
				<form>
					<div class="mb-3">
						<label for="currentPassword" class="form-label">Current Password</label>
						<input type="password" class="form-control" id="currentPassword" />
					</div>
					<div class="mb-3">
						<label for="newPassword" class="form-label">New Password</label>
						<input type="password" class="form-control" id="newPassword" />
					</div>
					<div class="mb-3">
						<label for="confirmPassword" class="form-label">Confirm Password</label>
						<input type="password" class="form-control" id="confirmPassword" />
					</div>
					<button type="submit" class="btn btn-primary">Update Password</button>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	h1 {
		margin-top: 0;
	}

	.card {
		margin-bottom: 1.5rem;
	}

	.card-header {
		background-color: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
		padding: 1rem;
	}

	.card-title {
		color: #212529;
		font-size: 1.1rem;
	}
</style>
