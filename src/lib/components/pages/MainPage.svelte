<script lang="ts">
	import AchievementsNotifications from '$lib/components/achievements/AchievementsNotifications.svelte'
	import DiceAnimationPanel from '$lib/components/diceRoll/DiceAnimationPanel.svelte'
	import DicePanel from '$lib/components/diceRoll/DicePanel.svelte'
	import MapComponent from '$lib/components/map/MapComponent.svelte'
	import MoveForm from '$lib/components/moveForm/MoveForm.svelte'
	import EventStatusBanner from '$lib/components/EventStatusBanner.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import PlayersList from '$lib/components/player/PlayersList.svelte'
	import PageContainer from '$lib/components/PageContainer.svelte'
	import AboutPage from '$lib/components/pages/AboutPage.svelte'
	import StatsPage from './stats/StatsPage.svelte'
	import RulesPage from './rules/RulesPage.svelte'
	import PresentationPage from './presentation/PresentationPage.svelte'
	import PlayerPageWrapper from './player/PlayerPageWrapper.svelte'

	const { turnState, movementStore, myPlayer, navStore } = getAppManagerContext()
	const { selectedPlayer } = movementStore
</script>

<svelte:head>
	<title>Aukus 5</title>
</svelte:head>

<div class="mt-2 flex gap-2">
	<div class="flex-1">
		<MapComponent />
	</div>
	<div class="mr-2">
		<PlayersList />
	</div>
</div>

{#if navStore.dynamicPage}
	<PageContainer>
		<PlayerPageWrapper />
	</PageContainer>
{:else if navStore.appPage === 'about'}
	<PageContainer>
		<AboutPage />
	</PageContainer>
{:else if navStore.appPage === 'stats'}
	<PageContainer>
		<StatsPage />
	</PageContainer>
{:else if navStore.appPage === 'rules'}
	<PageContainer>
		<RulesPage />
	</PageContainer>
{:else if navStore.appPage === 'presentation'}
	<PageContainer>
		<PresentationPage />
	</PageContainer>
{/if}

{#if turnState === 'filling-form' && !selectedPlayer}
	<div class="sticky bottom-10 left-1/2 z-49 mt-10 flex w-fit -translate-x-1/2 justify-center">
		<MoveForm />
	</div>
{/if}

{#if turnState === 'dice-animation' || turnState === 'dice-results'}
	<DiceAnimationPanel />
{/if}

{#if turnState === 'selecting-dice' || selectedPlayer}
	<div class="pointer-events-none sticky bottom-10 z-49 mt-10 flex justify-center">
		<div class="pointer-events-auto flex">
			<DicePanel />
		</div>
	</div>
{/if}

{#if myPlayer}
	<AchievementsNotifications />
{/if}

<EventStatusBanner />