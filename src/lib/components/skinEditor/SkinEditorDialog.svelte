<script lang="ts">
	import { PlayerBaseModelUrl } from '$lib/constants'
	import type { SkinItem, SkinSlot } from '$lib/heyapi/aukus/types.gen'
	import X from '@lucide/svelte/icons/x'
	import GrammerlyIcon from '../icons/GrammerlyIcon.svelte'
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
	import Toggle from '../ui/toggle/toggle.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import { get } from 'svelte/store'
	import Button from '../ui/button/button.svelte'

	const { eventDataStore, myPlayer, usersStore } = getAppManagerContext()
	const { skinsById, eventDataQuery } = eventDataStore
	const { setSkins } = usersStore

	let selectedSkins = $state<{ [k in SkinSlot]: number | null }>({
		head: null,
		body: null,
		side: null
	})

	function selectSkin(skin: SkinItem) {
		if (selectedSkins[skin.slot] === skin.id) {
			selectedSkins[skin.slot] = null
		} else {
			selectedSkins[skin.slot] = skin.id
		}
	}

	const selectedSkinIds = $derived.by(() => {
		return Object.values(selectedSkins)
			.filter((id): id is number => id !== null)
			.sort()
	})

	const selectedSkinItems = $derived.by(() => {
		return Object.values(selectedSkins)
			.map((id) => (id ? $skinsById.get(id) : undefined))
			.filter((s) => s !== undefined)
	})

	const equippedSkins = $derived.by(() => {
		if (!$myPlayer) {
			return []
		}
		return $myPlayer.equipped_skins.map((id) => $skinsById.get(id)).filter((s) => s !== undefined)
	})

	let filter = $state<SkinSlot | null>(null)

	function selectFilter(part: SkinSlot) {
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
		const available = $myPlayer.available_skins
			.map((id) => $skinsById.get(id))
			.filter((s) => s !== undefined)
			.sort((a, b) => a.id - b.id)
		if (filter) {
			return available.filter((s) => s.slot === filter)
		}
		return available
	})

	async function handleOpenChange(open: boolean) {
		if (open) {
			for (const skin of equippedSkins) {
				selectedSkins[skin.slot] = skin.id
			}
		} else {
			// Save equipped skins when dialog is closed
			// if they have changed
			const equippedSkinsIds = equippedSkins.map((s) => s.id).sort()
			if (
				equippedSkinsIds.length === selectedSkinIds.length &&
				equippedSkinsIds.every((value, index) => value === selectedSkinIds[index])
			) {
				return
			}
			await get(setSkins).mutateAsync({ body: { skin_ids: selectedSkinIds } })
			await get(eventDataQuery).refetch()
		}
	}
</script>

<Dialog onOpenChange={handleOpenChange}>
	<DialogTrigger><GrammerlyIcon /> Кастомизация</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Кастомизация персонажа</DialogTitle>
		</DialogHeader>
		<div class="flex w-full justify-center">
			<div class="relative">
				<img src={PlayerBaseModelUrl} alt="Base Model" class="h-[150px]" />
				{#each selectedSkinItems as skin (skin.id)}
					{#if skin.slot === 'head'}
						<img
							src={skin.image_url}
							alt="Head Skin"
							class="absolute top-[2px] left-1/2 h-[60px] -translate-x-1/2"
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
				onPressedChange={() => selectFilter('head')}
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
				onPressedChange={() => selectFilter('body')}
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
				onPressedChange={() => selectFilter('side')}
			>
				Аксессуар
				{#if filter === 'side'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
		</div>
		<div class="flex justify-center">
			<ScrollArea class=" h-[50vh] w-[680px] px-3" type="always">
				<div class="flex flex-wrap gap-4">
					{#each availableSkins as skin (skin.id)}
						<Button
							onclick={() => selectSkin(skin)}
							class="flex h-[90px] w-[150px] cursor-pointer justify-center rounded-xl p-2 {selectedSkinIds.includes(
								skin.id
							)
								? 'bg-primary'
								: 'bg-secondary'}"
						>
							<img src={skin.image_url} alt="skin" class="h-full object-contain" />
						</Button>
					{/each}
				</div>
			</ScrollArea>
		</div>
	</DialogContent>
</Dialog>
