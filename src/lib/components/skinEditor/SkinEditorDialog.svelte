<script lang="ts">
	import type { SkinItem, SkinSlot } from '$lib/heyapi/aukus/types.gen'
	import X from '@lucide/svelte/icons/x'
	import GrammerlyIcon from '../icons/GrammerlyIcon.svelte'
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
	import Toggle from '../ui/toggle/toggle.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import Button from '../ui/button/button.svelte'
	import { getSkinIconUrl } from '$lib/utils'
	import { SvelteSet } from 'svelte/reactivity'
	import PlayerModel from '../map/PlayerModel.svelte'
	import DicePreview from './DicePreview.svelte'

	const { eventDataStore, myPlayer, usersStore } = getAppManagerContext()
	const { skinsById, eventDataQuery } = eventDataStore
	const { setSkins } = usersStore

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
			await $setSkins.mutateAsync({ body: { skin_ids: selectedSkinIds } })
			await $eventDataQuery.refetch()
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
				{#if $myPlayer}
					<PlayerModel player={$myPlayer} selectedSkins={selectedSkinItems} variant="big" />
				{/if}
			</div>
			<div class="absolute right-30 bottom-5">
				<DicePreview />
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
		</div>
		<div class="flex justify-center">
			<ScrollArea class="h-[50vh] w-fit" type="always">
				<div class="flex w-fit flex-wrap justify-center gap-3">
					{#each availableSkins as skin (skin.id)}
						<Button
							onclick={() => selectSkin(skin)}
							class="flex h-[90px] w-[150px] cursor-pointer justify-center rounded-xl p-4 {selectedSkinIds.includes(
								skin.id
							)
								? 'bg-primary'
								: 'bg-secondary'}"
						>
							{#if skin.slot === 'dice'}
								<div class="dice-preview-container">
									<div
										class="dice-preview"
										style="background-image: url('{getSkinIconUrl(skin.image_url)}');"
									></div>
								</div>
							{:else}
								<img
									src={getSkinIconUrl(skin.image_url)}
									alt="skin"
									class="h-full object-contain"
								/>
							{/if}
						</Button>
					{/each}
				</div>
			</ScrollArea>
		</div>
	</DialogContent>
</Dialog>

<style>
	.dice-preview-container {
		width: 100%; /* fit the button width */
		height: 100%; /* fit the button height */
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.dice-preview {
		width: 50px;
		height: 90px;
		background-repeat: no-repeat;

		/* scale full image so cropped region fits container */
		background-size: 200px auto;

		/* shift image so cropped region is visible */
		background-position: 0px -23px;

		overflow: hidden;
	}
</style>
