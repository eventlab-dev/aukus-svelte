<script lang="ts">
	import MathIcon from '$lib/components/icons/MathIcon.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import PageContainer from '$lib/components/PageContainer.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { navStore } = app

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

		const last = ranges.at(-1)!
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
		if (app.myPlayer?.last_move?.type === 'drop') {
			return app.myPlayer.last_move.item_title
		}
	})
</script>

{#snippet readonlyInput({ title, value }: { title: string; value: number })}
	<div class="flex flex-col gap-2 text-center font-extrabold">
		<div class="uppercase">{title}</div>
		<div class="w-[148px] rounded-xl bg-secondary p-2">{value}</div>
	</div>
{/snippet}

<Button href="/calc">
	<MathIcon /> Калькулятор наказаний
</Button>

<PageContainer bottomSpace={false}>
	<div class="flex flex-col items-center pt-16">
		<div class="flex flex-col text-5xl leading-[58px] font-bold">
			<span>Наказание за дроп</span>
			{#if app.myPlayer?.current_game && false}
				<span> — {app.myPlayer?.current_game}</span>
			{:else if lastDrop}
				<span> — {lastDrop}</span>
			{/if}
		</div>

		<div class="mt-20 w-[640px] space-y-5">
			<div class="w-full">
				<div class="w-full p-2 text-center text-xl font-extrabold uppercase">Сумма аукциона</div>
				<Input
					type="text"
					class="rounded-none bg-transparent text-center text-xl font-extrabold outline-none border-dashed-bottom focus-visible:ring-0"
					oninput={handleCursorMove}
					bind:value={getInputValue, setInputValue}
				/>
			</div>
			<div class="flex items-end justify-between font-extrabold">
				{@render readonlyInput({ title: 'Шоты', value: shots })}
				<div class="mb-3 text-muted-foreground">ИЛИ</div>
				{@render readonlyInput({ title: 'Отжимания', value: pushups })}
				<div class="mb-3 text-muted-foreground">ИЛИ</div>
				{@render readonlyInput({ title: 'Приседания', value: squats })}
			</div>
			<div class="hidden">
				<p class="text-sm font-semibold text-muted-foreground">
					Наказание расчитано персонально для вас исходя из данных полученеых с поинтаука.
				</p>
				<p class="text-sm font-semibold text-muted-foreground">
					Можно комбинировать с учетом что соотношение: 1 шот = 30 отжиманий или 50 приседаний.
				</p>
			</div>
		</div>
	</div>
</PageContainer>
