<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import TwitchIcon from '$lib/components/icons/TwitchIcon.svelte'
	import DonationAlertsIcon from '$lib/components/icons/DonationAlertsIcon.svelte'
	import TelegramIcon from '$lib/components/icons/TelegramIcon.svelte'
	import VkLiveIcon from '$lib/components/icons/VKLiveIcon.svelte'
	import KickIcon from '$lib/components/icons/KickIcon.svelte'

	type Props = {
		twitchLink?: string
		donationAlertsLink?: string
		telegramLink?: string
		vkLiveLink?: string
		kickLink?: string
		colored?: boolean
	}

	const {
		twitchLink,
		donationAlertsLink,
		telegramLink,
		vkLiveLink,
		kickLink,
		colored = true
	}: Props = $props()

	const items = $derived([
		{
			href: twitchLink,
			Icon: TwitchIcon,
			color: 'bg-custom-purple'
		},
		{
			href: donationAlertsLink,
			Icon: DonationAlertsIcon,
			color: 'bg-custom-orange'
		},
		{
			href: telegramLink,
			Icon: TelegramIcon,
			color: 'bg-custom-blue'
		},
		{
			href: vkLiveLink,
			Icon: VkLiveIcon,
			color: 'bg-custom-red'
		},
		{
			href: kickLink,
			Icon: KickIcon,
			color: 'bg-custom-green'
		}
	])
</script>

<div class="space-x-3">
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
