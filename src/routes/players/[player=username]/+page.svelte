<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import Socials from '../../../lib/components/Socials.svelte'
	import { fade } from 'svelte/transition'
	import Summary from './components/Summary.svelte'
	import MoveCard from '../../../lib/components/moveCard/MoveCard.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { page } from '$app/state'
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte'
	import { Input } from '$lib/components/ui/input'
	import Canvas from './components/Canvas.svelte'

	const { playersMovesStore, playersBySlug, canvasStore } = getAppManagerContext()
	const { moves, playerSlug: movesPlayerSlug } = playersMovesStore
	const { playerSlug: canvasPlayerSlug } = canvasStore

	$effect(() => {
		movesPlayerSlug.set(page.params.player!)
		canvasPlayerSlug.set(page.params.player!)
	})

	const playerSlug = page.params.player

	const player = $derived($playersBySlug[playerSlug!])
	const gamesCompleted = $derived($moves.filter((move) => move.type === 'completed').length || 0)
	const socials = $derived({
		twitchLink: player.twitch_stream_link || '',
		donationAlertsLink: player.donation_link || '',
		telegramLink: player.telegram_link || '',
		vkLiveLink: player.vk_stream_link || '',
		kickLink: player.kick_stream_link || ''
	})

	let filterValue = $state('')

	const filteredMoves = $derived(
		$moves.filter((move) => {
			const filterText = filterValue.toLowerCase()
			return (
				move.item_title.toLowerCase().includes(filterText) ||
				(move.item_review && move.item_review.toLowerCase().includes(filterText))
			)
		})
	)

	let contentContainer = $state<HTMLDivElement | null>(null)
	let contentCenter = $state(0)
	let contentHeight = $state(0)

	$effect(() => {
		if (contentContainer) {
			const observer = new ResizeObserver(() => {
				if (contentContainer) {
					contentCenter = contentContainer.clientWidth / 2
					contentHeight = contentContainer.clientHeight
				}
			})

			observer.observe(contentContainer)

			// Initial measure
			contentCenter = contentContainer.clientWidth / 2
			contentHeight = contentContainer.clientHeight

			return () => observer.disconnect()
		}
	})
</script>

<svelte:head>
	{#if player}
		<title>Aukus - {player.username}</title>
	{/if}
</svelte:head>

{#if player}
	<Canvas playerSlug={player.slug} {contentCenter} {contentHeight} />
	<div class="relative mt-20" bind:this={contentContainer}>
		<div class="mx-auto flex w-fit flex-col items-center" in:fade>
			<PlayerAvatar
				src={player.avatar_link ?? ''}
				name={player.username}
				isOnline={Boolean(player.is_online)}
				size="lg"
				class="mb-2.5"
			/>
			<div class="mb-[30px] flex flex-col items-center gap-5">
				<div class="text-5xl leading-[58px] font-bold">
					{player.first_name} «{player.username}»
				</div>
				<Socials {...socials} />
				<Summary
					totalScore={player.total_score}
					{gamesCompleted}
					gameName={player.current_game || ''}
					gameImage={player.current_game_cover || ''}
					gameDuration={player.current_game_duration || 0}
				/>
			</div>

			<div class="relative w-full">
				<SearchIcon
					class="absolute top-1/2 left-3 size-[19px] -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					id="moves-search"
					class="w-full pl-[43px]"
					type="text"
					placeholder="Поиск среди игр всех аукусов"
					bind:value={filterValue}
				/>
			</div>

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
{/if}
