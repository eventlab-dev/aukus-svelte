<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import TwitchIcon from '$lib/components/icons/TwitchIcon.svelte'
	import DonationAlertsIcon from '$lib/components/icons/DonationAlertsIcon.svelte'
	import TelegramIcon from '$lib/components/icons/TelegramIcon.svelte'
	import VkLiveIcon from '$lib/components/icons/VKLiveIcon.svelte'
	import KickIcon from '$lib/components/icons/KickIcon.svelte'
	import type { PlayerData } from '$lib/types'

	type Props = {
		player: PlayerData
		colored?: boolean
	}

	const { player, colored = true }: Props = $props()

	const socials = $derived({
		twitchLink: player.twitch_stream_link || '',
		donationAlertsLink: player.donation_link || '',
		telegramLink: player.telegram_link || '',
		vkLiveLink: player.vk_stream_link || '',
		kickLink: player.kick_stream_link || ''
	})

	const items = $derived([
		{
			href: socials.twitchLink,
			Icon: TwitchIcon,
			color: 'bg-custom-purple'
		},
		{
			href: socials.vkLiveLink,
			Icon: VkLiveIcon,
			color: 'bg-custom-red'
		},
		{
			href: socials.kickLink,
			Icon: KickIcon,
			color: 'bg-custom-green'
		},
		{
			href: socials.donationAlertsLink,
			Icon: DonationAlertsIcon,
			color: 'bg-custom-orange'
		},
		{
			href: socials.telegramLink,
			Icon: TelegramIcon,
			color: 'bg-custom-blue'
		}
	])
</script>

<div class="flex flex-wrap gap-3">
	{#each items as { href, Icon, color }, idx (idx)}
		{#if href}
			<Button
				{href}
				target="_blank"
				variant="social"
				size="social"
				class={[colored ? color : 'bg-muted', 'hover:brightness-80']}
			>
				<Icon />
			</Button>
		{/if}
	{/each}
</div>
