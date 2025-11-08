<script lang="ts">
	import AchievementsNotifications from '$lib/components/achievements/AchievementsNotifications.svelte'
	import DiceAnimationPanel from '$lib/components/diceRoll/DiceAnimationPanel.svelte'
	import DicePanel from '$lib/components/diceRoll/DicePanel.svelte'
	import MapComponent from '$lib/components/map/MapComponent.svelte'
	import MoveForm from '$lib/components/moveForm/MoveForm.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { turnState, movementStore, myPlayer } = getAppManagerContext()
	const { selectedPlayer } = movementStore
</script>

<svelte:head>
	<title>Aukus</title>
</svelte:head>

<!-- <div class="absolute top-[-40px] flex w-full justify-center">
	<img src="/logo2.png" class="absolute top-[100px] w-[300px]" alt="logo" />
	<img src="/logo-background.png" alt="back" />
</div> -->

<div class="">
	<MapComponent />
</div>

{#if $turnState === 'filling-form' && !$selectedPlayer}
	<div class="sticky bottom-10 left-1/2 mt-10 flex w-fit -translate-x-1/2 justify-center">
		<MoveForm />
	</div>
{/if}

{#if $turnState === 'dice-animation' || $turnState === 'dice-results'}
	<DiceAnimationPanel />
{/if}

{#if $turnState === 'selecting-dice' || $selectedPlayer}
	<div class="pointer-events-none sticky bottom-10 mt-10 flex justify-center">
		<div class="pointer-events-auto flex">
			<DicePanel />
		</div>
	</div>
{/if}

{#if $myPlayer}
	<AchievementsNotifications />
{/if}
