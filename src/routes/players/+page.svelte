<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte';
	import Socials from '$lib/components/Socials.svelte';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import { fade } from 'svelte/transition';

	const { playersStore } = getAppManagerContext();
	const { players } = playersStore;
</script>

<div class="mx-auto mt-[100px] max-w-[800px]" in:fade>
	<div class="space-y-[100px]">
		{#each players as player}
			{@const socials = {
				twitchLink: player?.twitch_stream_link || '',
				donationAlertsLink: player?.donation_link || '',
				telegramLink: player?.telegram_link || '',
				vkLiveLink: player?.vk_stream_link || '',
				kickLink: player?.kick_stream_link || ''
			}}

			<div class="flex flex-col items-center gap-5">
				<PlayerAvatar
					src={player.avatar_link}
					name={player.name}
					isOnline={player.is_online}
					size="lg"
				/>
				<div class="text-5xl leading-[58px] font-bold">
					{player.first_name} «{player.name}» {player.last_name}
				</div>
				<Socials {...socials} />
			</div>
		{/each}
	</div>
</div>
