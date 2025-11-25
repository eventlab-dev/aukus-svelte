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
	import { FALLBACK_GAME_POSTER, gameLengthRanges } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { formatDateTime, formatMs, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import PopoverGameCard from './PopoverGameCard.svelte'
	import DiceRollInfo from './DiceRollInfo.svelte'
	import Rating from '../moveForm/components/Rating.svelte'
	import TiptapEditor from '../richEditor/TiptapEditor.svelte'
	import EmotesPopover from '../moveForm/components/EmotesPopover.svelte'
	import type { EmoteItem } from '$lib/api/emotes'
	import type { Editor } from '@tiptap/core'
	import type { CommonGameItem } from '$lib/types'

	type Props = {
		move: PlayerMoveItem
		matchedGames: CommonGameItem[]
	}

	const { move, matchedGames }: Props = $props()

	const { playersBySlug, myPlayer, usersStore, playersMovesStore } = getAppManagerContext()
	const { myUser } = usersStore
	const { updatePlayerMove, movesQuery } = playersMovesStore

	const player = $derived($playersBySlug[move.player_slug])
	const canEdit = $derived.by(() => {
		if (move.player_slug === $myPlayer?.slug) {
			return true
		}
		if ($myUser?.moder_for?.includes(move.player_slug)) {
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

	let vodLinks = $state(move.vod_links || '')
	let review = $state(move.item_review || '')
	let rating = $state(move.item_rating)
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
		if (!pressed && isEditMode) {
			isSaving = true
			try {
				await $updatePlayerMove.mutateAsync({
					moveId: move.id,
					data: {
						item_review: review,
						item_rating: rating,
						vod_links: vodLinks || null
					}
				})

				move.item_review = review
				move.item_rating = rating
				move.vod_links = vodLinks

				await $movesQuery?.refetch()
			} catch (error) {
				console.error('Failed to save changes:', error)
				const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
				alert(`Ошибка при сохранении: ${errorMessage}`)
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

	const difficultyText: { [key: number]: string } = {
		'-1': 'На легком',
		1: 'На сложном',
		2: 'На очень сложном'
	}
</script>

<div
	class="bg-card group relative flex w-full flex-col rounded-xl p-3 md:w-[800px]"
	id={`move-card-${move.id}`}
>
	<div class="flex flex-col gap-2 md:flex-row md:justify-between">
		<div class="flex">
			<div class="flex flex-wrap gap-1.5">
				<Badge variant={moveTypeStyles.variant}>
					{moveTypeStyles.text}
				</Badge>
				{#if move.dice_roll_id}
					<Popover>
						<PopoverTrigger>
							<Badge
								variant="secondary"
								class="hover:bg-secondary/80 flex cursor-pointer items-center gap-1"
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
			class="text-muted-foreground group-data-[current=true]:text-foreground text-sm font-semibold leading-[17px] md:absolute md:right-3 md:top-3"
		>
			{formatDateTime(move.created_at)}
		</div>
	</div>

	<div class="mt-3 flex flex-col gap-3 md:flex-row">
		<ImageLoader
			src={move.cover_image_url || FALLBACK_GAME_POSTER}
			alt={move.item_title || ''}
			class="h-[100px] w-[75px] flex-shrink-0 md:h-[140px] md:w-[105px]"
		/>
		<div class="w-full min-w-0 space-y-3">
			<div class="text-lg font-bold leading-tight md:text-2xl md:leading-[29px]">
				{move.item_title}
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
						<div class="absolute bottom-1.5 right-1.5 flex flex-col">
							<Button variant="ghost" size="icon" onclick={toggleSpoiler}>
								<WandIcon class="size-6" />
							</Button>
							<EmotesPopover onEmoteClick={handleEmoteClick} />
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
				<div class="text-muted-foreground font-medium [&>*]:inline" in:fade>
					<span>{move.item_rating}/10 — </span>
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
				<span class="text-sm">Также играли:</span>
				<div class="flex flex-wrap gap-2">
					{#each matchedGames as game (game.id)}
						<PopoverGameCard {game} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
