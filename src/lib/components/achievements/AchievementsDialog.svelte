<script lang="ts">
	import { flip } from 'svelte/animate'
	import AchievementCard from './AchievementCard.svelte'
	import { sineInOut } from 'svelte/easing'
	import CrownIcon from '../icons/CrownIcon.svelte'
	import { Button } from '../ui/button'
	import PageContainer from '../PageContainer.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { BG_NET } from '$lib/constants'
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import type { SkinItem, SkinSlot } from '$lib/heyapi/aukus/types.gen'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import { SvelteSet } from 'svelte/reactivity'
	import PlayerModel from '../map/PlayerModel.svelte'
	import DicePreview from '../skinEditor/DicePreview.svelte'
	import SkinPreview from '../skinEditor/SkinPreview.svelte'
	import { debounce } from 'perfect-debounce'

	const app = getAppManager()
	const { eventDataStore, usersStore } = app

	let selectedPlayerSlug: string = $state('all')
	let selectedTab: string = $state('achievements')

	// Initialize with current player when component mounts
	$effect(() => {
		if (app.myPlayer && !selectedPlayerSlug) {
			selectedPlayerSlug = app.myPlayer.slug
		}
	})

	const filteredAchievements = $derived.by(() => {
		if (selectedPlayerSlug === 'all') {
			return eventDataStore.achievements
		}
		const player = app.playersBySlug.get(selectedPlayerSlug)
		if (!player) {
			return eventDataStore.achievements
		}

		return eventDataStore.achievements.filter((a) =>
			player.unlocked_achievements.find((pa) => pa.id === a.id)
		)
	})

	// Skin editor logic
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

	let skinFilter = $state<SkinSlot | 'all'>('all')

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
		if (skinFilter !== 'all') {
			return availableUnique.filter((s) => s.slot === skinFilter)
		}
		return availableUnique
	})

	// Initialize selected skins with equipped skins when component mounts
	$effect(() => {
		if (selectedTab === 'skins') {
			for (const skin of equippedSkins) {
				selectedSkins[skin.slot] = skin.id
			}
		}
	})

	// Debounced save function
	const saveSkins = debounce(async () => {
		const equippedSkinsIds = equippedSkins.map((s) => s.id).sort()
		if (
			equippedSkinsIds.length === selectedSkinIds.length &&
			equippedSkinsIds.every((value, index) => value === selectedSkinIds[index])
		) {
			return
		}
		await usersStore.setSkins.mutateAsync({ body: { skin_ids: selectedSkinIds } })
		await eventDataStore.eventDataQuery.refetch()
	}, 2000)

	// Save skins when selection changes with debounce
	$effect(() => {
		if (selectedSkinIds.length > 0) {
			saveSkins()
		}
	})
</script>

<Button href="/achievements">
	<CrownIcon /> Достижения
</Button>

<PageContainer
	class="bg-[#4D66B9]!"
	style={`background-image: url('${BG_NET}'); background-size: repeat;`}
>
	<div class="flex flex-col items-center gap-5 pt-16">
		<div class="w-full max-w-[840px]">
			{#if app.myUser}
				<Tabs
					value={selectedTab}
					class="w-full"
					onValueChange={(value) => {
						selectedTab = value
					}}
				>
					<TabsList class="flex w-full flex-wrap gap-2 bg-transparent">
						<TabsTrigger value="achievements" class="uppercase">Ачивки</TabsTrigger>
						<TabsTrigger value="skins" class="uppercase">Мои Скины</TabsTrigger>
					</TabsList>
				</Tabs>

				{#if selectedTab === 'achievements'}
					<div class="mt-4">
						<Tabs
							value={selectedPlayerSlug}
							class="w-full"
							onValueChange={(value) => {
								selectedPlayerSlug = value
							}}
						>
							<TabsList class="flex w-full flex-wrap gap-2 bg-transparent">
								<TabsTrigger value="all" class="uppercase">Все</TabsTrigger>
								{#each app.players as player (player.slug)}
									<TabsTrigger value={player.slug} class="uppercase">
										{player.username}
									</TabsTrigger>
								{/each}
							</TabsList>
						</Tabs>
					</div>

					<div class="mt-5 flex justify-center">
						<div class="flex flex-wrap items-stretch gap-3">
							{#each filteredAchievements as achievement (achievement.id)}
								<div animate:flip={{ duration: 300, easing: sineInOut }} class="flex flex-col">
									<AchievementCard {achievement} />
								</div>
							{/each}
						</div>
						<div class="mt-10"></div>
					</div>
				{:else}
					<div class="mt-5">
						<div class="relative flex w-full justify-center mb-6">
							<div class="relative w-fit">
								{#if app.myPlayer}
									<PlayerModel player={app.myPlayer} selectedSkins={selectedSkinItems} variant="big" />
								{/if}
							</div>
							<div class="absolute right-30 bottom-5">
								<DicePreview textureUrl={selectedDiceSkin?.image_url} />
							</div>
						</div>
						<div class="flex w-full justify-center gap-2 mb-6">
							<Tabs
								value={skinFilter}
								class="w-full"
								onValueChange={(value) => {
									skinFilter = value as SkinSlot | 'all'
								}}
							>
								<TabsList class="flex w-full flex-wrap gap-2 bg-transparent">
									<TabsTrigger value="all" class="uppercase">Все</TabsTrigger>
									<TabsTrigger value="head" class="uppercase">Голова</TabsTrigger>
									<TabsTrigger value="body" class="uppercase">Тело</TabsTrigger>
									<TabsTrigger value="item" class="uppercase">Аксессуар</TabsTrigger>
									<TabsTrigger value="dice" class="uppercase">Кубик</TabsTrigger>
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
				{/if}
			{:else}
				<h1 class="mb-5 text-center text-2xl font-bold">Достижения</h1>

				<Tabs
					value={selectedPlayerSlug}
					class="w-full"
					onValueChange={(value) => {
						selectedPlayerSlug = value
					}}
				>
					<TabsList class="flex w-full flex-wrap gap-2 bg-transparent">
						<TabsTrigger value="all" class="uppercase">Все</TabsTrigger>
						{#each app.players as player (player.slug)}
							<TabsTrigger value={player.slug} class="uppercase">
								{player.username}
							</TabsTrigger>
						{/each}
					</TabsList>
				</Tabs>

				<div class="mt-5 flex justify-center">
					<div class="flex flex-wrap items-stretch gap-3">
						{#each filteredAchievements as achievement (achievement.id)}
							<div animate:flip={{ duration: 300, easing: sineInOut }} class="flex flex-col">
								<AchievementCard {achievement} />
							</div>
						{/each}
					</div>
					<div class="mt-10"></div>
				</div>
			{/if}
		</div>
	</div>
</PageContainer>
