<script lang="ts">
	import { PlayerBaseModelUrl } from '$lib/constants'
	import type { SkinSlot } from '$lib/heyapi/aukus/types.gen'
	import X from '@lucide/svelte/icons/x'
	import GrammerlyIcon from '../icons/GrammerlyIcon.svelte'
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
	import Toggle from '../ui/toggle/toggle.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'

	const { eventDataStore, myPlayer } = getAppManagerContext()
	const { achievements, skinsById } = eventDataStore

	const availableSkins = $derived.by(() => {
		if (!$myPlayer) {
			return []
		}
		const achievementsIds = new Set($myPlayer.unlocked_achievements.map((a) => a.id))
		const unlocked = $achievements.filter((a) => achievementsIds.has(a.id))
		return unlocked.map((a) => $skinsById.get(a.reward_skin_id)).filter((s) => s !== undefined)
	})

	let selected = $state<SkinSlot | null>(null)

	function selectPart(part: SkinSlot) {
		if (selected === part) {
			selected = null
		} else {
			selected = part
		}
	}
</script>

<Dialog>
	<DialogTrigger><GrammerlyIcon /> Кастомизация</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Кастомизация персонажа</DialogTitle>
		</DialogHeader>
		<div class="flex w-full justify-center">
			<img src={PlayerBaseModelUrl} alt="Base Model" class="h-[150px]" />
		</div>
		<div class="flex w-full justify-center gap-5">
			<Toggle
				class="cursor-pointer"
				pressed={selected === 'head'}
				onPressedChange={() => selectPart('head')}
			>
				Голова
				{#if selected === 'head'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
			<Toggle
				class="cursor-pointer"
				pressed={selected === 'body'}
				onPressedChange={() => selectPart('body')}
			>
				Тело
				{#if selected === 'body'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
			<Toggle
				class="cursor-pointer"
				pressed={selected === 'side'}
				onPressedChange={() => selectPart('side')}
			>
				Аксессуар
				{#if selected === 'side'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
		</div>
		<ScrollArea class="h-[50vh] w-[700px] px-3" type="always">
			<div class="flex gap-4">
				{#each availableSkins as skin (skin.id)}
					<div
						class="flex h-[90px] w-[150px] cursor-pointer justify-center rounded-xl p-2 {$myPlayer?.equipped_skins.includes(
							skin.id
						)
							? 'bg-primary'
							: 'bg-secondary'}"
					>
						<img src={skin.image_url} alt="skin" class="h-full object-contain" />
					</div>
				{/each}
			</div>
		</ScrollArea>
	</DialogContent>
</Dialog>
