<script lang="ts">
	import ImageLoader from '$lib/components/ImageLoader.svelte';
	import { FALLBACK_GAME_POSTER } from '$lib/constants';
	import { formatMs } from '$lib/utils';

	type Props = {
		totalScore: number;
		gamesCompleted: number;
		gameName: string;
		gameImage: string;
		gameDuration: number;
		mainPlatform: string | null;
	};

	const { totalScore, gamesCompleted, gameName, gameImage, gameDuration, mainPlatform }: Props = $props();

	function getPlatformName(platform: string | null): string {
		switch (platform?.toLowerCase()) {
			case 'twitch':
				return 'Твич';
			case 'vk':
				return 'VK Play';
			case 'kick':
				return 'Кик';
			default:
				return 'Твич';
		}
	}

	const platformName = $derived(getPlatformName(mainPlatform));
</script>

<div class="flex gap-3">
	<div class="flex w-[150px] flex-col gap-3 rounded-xl bg-card p-3">
		<div class="text-sm leading-[17px] font-semibold text-muted-foreground">Игр пройдено</div>
		<div class="text-5xl leading-[58px] font-bold">{gamesCompleted}</div>
	</div>
	<div class="flex w-[150px] flex-col gap-3 rounded-xl bg-card p-3">
		<div class="text-sm leading-[17px] font-semibold text-muted-foreground">Очков получено</div>
		<div class="text-5xl leading-[58px] font-bold">{totalScore}</div>
	</div>
	<div class="flex w-[476px] flex-col gap-3 rounded-xl bg-card p-3">
		<div class="flex justify-between text-sm leading-[17px] font-semibold text-muted-foreground">
			<div>Стримит на {platformName}</div>
			{#if gameDuration}
				<div>{formatMs(gameDuration * 1000)}</div>
			{/if}
		</div>
		<div class="flex gap-2">
			{#if gameName}
				<ImageLoader src={gameImage || FALLBACK_GAME_POSTER} alt={gameName} class="h-[58px] w-[43px] overflow-hidden" />
			{/if}
			<div class="text-2xl leading-[29px] font-bold">
				{gameName || 'Выбирает игру...'}
			</div>
		</div>
	</div>
</div>
