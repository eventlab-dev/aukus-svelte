<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import storable from '$lib/stores/LocalStore.svelte'
	import AchievementsDialog from '../achievements/AchievementsDialog.svelte'
	import Collapsible from '../collapsible/Collapsible.svelte'
	import CollapsibleContent from '../collapsible/CollapsibleContent.svelte'
	import CollapsibleGroup from '../collapsible/CollapsibleGroup.svelte'
	import CollapsibleTrigger from '../collapsible/CollapsibleTrigger.svelte'
	import ProfileIcon from '../icons/ProfileIcon.svelte'
	import TwitchIcon from '../icons/TwitchIcon.svelte'
	import SkinEditorDialog from '../skinEditor/SkinEditorDialog.svelte'
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
	import { Button } from '../ui/button'
	import GamesHistoryDialog from './options/history/GamesHistoryDialog.svelte'
	import LoginDialog from './options/LoginDialog.svelte'
	import PunishmentCalculator from './options/PunishmentCalculator.svelte'
	import ShitMenu from './options/shitMenu/ShitMenu.svelte'
	import SkinRollerMenu from './options/SkinRollerMenu.svelte'
	import Timelapse from './options/timelapse/Timelapse.svelte'
	import WheelDialog from './options/WheelDialog.svelte'

	const { usersStore, myPlayer } = getAppManagerContext()

	const { myUser } = usersStore

	const collapsed = storable('quickMenuCollapsed', false)

	let isTimelapseShown = $state(false)

	$effect(() => {
		if (!collapsed.value) {
			isTimelapseShown = false
		}
	})

	const originalCollapsed = collapsed.value

	$effect(() => {
		if ($myPlayer && !originalCollapsed) {
			collapsed.value = true
			collapsed.value = false
		}
	})

	function closeTimelapse() {
		isTimelapseShown = false
		collapsed.value = false
	}

	// function openTimelapse() {
	// 	isTimelapseShown = true
	// 	collapsed.value = true
	// }
</script>

{#key $myUser?.slug}
	<Collapsible class="w-[260px]" bind:collapsed={collapsed.value}>
		<CollapsibleTrigger class="w-full">
			{#if $myUser}
				<Avatar class="size-[27px]">
					<AvatarImage src={$myUser.avatar_link || "https://github.com/shadcn.png"} />
					<AvatarFallback class="uppercase">{$myUser.username.slice(0, 2)}</AvatarFallback>
				</Avatar>
				{$myUser.username}
			{:else}
				Быстрый доступ
			{/if}
		</CollapsibleTrigger>

		<CollapsibleContent>
			<CollapsibleGroup>
				<AchievementsDialog />
				<GamesHistoryDialog />
				<Button onclick={() => window.open('/streams', '_blank')}>
					<TwitchIcon /> Мультитрансляция
				</Button>
			</CollapsibleGroup>

			{#if $myPlayer}
				<CollapsibleGroup>
					<SkinEditorDialog />
					<SkinRollerMenu />
					<PunishmentCalculator />
					<WheelDialog />
					<ShitMenu />
				</CollapsibleGroup>
			{/if}

			<!-- <CollapsibleGroup>
				<Button onclick={openTimelapse}>
					<CalendarIcon /> Таймлапс
				</Button>
			</CollapsibleGroup> -->

			{#if $myUser}
				<CollapsibleGroup>
					<Button onclick={() => usersStore.logout()}><ProfileIcon />Выйти</Button>
				</CollapsibleGroup>
			{:else}
				<CollapsibleGroup>
					<LoginDialog />
				</CollapsibleGroup>
			{/if}
		</CollapsibleContent>

		{#if isTimelapseShown}
			<Timelapse close={closeTimelapse} />
		{/if}
	</Collapsible>
{/key}
