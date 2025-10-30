<script lang="ts">
	import EditIcon from '$lib/components/icons/EditIcon.svelte'
	import TickCircleIcon from '$lib/components/icons/TickCircleIcon.svelte'
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Badge } from '$lib/components/ui/badge'
	import Input from '$lib/components/ui/input/input.svelte'
	import { Textarea } from '$lib/components/ui/textarea'
	import { Toggle } from '$lib/components/ui/toggle'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { gameLengthRanges } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { formatDateTime, formatMs, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import PopoverGameCard from './PopoverGameCard.svelte'
	import type { CommonGameItem } from '$lib/types'

	type Props = {
		move: PlayerMoveItem
		isCurrentMove?: boolean
		withUsername?: boolean
		matchedGames: CommonGameItem[]
	}

	const { move, isCurrentMove = false, withUsername = false, matchedGames }: Props = $props()

	const { playersBySlug, myPlayer, usersStore } = getAppManagerContext()
	const { myUser } = usersStore

	const player = $derived($playersBySlug[move.player_slug])
	const canEdit = $derived.by(() => {
		if (move.player_slug === $myPlayer?.slug) {
			return true
		}
		if ($myPlayer?.moder_for.includes(player.slug)) {
			return true
		}
		if ($myUser?.roles.includes('admin')) {
			return true
		}
		return false
	})

	const categoryDuration = $derived(formatMs(move.item_duration * 1000))

	const moveTypeStyles = $derived(getMoveTypeStyles(move.type))
	const parsedReview = $derived(renderToHTML(move.item_review || ''))

	let gameTitle = $state(move.item_title)
	let vodLinks = $state(move.vod_links || '')
	let isEditMode = $state(false)
	let isVodsShown = $state(false)

	function setEditMode(pressed: boolean) {
		if (!pressed) {
			console.log('Changes saved')
		}

		isEditMode = pressed
	}

	function getEditMode() {
		return isEditMode
	}
</script>

<div
	class="group relative flex w-[800px] flex-col rounded-xl bg-card p-3 data-[current=true]:bg-primary data-[current=true]:selection:bg-foreground data-[current=true]:selection:text-primary"
	data-current={isCurrentMove}
	id={`move-card-${move.id}`}
>
	<div class="flex justify-between">
		<div class="flex">
			<div class="flex gap-1.5">
				{#if withUsername && player}
					<Badge variant="secondary" style="background-color: {player.color}">
						{player.username}
					</Badge>
				{/if}
				{#if isCurrentMove}
					<Badge variant="white">Выпало на ауке</Badge>
				{:else}
					<Badge variant={withUsername ? 'secondary' : moveTypeStyles.variant}>
						{moveTypeStyles.text}
					</Badge>
					<Badge variant="secondary">
						Кубик: {move.dice_roll}
					</Badge>
					<Badge variant="secondary">
						Ход {move.cell_from}
						->
						{move.cell_to}
					</Badge>
					<Tooltip>
						<TooltipTrigger>
							<Badge variant="secondary" class="h-full">
								Играл {categoryDuration}
							</Badge>
						</TooltipTrigger>
						<TooltipContent>Примерное время по категории стрима</TooltipContent>
					</Tooltip>
					{#if move.item_length}
						<Badge variant="secondary">
							{gameLengthRanges[move.item_length]} HLTB
						</Badge>
					{/if}
				{/if}
			</div>

			{#if canEdit}
				<Toggle
					size="sm"
					class="ml-1.5"
					bind:pressed={getEditMode, setEditMode}
					style={isCurrentMove
						? 'background-color: var(--white); color: var(--white-foreground);'
						: isEditMode
							? 'background-color: var(--primary); color: var(--primary-foreground);'
							: ''}
				>
					{#if isEditMode}
						<TickCircleIcon />
						Сохранить
					{:else}
						<EditIcon />
						Изменить
					{/if}
				</Toggle>
			{/if}
		</div>
		<div
			class="absolute top-3 right-3 text-sm leading-[17px] font-semibold text-muted-foreground group-data-[current=true]:text-foreground"
		>
			{formatDateTime(move.created_at)}
		</div>
	</div>

	<div class="mt-3 flex gap-3">
		<ImageLoader
			src={move.cover_image_url || ''}
			alt={move.item_title || ''}
			class="h-[140px] w-[105px]"
		/>
		<div class="w-full space-y-3">
			{#if isEditMode}
				<div in:fade>
					<Input
						id="game-title"
						type="text"
						class="w-full border-none bg-muted"
						bind:value={gameTitle}
					/>
				</div>
			{:else}
				<div class="text-2xl leading-[29px] font-bold" in:fade>{move.item_title}</div>
			{/if}

			{#if isEditMode || isVodsShown}
				<div class="mt-5 space-y-3" in:fade>
					<div class="font-medium">Ссылки на записи</div>
					<Textarea
						id="vod-links"
						class="w-full resize-none"
						readonly={isVodsShown}
						bind:value={vodLinks}
					/>
				</div>
			{:else if !isCurrentMove}
				<div class="font-medium text-muted-foreground [&>*]:inline" in:fade>
					<span>{move.item_rating}/10 — </span>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html parsedReview}
				</div>
			{:else}
				<div class="font-medium" in:fade>
					Время в игре — {categoryDuration}
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-3 flex justify-between" transition:slide>
		<Toggle
			size="sm"
			class="w-[105px]"
			bind:pressed={isVodsShown}
			style={isVodsShown
				? 'background-color: var(--primary); color: var(--primary-foreground);'
				: 'background-color: var(--secondary); color: var(--secondary-foreground);'}
		>
			Записи
		</Toggle>
		<div>
			{#each matchedGames as game (game.id)}
				<PopoverGameCard {game} />
			{/each}
		</div>
	</div>
</div>
