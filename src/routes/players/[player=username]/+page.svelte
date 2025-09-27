<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import Socials from '../../../lib/components/Socials.svelte'
	import { fade } from 'svelte/transition'
	import Summary from './components/Summary.svelte'
	import MoveCard from '../../../lib/components/moveCard/MoveCard.svelte'
	import type { PlayerMove } from '$lib/api/aukus/types'
	import MovesSearch from '$lib/components/MovesSearch.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { page } from '$app/state'
	import { derived } from 'svelte/store'

	const { playersMovesStore, playersBySlug } = getAppManagerContext()
	const { moves } = playersMovesStore

	const playerSlug = page.params.player

	const player = derived(playersBySlug, ($playersBySlug) => $playersBySlug[playerSlug!])
	const playerMoves = derived(player, ($player) =>
		moves.filter((move) => move.player_slug === $player.slug)
	)
	const gamesCompleted = derived(
		playerMoves,
		($playerMoves) => $playerMoves.filter((move) => move.type === 'completed').length || 0
	)
	const socials = derived(player, ($player) => ({
		twitchLink: $player.twitch_stream_link || '',
		donationAlertsLink: $player.donation_link || '',
		telegramLink: $player.telegram_link || '',
		vkLiveLink: $player.vk_stream_link || '',
		kickLink: $player.kick_stream_link || ''
	}))

	let filteredMoves: PlayerMove[] = $state([])

	// const aukus1games = aukus1Games[player.url_handle];
	// const aukus2games = aukus2Games[player.url_handle];

	// const aukus1FilteredGames = $derived.by(() => {
	// 	return aukus1games?.games.filter((game) => {
	// 		return translitFilter.some((ftext) => game.title.toLowerCase().includes(ftext));
	// 	});
	// });
	// const aukus2FilteredGames = $derived.by(() => {
	// 	return aukus2games?.games.filter((game) => {
	// 		return translitFilter.some((ftext) => game.title.toLowerCase().includes(ftext));
	// 	});
	// });
</script>

<svelte:head>
	{#if $player}
		<title>Aukus - {$player.username}</title>
	{/if}
</svelte:head>

<div class="mt-20">
	<div class="mx-auto flex w-fit flex-col items-center" in:fade>
		<PlayerAvatar
			src={$player.avatar_link ?? ''}
			name={$player.username}
			isOnline={Boolean($player.is_online)}
			size="lg"
			class="mb-2.5"
		/>
		<div class="mb-[30px] flex flex-col items-center gap-5">
			<div class="text-5xl leading-[58px] font-bold">
				{$player.first_name} «{$player.username}»
			</div>
			<Socials {...$socials} />
			<Summary
				totalScore={$player.total_score}
				gamesCompleted={$gamesCompleted}
				gameName={$player.current_game || ''}
				gameImage={$player.current_game_cover || ''}
				gameDuration={$player.current_game_duration || 0}
			/>
		</div>

		<MovesSearch {moves} bind:filteredMoves />

		<div class="mt-5 space-y-[200px]">
			<div class="space-y-5">
				<!-- {#if $player.current_game}
					<MoveCard
						move={{
							item_title: player.current_game,
							item_image: player.current_game_image || '',
							stream_title_category_duration: player.current_game_duration || 0,
							created_at: player.current_game_updated_at
						}}
						isCurrentMove
					/>
				{/if} -->
				{#each filteredMoves as move (move.id)}
					<MoveCard {move} />
				{/each}
			</div>

			<!-- {#if aukus2FilteredGames?.length > 0}
				<div class="flex flex-col items-center gap-5">
					<Button href="" variant="link" class="mb-[50px] text-2xl font-semibold text-foreground">
						Аукус Сезон 2 (2023)
					</Button>
					{#each aukus2FilteredGames as move}
						<OldMoveCard {move} />
					{/each}
				</div>
			{/if}

			{#if aukus1FilteredGames?.length > 0}
				<div class="flex flex-col items-center gap-5">
					<Button href="" variant="link" class="mb-[50px] text-2xl font-semibold text-foreground">
						Аукус Сезон 1 (2022)
					</Button>
					{#each aukus1FilteredGames as move}
						<OldMoveCard {move} />
					{/each}
				</div>
			{/if} -->
		</div>
	</div>
</div>
