<script lang="ts">
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'
	import DicePanelContent from './DicePanelContent.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type DiceOptionOrDrop = DiceOption | 'drop'

	const app = getAppManager()
	const { eventDataStore, movementStore } = app

	function diceOptionsForPosition(mapPosition: number): DiceOptionOrDrop[] {
		if (mapPosition >= 81) {
			return ['drop', '1d2', '1d4', '1d6']
		}
		return ['drop', '1d2', '1d4', '2d4', '2d6', '3d6', '4d6']
	}

	const panelParams = $derived.by(() => {
		if (movementStore.selectedPlayer) {
			return {
				playerToShow: movementStore.selectedPlayer,
				canRollDice: false,
				diceOptinos: diceOptionsForPosition(movementStore.selectedPlayer.map_position)
			}
		}
		if (app.myPlayer && app.turnState === 'selecting-dice') {
			let options: DiceOptionOrDrop[] = eventDataStore.diceOptions
			if (app.myPlayer.last_move?.type === 'drop' || app.myPlayer.last_move?.type === 'sheikh_moment') {
				options = ['drop']
			}
			return {
				playerToShow: app.myPlayer,
				canRollDice: app.eventActive,
				diceOptinos: options
			}
		}
		return null
	})
</script>

{#if panelParams}
	<DicePanelContent
		player={panelParams.playerToShow}
		canRollDice={panelParams.canRollDice}
		diceOptions={panelParams.diceOptinos}
	/>
{/if}
