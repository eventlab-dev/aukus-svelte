<script lang="ts">
	import { PlayerBaseModelUrl } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCellPosition } from '$lib/mapUtils'
	import type { PlayerData } from '$lib/types'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	const { players } = getAppManagerContext()

	const cellPosition = getCellPosition(player.map_position)

	const otherPlayersOnCell = $derived(
		$players
			.filter((p) => p.map_position === player.map_position && p.slug !== player.slug)
			.sort((a, b) => a.slug.localeCompare(b.slug))
	)

	const cellOffset = $derived.by(() => {
		if (otherPlayersOnCell.length === 0) {
			return { x: 28, y: 20 }
		}

		const index = otherPlayersOnCell.findIndex((p) => p.slug === player.slug)
		if (otherPlayersOnCell.length === 1) {
			if (index === 0) {
				return { x: 0, y: 0 }
			}
			return { x: 28, y: 20 }
		}

		const offsetAmount = 15
		return {
			x: index * offsetAmount,
			y: index * offsetAmount
		}
	})

	const finalTop = $derived(cellPosition.y + cellOffset.y)
	const finalLeft = $derived(cellPosition.x + cellOffset.x)

	const skins = $derived(player.equipped_skins)
</script>

<div class="absolute" style="top: {finalTop}px; left: {finalLeft}px">
	<img src={PlayerBaseModelUrl} alt="player-model" class="h-20" />
	<div class="flex w-full justify-center">
		<p class="relative top-[-20px] left-0">{player.username}</p>
	</div>
</div>
