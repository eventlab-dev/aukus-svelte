<script lang="ts">
	import { fly } from 'svelte/transition'

	type Stat = {
		title: string
		value: string
	}

	type Props = {
		stats: Stat[]
	}

	let { stats }: Props = $props()

	const baseDelay = 2000
</script>

<div class="flex flex-wrap justify-center gap-3">
	{#each stats as s, idx (s.title)}
		<div
			class="w-fit rounded-xl bg-card p-3"
			in:fly|global={{ y: 20, duration: 400, delay: baseDelay + 200 * idx }}
		>
			<div class="mb-3 font-semibold text-[#9F9F9F]">{s.title}</div>
			<div class="font-roboto-wide-black-alt text-4xl">{s.value}</div>
		</div>
	{/each}
</div>
