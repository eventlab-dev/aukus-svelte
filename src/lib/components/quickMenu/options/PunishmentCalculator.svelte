<script lang="ts">
	import MathIcon from '$lib/components/icons/MathIcon.svelte'
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { myPlayer } = getAppManagerContext()

	const ranges = [
		{ max: 10000, shots: 1, pushups: 30, squats: 50 },
		{ max: 20000, shots: 2, pushups: 60, squats: 100 },
		{ max: 30000, shots: 3, pushups: 90, squats: 150 },
		{ max: 40000, shots: 4, pushups: 120, squats: 200 },
		{ max: 50000, shots: 5, pushups: 150, squats: 250 },
		{ max: 70000, shots: 6, pushups: 180, squats: 300 },
		{ max: 100000, shots: 7, pushups: 210, squats: 350 },
		{ max: 140000, shots: 8, pushups: 240, squats: 400 },
		{ max: 190000, shots: 9, pushups: 270, squats: 450 },
		{ max: 240000, shots: 10, pushups: 300, squats: 500 },
		{ max: 300000, shots: 11, pushups: 330, squats: 550 },
		{ max: 370000, shots: 12, pushups: 360, squats: 600 },
		{ max: 450000, shots: 13, pushups: 390, squats: 650 },
		{ max: 540000, shots: 14, pushups: 420, squats: 700 },
		{ max: 640000, shots: 15, pushups: 450, squats: 750 },
		{ max: 750000, shots: 16, pushups: 480, squats: 800 },
		{ max: 870000, shots: 17, pushups: 510, squats: 850 },
		{ max: 1000000, shots: 18, pushups: 540, squats: 900 }
	]
	const sharedInputStyles = 'border-none bg-muted font-bold h-[44px]'

	let auctionSum: string = $state('')
	let { shots, pushups, squats } = $derived.by(calculatePunishments)

	function setInputValue(val: string) {
		const numericValue = val.replace(/[^\d]/g, '')
		auctionSum = numericValue
	}

	function getInputValue() {
		return auctionSum ? Number(auctionSum).toLocaleString('ru-RU').concat(' ₽') : ''
	}

	function calculatePunishments() {
		const numericAuctionSum = Number(auctionSum)

		if (isNaN(numericAuctionSum) || numericAuctionSum < 1)
			return {
				shots: 0,
				pushups: 0,
				squats: 0
			}

		for (const range of ranges) {
			if (numericAuctionSum < range.max) {
				return {
					shots: range.shots,
					pushups: range.pushups,
					squats: range.squats
				}
			}
		}

		const last = ranges[ranges.length - 1]
		return {
			shots: last.shots,
			pushups: last.pushups,
			squats: last.squats
		}
	}

	function handleCursorMove(e: { currentTarget: HTMLInputElement }) {
		const t = e.currentTarget
		const val = t.value
		const cursorPos = val.length - (val.endsWith(' ₽') ? 2 : 0)
		t.setSelectionRange(cursorPos, cursorPos)
	}

	const lastDrop = $derived.by(() => {
		if (myPlayer?.last_move?.type === 'drop') {
			return myPlayer.last_move.item_title
		}
	})
</script>

{#snippet readonlyInput({ title, value }: { title: string; value: number })}
	<div>
		<Label for={title}>{title}</Label>
		<Input id={title} type="number" class={[sharedInputStyles, 'w-[148px]']} {value} readonly />
	</div>
{/snippet}

<Dialog>
	<DialogTrigger>
		<MathIcon /> Калькулятор наказаний
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle
				class="flex flex-col text-5xl leading-[58px]"
				aria-describedby="punishment calculator"
			>
				<span>Наказание за дроп</span>
				{#if myPlayer?.current_game && false}
					<span> — {myPlayer?.current_game}</span>
				{:else if lastDrop}
					<span> — {lastDrop}</span>
				{/if}
			</DialogTitle>
		</DialogHeader>

		<div class="space-y-5">
			<div>
				<Label for="auction-sum">Сумма аукциона</Label>
				<Input
					id="auction-sum"
					type="text"
					placeholder="Введите сумму аукциона"
					class={[sharedInputStyles]}
					oninput={handleCursorMove}
					bind:value={getInputValue, setInputValue}
				/>
			</div>
			<div class="flex items-end justify-between">
				{@render readonlyInput({ title: 'Шоты', value: shots })}
				<div class="mb-3 font-bold text-muted-foreground">или</div>
				{@render readonlyInput({ title: 'Отжимания', value: pushups })}
				<div class="mb-3 font-bold text-muted-foreground">или</div>
				{@render readonlyInput({ title: 'Приседания', value: squats })}
			</div>
			<div>
				<p class="text-sm font-semibold text-muted-foreground">
					Наказание расчитано персонально для вас исходя из данных полученеых с поинтаука.
				</p>
				<p class="text-sm font-semibold text-muted-foreground">
					Можно комбинировать с учетом что соотношение: 1 шот = 30 отжиманий или 50 приседаний.
				</p>
			</div>
		</div>
	</DialogContent>
</Dialog>
