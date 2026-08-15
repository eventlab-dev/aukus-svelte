<script lang="ts">
	import type { SkinItem, SkinSlot } from '$lib/heyapi/aukus/types.gen'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import Button from '../ui/button/button.svelte'
	import { SvelteSet } from 'svelte/reactivity'
	import PlayerModel from '../map/PlayerModel.svelte'
	import DicePreview from './DicePreview.svelte'
	import SkinPreview from './SkinPreview.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { debounce } from 'perfect-debounce'
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'

	const app = getAppManager()
	const { eventDataStore, usersStore } = app

	const equippedSkins = $derived.by(() => {
		if (!app.myPlayer) {
			return []
		}
		return app.myPlayer.equipped_skins.map((id) => eventDataStore.skinsById.get(id)).filter((s) => s !== undefined)
	})

	// Initialize selectedSkins from equippedSkins
	let selectedSkins = $state<{ [k in SkinSlot]: number | null }>({
		head: null,
		body: null,
		item: null,
		dice: null
	})

	// Initialize with equipped skins on mount
	$effect(() => {
		for (const skin of equippedSkins) {
			if (selectedSkins[skin.slot] === null) {
				selectedSkins[skin.slot] = skin.id
			}
		}
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
			.map((id) => (id ? eventDataStore.skinsById.get(id) : undefined))
			.filter((s) => s !== undefined)
	})

	const selectedDiceSkin = $derived(selectedSkinItems.find((s) => s.slot === 'dice'))

	let filter = $state<SkinSlot | 'all'>('all')

	function selectFilter(part: SkinSlot | 'all') {
		filter = part
	}

	const availableSkins = $derived.by(() => {
		if (!app.myPlayer) {
			return []
		}
		const available = app.myPlayer.available_skins
			.map((id) => eventDataStore.skinsById.get(id))
			.filter((s) => s !== undefined)
			.sort((a, b) => a.id - b.id)

		const uniqueIds = new SvelteSet(available.map((s) => s.id))
		const availableUnique = available.filter((s) => {
			if (uniqueIds.has(s.id)) {
				uniqueIds.delete(s.id)
				return true
			}
			return false
		})
		if (filter === 'all') {
			return availableUnique
		}
		return availableUnique.filter((s) => s.slot === filter)
	})

	async function saveSkins() {
		const equippedSkinsIds = equippedSkins.map((s) => s.id).sort()
		if (
			equippedSkinsIds.length === selectedSkinIds.length &&
			equippedSkinsIds.every((value, index) => value === selectedSkinIds[index])
		) {
			return
		}
		await usersStore.setSkins.mutateAsync({ body: { skin_ids: selectedSkinIds } })
		await eventDataStore.eventDataQuery.refetch()
	}

	const debouncedSave = debounce(saveSkins, 1000)

	// Debounced save when selectedSkins changes
	$effect(() => {
		const equippedSkinsIds = equippedSkins.map((s) => s.id).sort()
		const hasChanges =
			equippedSkinsIds.length !== selectedSkinIds.length ||
			!equippedSkinsIds.every((value, index) => value === selectedSkinIds[index])
		
		if (hasChanges) {
			debouncedSave()
		}
	})
</script>

<div class="flex flex-col items-center">
	<div class="relative flex w-full justify-center mb-6">
		<div class="relative w-fit">
			{#if app.myPlayer}
				<PlayerModel player={app.myPlayer} selectedSkins={selectedSkinItems} variant="huge" />
			{/if}
		</div>
		<div class="absolute right-30 bottom-5">
			<DicePreview textureUrl={selectedDiceSkin?.image_url} />
		</div>
	</div>
	
	<div class="flex w-full justify-center mb-6">
		<Tabs bind:value={filter} class="w-full">
			<TabsList class="flex w-full justify-center gap-2 bg-transparent">
				<TabsTrigger value="all">Все</TabsTrigger>
				<TabsTrigger value="head">Голова</TabsTrigger>
				<TabsTrigger value="body">Тело</TabsTrigger>
				<TabsTrigger value="item">Аксессуар</TabsTrigger>
				<TabsTrigger value="dice">Кубик</TabsTrigger>
			</TabsList>
		</Tabs>
	</div>
	
	<div class="flex justify-center">
		<ScrollArea class="h-[50vh] w-fit" type="always">
			<div class="flex w-fit flex-wrap justify-center gap-3">
				{#each availableSkins as skin (skin.id)}
					<Button
						onclick={() => selectSkin(skin)}
						class="flex h-[90px] w-[150px] cursor-pointer items-center justify-center rounded-xl p-4 {selectedSkinIds.includes(
							skin.id
						)
							? 'bg-primary'
							: 'bg-secondary'}"
					>
						<SkinPreview {skin} />
					</Button>
				{/each}
			</div>
			<div class="mt-10"></div>
		</ScrollArea>
	</div>
</div>
