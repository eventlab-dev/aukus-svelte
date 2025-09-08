<script lang="ts">
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		gameTitle: string;
	};

	const { gameTitle }: Props = $props();

	const cleanGameTitle = $derived(gameTitle.replace(/\s*\(\d{4}\)\s*$/, '').trim());

	const href = $derived(
		cleanGameTitle
			? `https://howlongtobeat.com/?q=${encodeURIComponent(cleanGameTitle)}`
			: 'https://howlongtobeat.com/'
	);
</script>

<Button {href} target="_blank" class="w-[150px] rounded-lg" disabled={!gameTitle}>
	На HLTB <ArrowRightIcon class="size-5" />
</Button>
