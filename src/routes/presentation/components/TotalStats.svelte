<script lang="ts">
	import StatsCards from './StatsCards.svelte'

	const stats = [
		{ title: 'Total games', value: '100' },
		{ title: 'Full', value: '10/100' }
	]
</script>

<div class="max-w-[1100px]">
	<div class="mb-7 text-center text-6xl font-bold">Общая статистика</div>
	<div class="flex justify-center">
		<StatsCards {stats} />
	</div>
</div>
