<script lang="ts">
	import EditIcon from '$lib/components/icons/EditIcon.svelte'
	import TickCircleIcon from '$lib/components/icons/TickCircleIcon.svelte'
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Badge } from '$lib/components/ui/badge'
	import Input from '$lib/components/ui/input/input.svelte'
	import { Textarea } from '$lib/components/ui/textarea'
	import { Toggle } from '$lib/components/ui/toggle'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { FALLBACK_GAME_POSTER, gameLengthRanges } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { formatDateTime, formatMs, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import PopoverGameCard from './PopoverGameCard.svelte'
	import DiceRollInfo from './DiceRollInfo.svelte'
	import type { CommonGameItem } from '$lib/types'

	type Props = {
		move: PlayerMoveItem
		matchedGames: CommonGameItem[]
	}

	const { move, matchedGames }: Props = $props()

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

	const difficultyText: { [key: number]: string } = {
		'-1': 'На легком',
		1: 'На сложном',
		2: 'На очень сложном'
	}
</script>

<div
	class="group relative flex w-[800px] flex-col rounded-xl bg-card p-3"
	id={`move-card-${move.id}`}
>
	<div class="flex justify-between">
		<div class="flex">
			<div class="flex gap-1.5">
				<Badge variant={moveTypeStyles.variant}>
					{moveTypeStyles.text}
				</Badge>
				{#if move.dice_roll_id}
					<Popover>
						<PopoverTrigger>
							<Badge variant="secondary" class="cursor-pointer hover:bg-secondary/80">
								Кубик: {move.dice_roll}
							</Badge>
						</PopoverTrigger>
						<PopoverContent>
							<DiceRollInfo diceRollId={move.dice_roll_id} />
						</PopoverContent>
					</Popover>
				{:else}
					<Badge variant="secondary">
						Кубик: {move.dice_roll}
					</Badge>
				{/if}
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
				{#if move.difficulty_level !== 0}
					<Badge variant="secondary">
						{difficultyText[move.difficulty_level]}
					</Badge>
				{/if}
			</div>
		</div>
		<div
			class="absolute top-3 right-3 text-sm leading-[17px] font-semibold text-muted-foreground group-data-[current=true]:text-foreground"
		>
			{formatDateTime(move.created_at)}
		</div>
	</div>

	<div class="mt-3 flex gap-3">
		<ImageLoader
			src={move.cover_image_url || FALLBACK_GAME_POSTER}
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
			{:else}
				<div class="font-medium text-muted-foreground [&>*]:inline" in:fade>
					<span>{move.item_rating}/10 — </span>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html parsedReview}
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-3 flex justify-between" transition:slide>
		{#if vodLinks.trim().length > 0}
			<Toggle
				size="sm"
				class="mr-4 w-[105px]"
				bind:pressed={isVodsShown}
				style={isVodsShown
					? 'background-color: var(--primary); color: var(--primary-foreground);'
					: 'background-color: var(--secondary); color: var(--secondary-foreground);'}
			>
				Записи
			</Toggle>
		{/if}
		{#if canEdit}
			<Toggle
				size="sm"
				class="p-2"
				bind:pressed={getEditMode, setEditMode}
				style={isEditMode
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
		{#if matchedGames.length > 0}
			<div class="mt-3 flex w-full items-center justify-end gap-3" transition:slide>
				Также играли:
				<div>
					{#each matchedGames as game (game.id)}
						<PopoverGameCard {game} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
