<script lang="ts">
	import ImageLoader from '../ImageLoader.svelte'
	import fallbackPoster from '$lib/assets/images/GameFallbackPoster.png'
	import GameStatusSelector from './components/GameStatusSelector.svelte'
	import Rating from './components/Rating.svelte'
	import { Button } from '../ui/button'
	import BoxIcon from '../icons/BoxIcon.svelte'
	import TiptapEditor from '../richEditor/TiptapEditor.svelte'
	import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
	import { Editor } from '@tiptap/core'
	import GameTitle from './components/GameTitle.svelte'
	import EmotesPopover from './components/EmotesPopover.svelte'
	import type { EmoteItem } from '$lib/api/emotes'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import {
		Dialog,
		DialogClose,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '../ui/dialog'
	import X from '@lucide/svelte/icons/x'
	import WandIcon from '../icons/WandIcon.svelte'
	import type { GameDifficulty, GameLength, PlayerMoveType } from '$lib/heyapi/aukus/types.gen'
	import type { IgdbGameSummary } from '$lib/heyapi/eventlab/types.gen'
	import { LastMapPosition } from '$lib/constants'
	import { formatMs } from '$lib/utils'
	import DifficultySelector from './components/DifficultySelector.svelte'
	import FinalTimeSelector from './components/FinalTimeSelector.svelte'
	import type { Difficulty } from '$lib/types'

	type FormType = {
		title: string
		status?: PlayerMoveType
		finalTime?: GameLength
		rating: number | null
		review: string
		difficulty?: Difficulty
	}

	const { usersStore, eventDataStore, myPlayer, frontendState, eventActive, gameTimeStore } =
		getAppManagerContext()

	// const { saveMoveForm } = usersStore
	// const { eventDataQuery } = eventDataStore
	// const { hltbMatch, gameTitle: timeSearchTitle, categoryDuration, hltbLink } = gameTimeStore

	// $inspect('match', $hltbMatch)

	let form: FormType = $state({
		title: '',
		status: undefined,
		finalTime: undefined,
		rating: null,
		review: '',
		difficulty: undefined
	})

	let selectedGame: IgdbGameSummary | null = $state(null)
	let isDialogOpen = $state(false)
	let editorState: { editor: Editor | null } = $state({ editor: null })
	let isFinalTimeInvalid = $state(false)
	let bypassClickCount = $state(0)

	$effect(() => {
		if (selectedGame) {
			gameTimeStore.gameTitle = selectedGame.name
		} else if (form.title) {
			gameTimeStore.gameTitle = form.title
		}
	})

	const { isFormFilled, buttonText, hasHltbError } = $derived.by(() => {
		if (!form.title)
			return { isFormFilled: false, buttonText: 'Введи название игры', hasHltbError: false }
		if (!form.status)
			return { isFormFilled: false, buttonText: 'Выбери статус игры', hasHltbError: false }
		if (!form.review)
			return { isFormFilled: false, buttonText: 'Напиши отзыв', hasHltbError: false }
		if (form.status === 'reroll') {
			if (form.rating === null)
				return { isFormFilled: false, buttonText: 'Поставь оценку', hasHltbError: false }
			return { isFormFilled: true, buttonText: 'Рерольнуть игру', hasHltbError: false }
		}
		if (form.rating === null)
			return { isFormFilled: false, buttonText: 'Поставь оценку', hasHltbError: false }
		if (!form.difficulty)
			return { isFormFilled: false, buttonText: 'Выбери сложность', hasHltbError: false }
		if (form.status === 'drop' || form.status === 'sheikh_moment') {
			return { isFormFilled: true, buttonText: 'Дропнуть игру', hasHltbError: false }
		}
		if (form.status === 'movie') {
			return {
				isFormFilled: true,
				buttonText: 'Перейти к броску кубиков',
				hasHltbError: false
			}
		}
		if (!form.finalTime) {
			return {
				isFormFilled: false,
				buttonText: 'Выбери время',
				hasHltbError: false
			}
		}

		if (myPlayer?.map_position === LastMapPosition) {
			return {
				isFormFilled: true,
				buttonText: 'Победить в АУКУСЕ 4',
				hasHltbError: isFinalTimeInvalid
			}
		}
		return {
			isFormFilled: true,
			buttonText: 'Перейти к броску кубиков',
			hasHltbError: isFinalTimeInvalid
		}
	})

	async function saveReview() {
		let difficulty: GameDifficulty = 0
		switch (form.difficulty) {
			case 'easy':
				difficulty = -1
				break
			case 'normal':
				difficulty = 0
				break
			case 'hard':
				difficulty = 1
				break
			case 'very-hard':
				difficulty = 2
				break
			case undefined:
				difficulty = 0
				break
			default: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const _exhaustiveCheck: never = form.difficulty
				break
			}
		}

		await usersStore.saveMoveForm.mutateAsync({
			body: {
				type: form.status!,
				item_review: form.review,
				item_rating: form.rating,
				item_length: form.finalTime || null,
				item_title: form.title,
				game_id: selectedGame?.id || null,
				cover_image_url: selectedGame?.cover || fallbackPoster,
				difficulty
			}
		})

		frontendState.set('form-sent')

		isDialogOpen = false

		eventDataStore.eventDataQuery.refetch()

		setTimeout(() => {
			form = {
				title: '',
				status: undefined,
				finalTime: undefined,
				rating: null,
				review: '',
				difficulty: undefined
			}
			selectedGame = null
		}, 500)
	}

	function handleEmoteClick(emote: EmoteItem) {
		editorState.editor?.chain().focus().setImage({ src: emote.cdn_url }).run()
	}

	function toggleSpoiler() {
		editorState.editor?.chain().focus().toggleSpoilerMark().setTextSelection(0).run()
	}

	$effect(() => {
		if (!isDialogOpen) {
			bypassClickCount = 0
		}
	})

	$effect(() => {
		void form.title
		void form.status
		void form.finalTime
		void form.rating
		void form.review
		void form.difficulty
		void selectedGame
		bypassClickCount = 0
	})
