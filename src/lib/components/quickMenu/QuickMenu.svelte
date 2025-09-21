<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import storable from '$lib/stores/LocalStore.svelte'
	import Collapsible from '../collapsible/Collapsible.svelte'
	import CollapsibleContent from '../collapsible/CollapsibleContent.svelte'
	import CollapsibleGroup from '../collapsible/CollapsibleGroup.svelte'
	import CollapsibleTrigger from '../collapsible/CollapsibleTrigger.svelte'
	import CalendarIcon from '../icons/CalendarIcon.svelte'
	import CrownIcon from '../icons/CrownIcon.svelte'
	import GalleryAddIcon from '../icons/GalleryAddIcon.svelte'
	import GrammerlyIcon from '../icons/GrammerlyIcon.svelte'
	import MoonIcon from '../icons/MoonIcon.svelte'
	import ProfileIcon from '../icons/ProfileIcon.svelte'
	import TwitchIcon from '../icons/TwitchIcon.svelte'
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
	import { Button } from '../ui/button'
	import PointaucDialog from './options/PointaucDialog.svelte'
	import PunishmentCalculator from './options/PunishmentCalculator.svelte'
	import Timelapse from './options/timelapse/Timelapse.svelte'
	import WheelDialog from './options/WheelDialog.svelte'

	const { usersStore } = getAppManagerContext()

	const isPlayer = $derived(usersStore.isPlayer)
	const isModerator = $derived(usersStore.isModerator)

	const collapsed = storable('quickMenuCollapsed', false)

	let isTimelapseShown = $state(false)

	$effect(() => {
		if (!collapsed.value) {
			isTimelapseShown = false
		}
	})

	function closeTimelapse() {
		isTimelapseShown = false
		collapsed.value = false
	}

	function openTimelapse() {
		isTimelapseShown = true
		collapsed.value = true
	}

	function openLogin() {
		goto('/login')
	}
</script>

{#key usersStore.myUser?.slug}
	<Collapsible class="w-[260px]" bind:collapsed={collapsed.value}>
		<CollapsibleTrigger class="w-full">
			{#if usersStore.myUser}
				<Avatar class="size-[27px]">
					<AvatarImage src="https://github.com/shadcn.png" />
					<AvatarFallback class="uppercase">{usersStore.myUser.username.slice(0, 2)}</AvatarFallback
					>
				</Avatar>
				{usersStore.myUser.username}
			{:else}
				Быстрый доступ
			{/if}
		</CollapsibleTrigger>

		<CollapsibleContent>
			{#if isModerator}
				<CollapsibleGroup>
					<div><GalleryAddIcon /> Добавить картинку</div>
				</CollapsibleGroup>
			{/if}

			<CollapsibleGroup>
				{#if isPlayer}
					<div><GrammerlyIcon /> Кастомизация</div>
				{/if}
				<Button
					class="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary"
					data-active={page.route.id === '/achievements'}
					onclick={() => goto('/achievements')}
				>
					<CrownIcon /> Достижения
				</Button>
				{#if isPlayer}
					<PointaucDialog />
				{/if}
			</CollapsibleGroup>

			{#if isPlayer}
				<CollapsibleGroup>
					<PunishmentCalculator />
					<WheelDialog />
				</CollapsibleGroup>
			{/if}

			{#if isPlayer}
				<CollapsibleGroup>
					<div><GalleryAddIcon /> Добавить картинку</div>
				</CollapsibleGroup>
			{/if}

			<CollapsibleGroup>
				<div><TwitchIcon /> Мультитрансляция</div>
				<div><MoonIcon /> Затемнить карту</div>
			</CollapsibleGroup>

			<CollapsibleGroup>
				<Button onclick={openTimelapse}>
					<CalendarIcon /> Таймлапс
				</Button>
			</CollapsibleGroup>

			{#if usersStore.myUser}
				<CollapsibleGroup>
					<Button onclick={() => usersStore.logout()}><ProfileIcon />Выйти</Button>
				</CollapsibleGroup>
			{:else}
				<CollapsibleGroup>
					<Button onclick={openLogin}><ProfileIcon />Логин</Button>
				</CollapsibleGroup>
			{/if}
		</CollapsibleContent>

		{#if isTimelapseShown}
			<Timelapse close={closeTimelapse} />
		{/if}
	</Collapsible>
{/key}
