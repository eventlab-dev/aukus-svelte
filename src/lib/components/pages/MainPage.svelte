<script lang="ts">
	import AchievementsNotifications from '$lib/components/achievements/AchievementsNotifications.svelte'
	import DiceAnimationPanel from '$lib/components/diceRoll/DiceAnimationPanel.svelte'
	import DicePanel from '$lib/components/diceRoll/DicePanel.svelte'
	import MapComponent from '$lib/components/map/MapComponent.svelte'
	import MoveForm from '$lib/components/moveForm/MoveForm.svelte'
	import EventStatusBanner from '$lib/components/EventStatusBanner.svelte'
	import PlayersList from '$lib/components/player/PlayersList.svelte'
	import PageContainer from '$lib/components/PageContainer.svelte'
	import AboutPage from '$lib/components/pages/AboutPage.svelte'
	import StatsPage from './stats/StatsPage.svelte'
	import RulesPage from './rules/RulesPage.svelte'
	import PresentationPage from './presentation/PresentationPage.svelte'
	import PlayerPageWrapper from './player/PlayerPageWrapper.svelte'
	import LoginDialog from '../quickMenu/options/LoginDialog.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import PunishmentCalculator from '../quickMenu/options/PunishmentCalculator.svelte'
	import WheelDialog from '../quickMenu/options/WheelDialog.svelte'
	import AchievementsDialog from '../achievements/AchievementsDialog.svelte'
	import GamesHistoryDialog from '../quickMenu/options/history/GamesHistoryDialog.svelte'
	import StreamsPage from './streams/StreamsPage.svelte'
	import { TOP_BANNER } from '$lib/constants'

	const app = getAppManager()
	const { movementStore, navStore } = app
</script>

<svelte:head>
	<title>Aukus 5</title>
</svelte:head>

<div class="absolute top-0 left-1/2 -translate-x-1/2 z-30">
	<img src={TOP_BANNER} alt="Top banner" class="h-auto w-[116px]" />
</div>

<div class="m-0 h-screen">
	<div class="flex-1">
		<MapComponent />
	</div>
	<div class="absolute top-2 right-2">
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
{:else if navStore.appPage === 'login'}
	<LoginDialog />
{:else if navStore.appPage === 'calculator'}
	<PunishmentCalculator />
{:else if navStore.appPage === 'wheels'}
	<WheelDialog />
{:else if navStore.appPage === 'achievements'}
	<AchievementsDialog />
{:else if navStore.appPage === 'history'}
	<GamesHistoryDialog />
{:else if navStore.appPage === 'streams'}
	<PageContainer bottomSpace={false}>
		<StreamsPage />
	</PageContainer>
{/if}

{#if app.turnState === 'filling-form' && !movementStore.selectedPlayer}
	<div class="sticky bottom-10 left-1/2 z-15 mt-10 flex w-fit -translate-x-1/2 justify-center">
		<MoveForm />
	</div>
{/if}

{#if app.turnState === 'dice-animation' || app.turnState === 'dice-results'}
	<DiceAnimationPanel />
{/if}

{#if app.turnState === 'selecting-dice' || movementStore.selectedPlayer}
	<div class="pointer-events-none sticky bottom-10 z-49 mt-10 flex justify-center">
		<div class="pointer-events-auto flex">
			<DicePanel />
		</div>
	</div>
{/if}

{#if app.myPlayer}
	<AchievementsNotifications />
{/if}

<EventStatusBanner />
