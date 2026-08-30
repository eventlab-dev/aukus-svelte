<script lang="ts">
	import { Button } from '../ui/button'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'
	import { laddersByCell, snakesByCell } from '$lib/mapUtils'
	import type { PlayerData } from '$lib/types'
	import { normalizeSteps, calculateDiceProbability, type DiceProbability, sleep } from '$lib/utils'
	import PlayerModel from '../map/PlayerModel.svelte'
	import ImageLoader from '../ImageLoader.svelte'
	import { FALLBACK_GAME_POSTER } from '$lib/constants'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { untrack } from 'svelte'
	import FireIcon from '../icons/new/FireIcon.svelte'
	import ShieldIcon from '../icons/new/ShieldIcon.svelte'
	import StarIcon from '../icons/new/StarIcon.svelte'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'
	import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
	import ArrowRightIcon from '../icons/ArrowRightIcon.svelte'

	type DiceOptionOrDrop = DiceOption | 'drop'

	type Option = {
		label: string
		value: DiceOptionOrDrop
		tooltip?: string
	}

	type Props = {
		player: PlayerData
		canRollDice: boolean
		diceOptions: DiceOptionOrDrop[]
	}

	const { player, canRollDice, diceOptions }: Props = $props()

	const app = getAppManager()

	const { playerStore, eventDataStore, movementStore, notificationStore, statsStore } = app

	const activeDiceOptions: Option[] = $derived.by(() => {
		const allOptions: Option[] = [
			{ label: 'Дроп', value: 'drop' },
			{ label: '1d2', value: '1d2', tooltip: 'Игры 0-4ч' },
			{ label: '1d4', value: '1d4', tooltip: 'Игры 5-10ч' },
			{ label: '2d4', value: '2d4', tooltip: 'Игры 11-16ч' },
			{ label: '1d6', value: '1d6', tooltip: 'Игры 11+ч' },
			{ label: '2d6', value: '2d6', tooltip: 'Игры 17-24ч' },
			{ label: '3d6', value: '3d6', tooltip: 'Игры 25-40ч' },
			{ label: '4d6', value: '4d6', tooltip: 'Игры 40+ч' }
		]
		return allOptions.filter((option) => diceOptions.includes(option.value))
	})

	const defaultOption = $derived(activeDiceOptions.at(-1)!.value)

	let selectedDiceOption = $state<DiceOption | 'drop'>(untrack(() => defaultOption))

	$effect(() => {
		void player
		selectedDiceOption = defaultOption
	})

	const moveDirection = $derived(selectedDiceOption === 'drop' ? -1 : 1)

	async function handleThrowDice() {
		let dice = selectedDiceOption!
		if (dice === 'drop') {
			dice = player.map_position >= 81 ? '2d6' : '1d6'
		}

		const myPlayerBeforeRoll = app.myPlayer!

		const rollResult = await playerStore.rollDice.mutateAsync({
			body: {
				dice,
				used: true,
				test_values: 'diceRoll' in window ? (window.diceRoll as number[]) : []
			}
		})
		const moveParams = await playerStore.finishMove.mutateAsync({
			body: {
				dice_roll_id: rollResult.id
			}
		})

		const steps = moveParams.move_to - player.map_position
		await movementStore.doRollAnimation(rollResult.roll_values, steps)
		await movementStore.moveToCell({
			player: myPlayerBeforeRoll,
			steps: steps,
			moveResponse: moveParams,
			updatePlayerPosition: true
		})
		if (moveParams.unlocked_achievements.length > 0) {
			await sleep(500)
			notificationStore.notifyAchievements(moveParams.unlocked_achievements)
		}
		await eventDataStore.eventDataQuery.refetch()
		await statsStore.statsQuery.refetch()
		app.frontendState = null
	}

	const { ladderChance, snakeChance, maxRoll, minRoll, ladders, snakes } = $derived.by(() => {
		let maxRoll = 0
		let minRoll = 1
		let probabilities: DiceProbability | null = null
		switch (selectedDiceOption) {
			case '1d6':
				maxRoll = 6
				minRoll = 1
				probabilities = calculateDiceProbability(1, 6)
				break
			case '2d6':
				maxRoll = 12
				minRoll = 2
				probabilities = calculateDiceProbability(2, 6)
				break
			case '3d6':
				maxRoll = 18
				minRoll = 3
				probabilities = calculateDiceProbability(3, 6)
				break
			case '4d6':
				maxRoll = 24
				minRoll = 4
				probabilities = calculateDiceProbability(4, 6)
				break
			case '1d4':
				maxRoll = 4
				minRoll = 1
				probabilities = calculateDiceProbability(1, 4)
				break
			case '2d4':
				maxRoll = 8
				minRoll = 2
				probabilities = calculateDiceProbability(2, 4)
				break
			case '3d4':
				maxRoll = 12
				minRoll = 3
				probabilities = calculateDiceProbability(3, 4)
				break
			case '1d2':
				maxRoll = 2
				minRoll = 1
				probabilities = calculateDiceProbability(1, 2)
				break
			case 'drop': {
				if (player.map_position >= 81) {
					maxRoll = -12
					minRoll = -2
					probabilities = calculateDiceProbability(2, 6)
				} else {
					maxRoll = -6
					minRoll = -1
					probabilities = calculateDiceProbability(1, 6)
				}
				break
			}
			case null:
				maxRoll = 0
				minRoll = 0
				break
			default: {
				const error: never = selectedDiceOption
				throw new Error(`Unsupported dice option: ${error}`)
			}
		}

		// slow down on going through 81 cell
		if (player.map_position < 81 && player.map_position + maxRoll > 81) {
			const diff = 81 - player.map_position
			const remaining = Math.floor((maxRoll - diff) / 2)
			maxRoll = diff + remaining
		}

		const ladders = []
		const snakes = []
		const absMaxRoll = Math.abs(maxRoll)
		for (let i = Math.abs(minRoll); i <= absMaxRoll; i++) {
			const cellId = player.map_position + i * moveDirection
			if (laddersByCell[cellId]) {
				ladders.push(cellId)
			}
			if (snakesByCell[cellId]) {
				snakes.push(cellId)
			}
		}

		// console.log('prob', probabilities)

		const ladderChance =
			100 *
			ladders.reduce((acc, v) => {
				const diff = Math.abs(v - player.map_position)
				if (probabilities?.[diff]) {
					return acc + probabilities[diff]
				}
				return acc
			}, 0)

		const snakeChance =
			100 *
			snakes.reduce((acc, v) => {
				const diff = Math.abs(v - player.map_position)
				if (probabilities?.[diff]) {
					return acc + probabilities[diff]
				}
				return acc
			}, 0)

		return {
			ladderChance,
			snakeChance,
			maxRoll,
			minRoll,
			snakes,
			ladders
		}
	})

	$effect(() => {
		movementStore.myMovementState = {
			rollValues: [],
			startCell: player.map_position,
			steps: normalizeSteps(player.map_position, maxRoll),
			minSteps: minRoll
		}
		// movementState.set({
		// 	direction: 'forward',
		// 	rollValues: [3, 5],
		// 	state: 'dice-results',
		// 	steps: 3,
		// 	startCell: 5
		// })
	})

	function dropDiceText() {
		if (player.map_position >= 81) {
			return '2d6'
		}
		return '1d6'
	}

	const { streamLink, streamText } = $derived.by(() => {
		switch (player.main_platform) {
			case 'twitch':
				return { streamLink: player.twitch_stream_link, streamText: 'Стримит на Twitch' }
			case 'vkvideo':
				return { streamLink: player.vk_stream_link, streamText: 'Стримит на VK' }
			case 'kick':
				return { streamLink: player.kick_stream_link, streamText: 'Стримит на Kick' }
			default:
				return { streamLink: '', streamText: '' }
		}
	})
