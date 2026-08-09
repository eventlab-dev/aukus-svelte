<script lang="ts">
	import { FALLBACK_AVATAR_URL } from '$lib/constants'
	import Collapsible from '../collapsible/Collapsible.svelte'
	import CollapsibleContent from '../collapsible/CollapsibleContent.svelte'
	import CollapsibleGroup from '../collapsible/CollapsibleGroup.svelte'
	import CollapsibleTrigger from '../collapsible/CollapsibleTrigger.svelte'
	import ProfileIcon from '../icons/ProfileIcon.svelte'
	import WinIcon from '../icons/new/WinIcon.svelte'
	import TwitchIcon from '../icons/TwitchIcon.svelte'
	import CrownIcon from '../icons/CrownIcon.svelte'
	import SkinEditorDialog from '../skinEditor/SkinEditorDialog.svelte'
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
	import { Button } from '../ui/button'
	import SearchIcon from '../icons/SearchIcon.svelte'
	import LoginDialog from './options/LoginDialog.svelte'
	import PunishmentCalculator from './options/PunishmentCalculator.svelte'
	import ShitMenu from './options/shitMenu/ShitMenu.svelte'
	import SkinRollerMenu from './options/SkinRollerMenu.svelte'
	import Timelapse from './options/timelapse/Timelapse.svelte'
	import WheelDialog from './options/WheelDialog.svelte'
	import { LocalStore } from '$lib/stores/LocalStore.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	
	const collapsed = new LocalStore('quickMenuCollapsed', false)

	let isTimelapseShown = $state(false)

	// $effect(() => {
	// 	if (!$collapsed) {
	// 		isTimelapseShown = false
	// 	}
	// })

	// const originalCollapsed = collapsed.value

	// $effect(() => {
	// 	if ($myPlayer && !originalCollapsed) {
	// 		collapsed.value = true
	// 		collapsed.value = false
	// 	}
	// })

	function closeTimelapse() {
		isTimelapseShown = false
		// collapsed.value = false
	}

	// function openTimelapse() {
	// 	isTimelapseShown = true
	// 	collapsed.value = true
	// }
</script>

{#key [app.myUser?.slug, app.eventFinished]}
	<Collapsible class="w-[260px]" bind:collapsed={collapsed.value}>
		<CollapsibleTrigger class="w-full">
			{#if app.myUser}
				<Avatar class="size-[27px]">
					<AvatarImage src={app.myUser.avatar_link || FALLBACK_AVATAR_URL} />
					<AvatarFallback class="uppercase">{app.myUser.username.slice(0, 2)}</AvatarFallback>
				</Avatar>
				{app.myUser.username}
			{:else}
				Быстрый доступ
			{/if}
		</CollapsibleTrigger>

		<CollapsibleContent>
			<CollapsibleGroup>
				{#if app.eventFinished}
					<Button class="bg-primary!" href="/presentation">
						<WinIcon /> Итоги
					</Button>
				{/if}
				<Button href="/achievements">
					<CrownIcon /> Достижения
				</Button>
				<Button href="/history">
					<SearchIcon /> История игр
				</Button>
				<Button href="/streams">
					<TwitchIcon /> Мультитрансляция
				</Button>
			</CollapsibleGroup>

			{#if app.myPlayer}
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

			{#if app.myUser}
				<CollapsibleGroup>
					<Button onclick={() => app.usersStore.logout()}><ProfileIcon />Выйти</Button>
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
