<script lang="ts">
	import type { PlayerMoveType } from '$lib/heyapi/aukus/types.gen'
	import type { NotificationsResponse } from '$lib/heyapi/eventlab/types.gen'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { getDirectStreamUrl } from '$lib/utils/streamUtils'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'
	import { Button } from '../ui/button'

	type Props = {
		notification: NotificationsResponse['notifications'][0]
	}

	let { notification }: Props = $props()

	const app = getAppManager()

	const userSlug = $derived(notification.payload.user_slug)
	const player = $derived(app.playersBySlug.get(userSlug))
	const streamLink = $derived(player ? getDirectStreamUrl(player) : '')

	const { title, text } = $derived.by(() => {
		const empty = { title: '', text: '' }
		if (!player) {
			return empty
		}
		switch (notification.notification_type) {
			case 'user_online': {
				return {
					title: `${player.username} подрубил стрим`,
					text: `${notification.payload.stream_title || notification.payload.stream_category}`
				}
			}
			case 'auction_started': {
				return {
					title: `${player.username} начинает аук`,
					text: ''
				}
			}
			case 'auction_winner': {
				return {
					title: `${player.username} заролил аук`,
					text: `Победитель: ${notification.payload.winner_title}`
				}
			}
			case 'category_changed': {
				return {
					title: `${player.username} сменил категорию`,
					text: `${notification.payload.new_category}`
				}
			}
			case 'player_move': {
				let completionText = ''
				switch (notification.payload.move_type as PlayerMoveType) {
					case 'completed': {
						completionText = `прошел ${notification.payload.item_title}`
						break
					}
					case 'drop': {
						completionText = `дропнул ${notification.payload.item_title}`
						break
					}
					case 'reroll': {
						completionText = `рерольнул ${notification.payload.item_title}`
						break
					}
					case 'movie': {
						completionText = `посмотрел ${notification.payload.item_title}`
						break
					}
					case 'sheikh_moment': {
						completionText = `шейх-дропнул ${notification.payload.item_title}`
						break
					}
				}
				let text = `Попал на клетку ${notification.payload.cell_to}`
				if (notification.payload.snake) {
					text = `Упал на клетку ${notification.payload.cell_to}`
				}
				if (notification.payload.ladder) {
					text = `Поднялся на клетку ${notification.payload.cell_to}`
				}
				return {
					title: `${player.username} ${completionText}`,
					text
				}
			}
		}
		return empty
	})
</script>

{#if title && player}
	<div class="flex flex-col gap-3 rounded-2xl bg-card p-4">
		<div class="flex items-center gap-2 text-xl font-extrabold">
			<PlayerAvatar name={player.username} isOnline src={player.avatar_link} />
			{title}
		</div>
		{#if text}
			<div class="font-extrabold">{text}</div>
		{/if}
		{#if streamLink}
			<Button href={streamLink} target="_blank" class="w-full bg-secondary font-extrabold">
				Смотреть
			</Button>
		{/if}
	</div>
{/if}