</script>

{#if canRollDice}
	<div class="flex w-[440px] flex-col gap-3 rounded-3xl border-dashed bg-card p-3">
		<div class="flex gap-3">
			<div class="flex-1 rounded-2xl text-center font-extrabold">
				<p class="mb-1.5">Шанс лестницы</p>
				<p class="text-[32px]">
					{ladderChance.toFixed(1)}%
				</p>
			</div>
			<div class="flex-1 rounded-2xl text-center font-extrabold">
				<p class="mb-1.5">Шанс змейки</p>
				<p class="text-[32px]">
					{snakeChance.toFixed(1)}%
				</p>
			</div>
		</div>
		<Tabs bind:value={selectedDiceOption}>
			<TabsList class="w-full flex-wrap justify-center gap-2">
				{#each activeDiceOptions as option (option.value)}
					<TabsTrigger value={option.value}>{option.label}</TabsTrigger>
				{/each}
			</TabsList>
		</Tabs>
		<Button
			class="w-full rounded-2xl bg-secondary font-extrabold"
			onclick={handleThrowDice}
			loading={playerStore.rollDice.isPending || playerStore.finishMove.isPending}
		>
			Бросить кубики — {selectedDiceOption === 'drop' ? dropDiceText() : selectedDiceOption}
		</Button>
	</div>
{:else}
	<div class="flex">
		<div class="flex w-[360px] flex-col gap-3 rounded-[32px] border-dashed bg-card p-3">
			<div class="flex justify-between">
				<div class="flex items-center gap-2">
					<PlayerAvatar
						name={player.username}
						src={player.avatar_link}
						size="small"
						isOnline={player.is_online}
					/>
					<Button variant="link" class="h-4 p-0" href={`/${player.slug}`}>
						<div class="text-xl font-extrabold text-foreground">{player.username}</div>
					</Button>
				</div>
				<div class="flex items-center gap-2 font-extrabold">
					<div class="flex items-center gap-[2px]">
						{player.shield_stacks}
						<ShieldIcon class="size-4" />
					</div>
					<div class="flex items-center gap-[2px]">
						{player.shit_stacks}
						<FireIcon class="size-4" />
					</div>
					<div class="flex items-center gap-[2px]">
						{player.total_score}
						<StarIcon class="size-4" />
					</div>
				</div>
			</div>
			<div class="flex items-center justify-between text-sm font-extrabold text-muted-foreground">
				{#if player.is_online}
					<div>{streamText}</div>
				{:else}
					<div>Оффлайн</div>
				{/if}
				{#if player.is_online && streamLink}
					<a
						href={streamLink}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1"
					>
						Смотреть
						<ArrowRightIcon />
					</a>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if player.current_game}
					<ImageLoader
						class="h-[90px]"
						alt="poster"
						src={player.current_game_cover ?? FALLBACK_GAME_POSTER}
					/>
				{/if}
				<div class="text-xl font-extrabold">{player.current_game ?? 'Выбирает игру...'}</div>
			</div>
		</div>
		<div class="flex items-center rounded-[32px] border-dashed bg-card">
			<PlayerModel {player} variant="big" />
		</div>
		<div
			class="flex w-[360px] flex-col justify-center gap-3 rounded-[32px] border-dashed bg-card p-3 font-bold"
		>
			<div class="flex justify-center gap-2">
				<div class="w-fit flex-1 text-center">
					<p class="mb-1.5 text-sm font-extrabold">Шанс лестницы</p>
					<p class="text-2xl font-bold">
						{ladderChance.toFixed(1)}%
					</p>
				</div>
				<div class="w-fit flex-1 text-center">
					<p class="mb-1.5 text-sm font-extrabold">Шанс змейки</p>
					<p class="text-2xl font-bold">
						{snakeChance.toFixed(1)}%
					</p>
				</div>
			</div>
			<Tabs bind:value={selectedDiceOption}>
				<TabsList class="w-full flex-wrap justify-center gap-2">
					{#each activeDiceOptions as option (option.value)}
						<TabsTrigger value={option.value}>{option.label}</TabsTrigger>
					{/each}
				</TabsList>
			</Tabs>
		</div>
	</div>
{/if}
