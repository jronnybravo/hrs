<script lang="ts">
	let isCollapsed = false;

	function toggleSidebar() {
		isCollapsed = !isCollapsed;
	}
</script>

<aside class="sidebar" class:collapsed={isCollapsed}>
	<div class="sidebar-header">
		<button class="btn btn-outline-secondary btn-sm" on:click={toggleSidebar} title="Toggle sidebar">
			<i class="bi bi-list"></i>
		</button>
		{#if !isCollapsed}
			<span class="sidebar-title">Menu</span>
		{/if}
	</div>

	<nav class="sidebar-nav">
		<a href="/dashboard" class="sidebar-link" title="Dashboard">
			<i class="bi bi-house-fill"></i>
			{#if !isCollapsed}
				<span>Dashboard</span>
			{/if}
		</a>
		<a href="/employees" class="sidebar-link" title="Employees">
			<i class="bi bi-people-fill"></i>
			{#if !isCollapsed}
				<span>Employees</span>
			{/if}
		</a>
		<a href="/departments" class="sidebar-link" title="Departments">
			<i class="bi bi-diagram-3"></i>
			{#if !isCollapsed}
				<span>Departments</span>
			{/if}
		</a>
		<a href="/attendance" class="sidebar-link" title="Attendance">
			<i class="bi bi-calendar-check"></i>
			{#if !isCollapsed}
				<span>Attendance</span>
			{/if}
		</a>
		<a href="/payroll" class="sidebar-link" title="Payroll">
			<i class="bi bi-wallet2"></i>
			{#if !isCollapsed}
				<span>Payroll</span>
			{/if}
		</a>
	</nav>
</aside>

<style>
	.sidebar {
		width: 250px;
		background-color: #f8f9fa;
		border-right: 1px solid #dee2e6;
		height: calc(100vh - 56px);
		overflow-y: auto;
		transition: width 0.3s ease;
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 56px;
	}

	.sidebar.collapsed {
		width: 70px;
	}

	.sidebar-header {
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 1px solid #dee2e6;
	}

	.sidebar-title {
		font-weight: 600;
		color: #212529;
		white-space: nowrap;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
		flex: 1;
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: #495057;
		text-decoration: none;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.sidebar-link:hover {
		background-color: #e9ecef;
		color: #212529;
	}

	.sidebar-link i {
		font-size: 1.25rem;
		min-width: 1.5rem;
		text-align: center;
	}

	.sidebar-link span {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
