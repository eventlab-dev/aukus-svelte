<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import Socials from '$lib/components/Socials.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { fade } from 'svelte/transition'

	const { players } = getAppManagerContext()
</script>

<div class="mx-auto mt-[100px] max-w-[800px]" in:fade>
	<div class="space-y-[100px]">
		{#each $players as player (player.slug)}
			<div class="flex flex-col items-center gap-5">
				<PlayerAvatar
					src={player.avatar_link ?? ''}
					name={player.username}
					isOnline={Boolean(player.is_online)}
					size="lg"
				/>
				<div class="text-5xl leading-[58px] font-bold">
					{player.first_name} «{player.username}»
				</div>
				<Socials {player} />
			</div>
		{/each}
	</div>
</div>