</script>

<Dialog bind:open={isDialogOpen}>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} class="w-80" disabled={!eventActive}>Сделать ход</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent class="gap-3 overflow-hidden p-3 sm:max-w-[800px]" showCloseButton={false}>
		<DialogHeader>
			<DialogTitle aria-describedby="move form">
				Новый ход — {form.title || myPlayer?.current_game}
			</DialogTitle>
		</DialogHeader>

		<div class="flex gap-3">
			<ImageLoader
				src={selectedGame?.cover || fallbackPoster}
				alt="game poster"
				class="h-[176px] w-[132px]"
			/>
			<div class="flex w-full flex-col gap-3">
				<div class="flex gap-3">
					<GameTitle bind:value={form.title} bind:selectedGame />
				</div>

				<div class="flex gap-3">
					<GameStatusSelector gameDuration={gameTimeStore.categoryDuration} bind:value={form.status} />
					<DifficultySelector bind:value={form.difficulty} />
				</div>

				<div class="flex gap-3">
					<div class="flex w-fit flex-col gap-2 rounded-lg bg-secondary p-2">
						<div>Мое время</div>
						<div>
							{#if gameTimeStore.categoryDuration}
								{formatMs(gameTimeStore.categoryDuration * 1000, { noDays: true })}
							{:else}
								не найдено
							{/if}
						</div>
					</div>
					<div class="flex w-fit flex-col gap-2 rounded-lg bg-secondary p-2">
						<Button
							variant="link"
							class="h-fit p-0"
							target="_blank"
							rel="noopener noreferrer"
							href={gameTimeStore.hltbLink}
						>
							Время по HLTB
						</Button>
						<div>
							{#if gameTimeStore.hltbMatch?.comp_main}
								{formatMs(gameTimeStore.hltbMatch.comp_main * 1000, { noDays: true })}
							{:else}
								не найдено
							{/if}
						</div>
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<div>
							Итоговое время
							{#if gameTimeStore.categoryDuration && gameTimeStore.hltbMatch?.comp_main}
								(само)
							{:else}
								(выбери)
							{/if}
						</div>
						<FinalTimeSelector
							bind:value={form.finalTime}
							bind:isInvalid={isFinalTimeInvalid}
							gameDuration={gameTimeStore.categoryDuration}
							hltbTime={gameTimeStore.hltbMatch?.comp_main}
							disabled={form.status !== 'completed'}
						/>
					</div>
				</div>

				<div class="space-y-2.5">
					<div class="text-xl font-semibold">
						Оценка — {`${form.rating === null ? 'не указана' : form.rating}`}
					</div>
					<Rating bind:value={form.rating} />
				</div>

				<div class="relative">
					<TiptapEditor
						class="px-3 py-2"
						content={form.review}
						bind:editorState
						bind:value={form.review}
						extensions={{
							placeholderText: 'Отзыв'
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

				<div class="ml-auto w-[264px]">
					{#if hasHltbError && bypassClickCount < 5}
						<Tooltip>
							<TooltipTrigger>
								<Button
									class="w-full cursor-not-allowed opacity-50"
									onclick={(e) => {
										e.preventDefault()
										bypassClickCount++
									}}
								>
									<BoxIcon />
									{buttonText}
								</Button>
							</TooltipTrigger>
							<TooltipContent class="max-w-[400px]">
								Ваше время прохождения по категории стрима меньше выбранного диапозона HLTB,
								согласно разделу 2 пункту 5 правил если время прохождения стримером меньше HLTB, то
								нужно изменить выбранный диапозон HLTB на тот, который включает время, в котором
								прошёл стример. Если вы уверены, что прошли за время в выбранном диапазоне HLTB, то
								нажмите на кнопку ({5 - bypassClickCount} нажатий для обхода)
							</TooltipContent>
						</Tooltip>
					{:else}
						<Button
							class="w-full"
							disabled={!isFormFilled}
							onclick={saveReview}
							loading={usersStore.saveMoveForm.isPending}
						>
							<BoxIcon />
							{buttonText}
						</Button>
					{/if}
				</div>
			</div>
		</div>

		<DialogClose
			class="absolute top-3 right-3 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-5 stroke-4" />
		</DialogClose>
	</DialogContent>
</Dialog>
