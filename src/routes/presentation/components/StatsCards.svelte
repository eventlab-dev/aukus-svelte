<script lang="ts">
	type Stat = {
		title: string
		value: string
	}

	type Props = {
		stats: Stat[]
	}

	let { stats }: Props = $props()
</script>

<div class="flex flex-wrap justify-center gap-3">
	{#each stats as s (s.title)}
		<div class="w-fit rounded-xl bg-card p-4">
			<div class="mb-3 font-semibold text-[#9F9F9F]">{s.title}</div>
			<div class="font-roboto-wide-black-alt text-4xl">{s.value}</div>
		</div>
	{/each}
</div>
