<script lang="ts">
	import EditIcon from '$lib/components/icons/EditIcon.svelte'
	import TickCircleIcon from '$lib/components/icons/TickCircleIcon.svelte'
	import InfoIcon from '$lib/components/icons/InfoIcon.svelte'
	import WandIcon from '$lib/components/icons/WandIcon.svelte'
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Badge } from '$lib/components/ui/badge'
	import { Button } from '$lib/components/ui/button'
	import { Textarea } from '$lib/components/ui/textarea'
	import { Toggle } from '$lib/components/ui/toggle'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { EventTitles, FALLBACK_GAME_POSTER, gameLengthRanges, MOVIE_POSTER_URL } from '$lib/constants'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { formatDateTime, formatDateTimeISO, formatMs, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import PopoverGameCard from './PopoverGameCard.svelte'
	import DiceRollInfo from './DiceRollInfo.svelte'
	import Rating from '../moveForm/components/Rating.svelte'
	import TiptapEditor from '../richEditor/TiptapEditor.svelte'
	import EmotesPopover from '../moveForm/components/EmotesPopover.svelte'
	import type { EmoteItem } from '$lib/api/emotes'
	import type { Editor } from '@tiptap/core'
	import type { CommonGameItem } from '$lib/types'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type Props = {
		game: CommonGameItem
		move?: PlayerMoveItem
		matchedGames: CommonGameItem[]
		showPlayer?: boolean
		showEvent?: boolean
	}

	let { move, matchedGames, game, showPlayer = false, showEvent = false }: Props = $props()

	const app = getAppManager()
	const { usersStore, playersMovesStore, playersBySlug } = app

	const canEdit = $derived.by(() => {
		if (!move) {
			return false
		}
		if (move.player_slug === app.myPlayer?.slug) {
			return true
		}
		if (usersStore.myUser?.moder_for?.includes(move.player_slug)) {
			return true
		}
		if (usersStore.myUser?.roles.includes('admin')) {
			return true
		}
		return false
	})

	const durationText = $derived.by(() => {
		const duration = move?.item_duration ?? game.game_time
		if (!duration) {
			return ''
		}
		const formatted = formatMs(duration * 1000)
		return `Играл ${formatted}`
	})

	const moveTypeStyles = $derived(getMoveTypeStyles(move?.type ?? game.completion_status))
	const parsedReview = $derived(renderToHTML(move?.item_review ?? game.review ?? ''))

	let vodLinks = $state(move?.vod_links || '')
	let review = $state(move?.item_review ?? game.review ?? '')
	let rating = $state(move?.item_rating ?? game.rating_num)
	let isEditMode = $state(false)
	let isVodsShown = $state(false)
	let isSaving = $state(false)
	let editorState: { editor: Editor | null } = $state({ editor: null })

	function handleEmoteClick(emote: EmoteItem) {
		editorState.editor?.chain().focus().setImage({ src: emote.cdn_url }).run()
	}

	function toggleSpoiler() {
		editorState.editor?.chain().focus().toggleSpoilerMark().setTextSelection(0).run()
	}

	async function setEditMode(pressed: boolean) {
		if (!pressed && isEditMode && move) {
			isSaving = true
			try {
				await playersMovesStore.updatePlayerMove.mutateAsync({
					moveId: move.id,
					data: {
						item_review: review,
						item_rating: rating ?? 0,
						vod_links: vodLinks || null
					}
				})
			} catch (error) {
				console.error('Failed to save changes:', error)
				const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
				alert(`Ошибка при сохранении: ${errorMessage}`)

				review = move.item_review || ''
				rating = move.item_rating
				vodLinks = move.vod_links || ''
				return
			} finally {
				isSaving = false
			}
		}

		isEditMode = pressed
	}

	function getEditMode() {
		return isEditMode
	}

	const difficultyText = $derived.by(() => {
		if (move) {
			switch (move.difficulty_level) {
				case -1:
					return 'На легком'
				case 1:
					return 'На сложном'
				case 2:
					return 'На очень сложном'
				default:
					return ''
			}
		}
		if (game) {
			switch (game.difficulty) {
				case 'normal':
					return 'На сложном'
				case 'hard':
					return 'На очень сложном'
				default:
					return ''
			}
		}
		return ''
	})

	const posterUrl = $derived.by(() => {
		if (move?.type === 'movie') {
			return MOVIE_POSTER_URL
		}
		return move?.cover_image_url ?? game.game_cover ?? FALLBACK_GAME_POSTER
	})

	const title = $derived(move?.item_title ?? game.game_title)
	const showRating = $derived(move || game.rating)

	const player = $derived(playersBySlug.get(game.player_nickname))
</script>

<div
	class="group relative flex w-full flex-col rounded-2xl bg-card p-3"
	id={`game-card-${game.key}`}
>
	<div class="flex flex-col gap-2 md:flex-row md:justify-between">
		<div class="flex">
			<div class="flex flex-wrap gap-1.5 max-w-[620px]">
			    {#if showEvent}
					<Badge variant="blue">{EventTitles[game.event_name]}</Badge>
				{/if}

				{#if showPlayer && player}
					<Badge style="background-color: {player.color};">{player.username}</Badge>
				{/if}

				<Badge variant={moveTypeStyles.variant} class="uppercase">
					{moveTypeStyles.text}
				</Badge>
				{#if move}
					{#if move.dice_roll_id}
						<Popover>
							<PopoverTrigger>
								<Badge
									variant="blue"
									class="flex cursor-pointer items-center gap-1 hover:bg-secondary/80"
								>
									Кубик: {move.dice_roll}
									<InfoIcon class="h-3 w-3" />
								</Badge>
							</PopoverTrigger>
							<PopoverContent>
								<DiceRollInfo diceRollId={move.dice_roll_id} />
							</PopoverContent>
						</Popover>
					{:else}
						<Badge variant="blue">
							Кубик: {move.dice_roll}
						</Badge>
					{/if}
					<Badge variant="blue">
						Ход {move.cell_from}
						->
						{move.cell_to}
					</Badge>
				{/if}
				{#if durationText}
					<Tooltip>
						<TooltipTrigger>
							<Badge variant="blue" class="h-full">
								{durationText}
							</Badge>
						</TooltipTrigger>
						<TooltipContent>Примерное время по категории стрима</TooltipContent>
					</Tooltip>
				{/if}
				{#if move?.item_length}
					<Badge variant="blue">
						{gameLengthRanges[move.item_length]} HLTB
					</Badge>
				{/if}
				{#if difficultyText}
					<Badge variant="blue">
						{difficultyText}
					</Badge>
				{/if}
			</div>
		</div>
		<div
			class="text-sm leading-[17px] font-extrabold uppercase text-muted-foreground group-data-[current=true]:text-foreground md:absolute md:top-3 md:right-3"
		>
			{#if move}
				{formatDateTime(move.created_at)}
			{:else if game.game_time}
				{formatDateTimeISO(game.date)}
			{/if}
		</div>
	</div>

	<div class="mt-3 flex flex-col gap-3 md:flex-row">
		<ImageLoader
			src={posterUrl}
			alt={title}
			class="h-[100px] w-[75px] flex-shrink-0 md:h-[140px] md:w-[105px]"
		/>
		<div class="w-full min-w-0 space-y-3">
			<div class="text-lg leading-tight font-extrabold md:text-2xl md:leading-[29px]">
				{title}
			</div>

			{#if isEditMode}
				<div class="space-y-3" in:fade>
					<div class="space-y-2.5">
						<div class="text-xl font-semibold">
							Оценка — {`${rating === null ? 'не указана' : rating}`}
						</div>
						<Rating bind:value={rating} />
					</div>

					<div class="relative">
						<TiptapEditor
							class="px-3 py-2"
							content={review}
							bind:editorState
							bind:value={review}
							extensions={{
								placeholderText: 'Отзыв об игре'
							}}
							simple
						/>
						<div class="absolute right-1.5 bottom-1.5 flex flex-col">
							<Tooltip>
								<TooltipTrigger>
									<Button variant="ghost" size="icon" onclick={toggleSpoiler}>
										<WandIcon class="size-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Спойлер</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<EmotesPopover onEmoteClick={handleEmoteClick} />
								</TooltipTrigger>
								<TooltipContent>Смайлы</TooltipContent>
							</Tooltip>
						</div>
					</div>

					<div>
						<div class="mb-2 font-medium">Ссылки на записи</div>
						<Textarea id="vod-links" class="w-full resize-none" bind:value={vodLinks} rows={3} />
					</div>
				</div>
			{:else if isVodsShown}
				<div class="mt-5 space-y-3" in:fade>
					<div class="font-medium">Ссылки на записи</div>
					<Textarea id="vod-links" class="w-full resize-none" readonly={true} value={vodLinks} />
				</div>
			{:else}
				<div class="font-bold text-muted-foreground [&>*]:inline" in:fade>
					{#if showRating}
						<span>{rating}/10 — </span>
					{/if}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html parsedReview}
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-3 flex flex-wrap justify-between gap-2" transition:slide>
		{#if vodLinks.trim().length > 0}
			<Toggle
				size="sm"
				class="min-w-[80px] md:w-[105px]"
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
				disabled={isSaving}
				style={isEditMode
					? 'background-color: var(--primary); color: var(--primary-foreground);'
					: ''}
			>
				{#if isSaving}
					Сохранение...
				{:else if isEditMode}
					<TickCircleIcon />
					Сохранить
				{:else}
					<EditIcon />
					Изменить
				{/if}
			</Toggle>
		{/if}
		{#if matchedGames.length > 0}
			<div class="mt-3 flex w-full flex-wrap items-center justify-end gap-3" transition:slide>
				<span class="text-sm font-bold">Также играли:</span>
				<div class="flex flex-wrap gap-2">
					{#each matchedGames as game (game.key)}
						<PopoverGameCard {game} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
