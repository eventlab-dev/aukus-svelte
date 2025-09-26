<script lang="ts">
	import type { PlayerMove } from '$lib/api/aukus/types'
	import AddSquareIcon from '$lib/components/icons/AddSquareIcon.svelte'
	import EditIcon from '$lib/components/icons/EditIcon.svelte'
	import MinusSquareIcon from '$lib/components/icons/MinusSquareIcon.svelte'
	import TickCircleIcon from '$lib/components/icons/TickCircleIcon.svelte'
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Badge } from '$lib/components/ui/badge'
	import Input from '$lib/components/ui/input/input.svelte'
	import { Textarea } from '$lib/components/ui/textarea'
	import { Toggle } from '$lib/components/ui/toggle'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { formatDateTime, formatMs, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import { gameLengthRanges } from '$lib/constants'
	import PopoverMoveCard from './PopoverMoveCard.svelte'
	import { getPlayerColor } from '$lib/types'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	type Props = {
		move: Partial<PlayerMove>
		isCurrentMove?: boolean
		withUsername?: boolean
	}

	const { move, isCurrentMove = false, withUsername = false }: Props = $props()

	const { playersStore, playersMovesStore } = getAppManagerContext()
	const { moves } = playersMovesStore

	const player = $derived.by(() => (move.player_id ? playersStore.getPlayer(move.player_id) : null))
	const isPlayersMove = true // $derived(myUser && myUser.slug === move.player_slug)
	const isValidModerator = true // $derived(usersStore.isModerator && myUser?.moder_for === move.player_id)
	const canEdit = $derived(isPlayersMove || isValidModerator)

	const categoryDuration = $derived(
		formatMs(parseInt((move.stream_title_category_duration || 0).toString()) * 1000)
	)
	const playedBy = $derived.by(getPlayedBy)
	const moveTypeStyles = $derived.by(() => getMoveTypeStyles(move.type))
	const parsedReview = $derived.by(() => renderToHTML(move.item_review || ''))

	let gameTitle = $state(move.item_title)
	let vodLinks = $state(move.vod_link || '')
	let isExtended = $state(false)
	let isEditMode = $state(false)
	let isVodsShown = $state(false)

	function getPlayedBy() {
		return moves.filter((m) => {
			const isMyMove = m.player_id === move.player_id
			const isSameItem = m.item_title === move.item_title

			return !isMyMove && isSameItem
		})
	}

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
>
	<div class="flex justify-between">
		<div class="flex">
			<div class="flex gap-1.5">
				{#if withUsername && player}
					<Badge variant="secondary" style="background-color: {getPlayerColor(player.url_handle)}">
						{player.name}
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
				{/if}
			</div>

			{#if isExtended}
				<div class="ml-1.5 flex gap-1.5" transition:slide={{ axis: 'x' }}>
					<Tooltip>
						<TooltipTrigger>
							<Badge variant="secondary">
								За {categoryDuration}
							</Badge>
						</TooltipTrigger>
						<TooltipContent>Примерное время по категории стрима</TooltipContent>
					</Tooltip>
					{#if move.item_length}
						<Badge variant="secondary">
							{gameLengthRanges[move.item_length]} HLTB
						</Badge>
					{/if}
				</div>
			{/if}

			{#if !isCurrentMove}
				<Toggle class="ml-1.5" variant="outline" size="sm" bind:pressed={isExtended}>
					{#if isExtended}
						<MinusSquareIcon />
						Свернуть
					{:else}
						<AddSquareIcon />
						Подробнее
					{/if}
				</Toggle>
			{/if}

			{#if !isExtended && canEdit}
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
			{formatDateTime(move.created_at || '')}
		</div>
	</div>

	<div class="mt-3 flex gap-3">
		<ImageLoader
			src={move.item_image || ''}
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

	{#if isExtended}
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
				{#each playedBy as move (move.id)}
					<PopoverMoveCard {move} />
				{/each}
			</div>
		</div>
	{/if}
</div>
