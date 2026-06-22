<script lang="ts">
	import type { SkinItem, SkinSlot } from '$lib/heyapi/aukus/types.gen'
	import X from '@lucide/svelte/icons/x'
	import GrammerlyIcon from '../icons/GrammerlyIcon.svelte'
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
	import Toggle from '../ui/toggle/toggle.svelte'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import Button from '../ui/button/button.svelte'
	import { SvelteSet } from 'svelte/reactivity'
	import PlayerModel from '../map/PlayerModel.svelte'
	import DicePreview from './DicePreview.svelte'
	import SkinPreview from './SkinPreview.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { eventDataStore, usersStore } = app

	let selectedSkins = $state<{ [k in SkinSlot]: number | null }>({
		head: null,
		body: null,
		item: null,
		dice: null
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

	const equippedSkins = $derived.by(() => {
		if (!app.myPlayer) {
			return []
		}
		return app.myPlayer.equipped_skins.map((id) => eventDataStore.skinsById.get(id)).filter((s) => s !== undefined)
	})

	const selectedDiceSkin = $derived(selectedSkinItems.find((s) => s.slot === 'dice'))

	let filter = $state<SkinSlot | null>(null)

	function selectFilter(part: SkinSlot) {
		if (filter === part) {
			filter = null
		} else {
			filter = part
		}
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
		if (filter) {
			return availableUnique.filter((s) => s.slot === filter)
		}
		return availableUnique
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
			await usersStore.setSkins.mutateAsync({ body: { skin_ids: selectedSkinIds } })
			await eventDataStore.eventDataQuery.refetch()
		}
	}
</script>

<Dialog onOpenChange={handleOpenChange}>
	<DialogTrigger><GrammerlyIcon /> Кастомизация</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Кастомизация персонажа</DialogTitle>
		</DialogHeader>
		<div class="relative flex w-full justify-center">
			<div class="relative w-fit">
				{#if app.myPlayer}
					<PlayerModel player={app.myPlayer} selectedSkins={selectedSkinItems} variant="big" />
				{/if}
			</div>
			<div class="absolute right-30 bottom-5">
				<DicePreview textureUrl={selectedDiceSkin?.image_url} />
			</div>
		</div>
		<div class="flex w-full justify-center gap-2">
			<Toggle
				class="cursor-pointer data-[state=off]:bg-secondary data-[state=on]:bg-primary"
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
				class="cursor-pointer data-[state=off]:bg-secondary data-[state=on]:bg-primary"
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
				class="cursor-pointer data-[state=off]:bg-secondary data-[state=on]:bg-primary"
				pressed={filter === 'item'}
				onPressedChange={() => selectFilter('item')}
			>
				Аксессуар
				{#if filter === 'item'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
			<Toggle
				class="cursor-pointer data-[state=off]:bg-secondary data-[state=on]:bg-primary"
				pressed={filter === 'dice'}
				onPressedChange={() => selectFilter('dice')}
			>
				Кубик
				{#if filter === 'dice'}
					<span class="rounded bg-white/20 p-0.5">
						<X class="stroke-4" />
					</span>
				{/if}
			</Toggle>
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
	</DialogContent>
</Dialog>
