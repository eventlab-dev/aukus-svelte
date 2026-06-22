<script lang="ts">
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte'
	import { Button } from '$lib/components/ui/button'
	import { formatDateTime } from '$lib/utils'
	import X from '@lucide/svelte/icons/x'
	import { fade, fly } from 'svelte/transition'
	import Move from './Move.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type Props = {
		close?: () => void
	}

	let { close }: Props = $props()

	const currentDay = new Date().getDate()
	const daysInMonth = Array(31)

	const app = getAppManager()
	const { playerMoves } = app.playersMovesStore

	let selectedDay = $state(currentDay)
	let currentPage = $state(0)
	let flyDirection = $state(1)

	const filteredMoves = $derived.by(() => {
		const today = new Date(new Date().toDateString())
		return playerMoves.filter(({ created_at }) => {
			return new Date(created_at).toDateString() === today.toDateString()
		})
	})

	const currentMove = $derived(filteredMoves[currentPage])
	const currentMoveTime = $derived(formatDateTime(currentMove.created_at, { onlyHourMinute: true }))

	function replayAllMoves() {
		console.log('replay all moves')
	}

	function onDayClick(day: number) {
		selectedDay = day
		currentPage = 0
	}

	function changePage(delta: number) {
		flyDirection = delta
		currentPage = (currentPage + delta + filteredMoves.length) % filteredMoves.length
	}
</script>

<div class="space-y-1.5" transition:fade={{ duration: 200 }}>
	<div
		class="flex h-auto w-full justify-between rounded-lg border-none bg-primary p-2.5 font-semibold text-primary-foreground select-none [&>svg]:size-[19px]"
	>
		<div class="flex gap-2.5">
			<CalendarIcon /> Таймлапс
		</div>
		<Button variant="ghost" class="h-fit rounded bg-white/20 !p-0" onclick={close}>
			<X class="size-4.5 stroke-3" />
		</Button>
	</div>

	<div class="space-y-3 rounded-lg bg-card p-2.5">
		<div class="font-bold">Выберите дату — {selectedDay}</div>
		<div class="grid w-[240px] grid-cols-5 gap-1.5">
			{#each daysInMonth, idx}
				{@const day = idx + 1}
				<Button
					class="h-7 w-full rounded-md bg-muted font-semibold data-[current=true]:outline data-[current=true]:outline-primary data-[current=true]:outline-solid data-[selected=true]:bg-primary"
					data-current={currentDay === day}
					data-selected={selectedDay === day}
					disabled={day > currentDay}
					onclick={() => onDayClick(day)}
				>
					{day}
				</Button>
			{/each}
		</div>
		<Button class="h-8 w-full text-sm font-bold" onclick={replayAllMoves}>
			Проиграть все ходы
		</Button>
	</div>

	{#if currentMove}
		<div class="space-y-3 overflow-hidden rounded-lg bg-card p-2.5">
			<div class="flex justify-between text-sm font-semibold text-muted-foreground">
				<div>Ход за день — {currentPage + 1}</div>
				<div>{currentMoveTime}</div>
			</div>

			<div class="grid">
				{#key currentPage}
					<div
						class="col-start-1 row-start-1 transition-all"
						in:fly={{ x: 200 * flyDirection }}
						out:fly={{ x: -200 * flyDirection }}
					>
						<Move move={currentMove} />
					</div>
				{/key}
			</div>

			<div class="flex gap-1.5">
				<Button
					variant="secondary"
					class="h-8 w-full shrink text-sm font-bold"
					disabled={currentPage === 0}
					onclick={() => changePage(-1)}
				>
					Назад
				</Button>
				<Button
					variant="secondary"
					class="h-8 w-full shrink text-sm font-bold"
					disabled={currentPage === filteredMoves.length - 1}
					onclick={() => changePage(1)}
				>
					Вперед
				</Button>
			</div>
		</div>
	{/if}
</div>
