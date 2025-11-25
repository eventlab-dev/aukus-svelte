<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'
	import DicePanelContent from './DicePanelContent.svelte'

	type DiceOptionOrDrop = DiceOption | 'drop'

	const { eventDataStore, movementStore, myPlayer, turnState, eventActive } = getAppManagerContext()
	const { diceOptions } = eventDataStore
	const { selectedPlayer } = movementStore

	function diceOptionsForPosition(mapPosition: number): DiceOptionOrDrop[] {
		if (mapPosition >= 81) {
			return ['drop', '1d2', '1d4', '1d6']
		}
		return ['drop', '1d2', '1d4', '2d4', '2d6', '3d6', '4d6']
	}

	const panelParams = $derived.by(() => {
		if ($selectedPlayer) {
			return {
				playerToShow: $selectedPlayer,
				canRollDice: false,
				diceOptinos: diceOptionsForPosition($selectedPlayer.map_position)
			}
		}
		if ($myPlayer && $turnState === 'selecting-dice') {
			let options: DiceOptionOrDrop[] = $diceOptions
			if ($myPlayer.last_move?.type === 'drop' || $myPlayer.last_move?.type === 'sheikh_moment') {
				options = ['drop']
			}
			return {
				playerToShow: $myPlayer,
				canRollDice: $eventActive,
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
