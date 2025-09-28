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

	const equippedSkins = $derived.by(() => {
		if (!$myPlayer) {
			return []
		}
		return $myPlayer.equipped_skins.map((id) => $skinsById.get(id)).filter((s) => s !== undefined)
	})

	let filter = $state<SkinSlot | null>(null)

	function selectPart(part: SkinSlot) {
		if (filter === part) {
			filter = null
		} else {
			filter = part
		}
	}

	const availableSkins = $derived.by(() => {
		if (!$myPlayer) {
			return []
		}
		const achievementsIds = new Set($myPlayer.unlocked_achievements.map((a) => a.id))
		const unlocked = $achievements.filter((a) => achievementsIds.has(a.id))
		const available = unlocked
			.map((a) => $skinsById.get(a.reward_skin_id))
			.filter((s) => s !== undefined)
		if (filter) {
			return available.filter((s) => s.slot === filter)
		}
		return available
	})
</script>

<Dialog>
	<DialogTrigger><GrammerlyIcon /> Кастомизация</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Кастомизация персонажа</DialogTitle>
		</DialogHeader>
		<div class="flex w-full justify-center">
			<div class="relative">
				<img src={PlayerBaseModelUrl} alt="Base Model" class="h-[150px]" />
				{#each equippedSkins as skin (skin.id)}
					{#if skin.slot === 'head'}
						<img
							src={skin.image_url}
							alt="Head Skin"
							class="absolute top-[6px] left-1/2 h-[50px] -translate-x-1/2"
						/>
					{:else if skin.slot === 'body'}
						<img
							src={skin.image_url}
							alt="Body Skin"
							class="absolute top-[43px] left-1/2 h-[70px] -translate-x-1/2"
						/>
					{:else if skin.slot === 'side'}
						<img
							src={skin.image_url}
							alt="Side Skin"
							class="absolute top-0 left-1/2 h-[150px] -translate-x-1/2"
						/>
					{/if}
				{/each}
			</div>
		</div>
		<div class="flex w-full justify-center gap-5">
			<Toggle
				class="cursor-pointer"
				pressed={filter === 'head'}
				onPressedChange={() => selectPart('head')}
			>
				Голова
				{#if filter === 'head'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
			<Toggle
				class="cursor-pointer"
				pressed={filter === 'body'}
				onPressedChange={() => selectPart('body')}
			>
				Тело
				{#if filter === 'body'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
			<Toggle
				class="cursor-pointer"
				pressed={filter === 'side'}
				onPressedChange={() => selectPart('side')}
			>
				Аксессуар
				{#if filter === 'side'}
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
