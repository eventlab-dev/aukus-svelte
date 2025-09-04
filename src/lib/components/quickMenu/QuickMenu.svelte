<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import storable from '$lib/stores/LocalStore.svelte';
	import Collapsible from '../collapsible/Collapsible.svelte';
	import CollapsibleContent from '../collapsible/CollapsibleContent.svelte';
	import CollapsibleGroup from '../collapsible/CollapsibleGroup.svelte';
	import CollapsibleTrigger from '../collapsible/CollapsibleTrigger.svelte';
	import CalendarIcon from '../icons/CalendarIcon.svelte';
	import CrownIcon from '../icons/CrownIcon.svelte';
	import GalleryAddIcon from '../icons/GalleryAddIcon.svelte';
	import GrammerlyIcon from '../icons/GrammerlyIcon.svelte';
	import HeartIcon from '../icons/HeartIcon.svelte';
	import LifebuoyIcon from '../icons/LifebuoyIcon.svelte';
	import MathIcon from '../icons/MathIcon.svelte';
	import MoonIcon from '../icons/MoonIcon.svelte';
	import ProfileIcon from '../icons/ProfileIcon.svelte';
	import ScrollIcon from '../icons/ScrollIcon.svelte';
	import TwitchIcon from '../icons/TwitchIcon.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
	import { Button } from '../ui/button';

	const { userStore } = getAppManagerContext();

	const isPlayer = $derived(userStore.user?.role === 'player');
	const isModerator = $derived(userStore.user?.role === 'moder');

	const collapsed = storable(false, 'quickMenuCollapsed');
</script>

<Collapsible class="w-[260px]" bind:collapsed={collapsed.value}>
	<CollapsibleTrigger class="w-full">
		{#if userStore.user}
			<Avatar class="size-[27px]">
				<AvatarImage src="https://github.com/shadcn.png" />
				<AvatarFallback class="uppercase">{userStore.user.name.slice(0, 2)}</AvatarFallback>
			</Avatar>
			{userStore.user.name}
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
			<Button href="/players">
				<ProfileIcon /> Участники
			</Button>
			<div><CrownIcon /> Достижения</div>
			{#if isPlayer}
				<div><HeartIcon /> Привязать поинтаук</div>
			{/if}
		</CollapsibleGroup>

		{#if isPlayer}
			<CollapsibleGroup>
				<div><GrammerlyIcon /> Кастомизация</div>
			</CollapsibleGroup>

			<CollapsibleGroup>
				<div><MathIcon /> Калкулятор наказаний</div>
				<div><LifebuoyIcon /> Колёса вариантов</div>
			</CollapsibleGroup>
		{/if}

		<CollapsibleGroup>
			<div><MoonIcon /> Затемнить карту</div>
		</CollapsibleGroup>

		{#if isPlayer}
			<CollapsibleGroup>
				<div><GalleryAddIcon /> Добавить картинку</div>
			</CollapsibleGroup>
		{/if}

		<CollapsibleGroup>
			<div><TwitchIcon /> Мультитрансляция</div>
			<div><ScrollIcon /> Создатели</div>
		</CollapsibleGroup>

		<CollapsibleGroup>
			<div><CalendarIcon /> Таймлапс</div>
		</CollapsibleGroup>
	</CollapsibleContent>
</Collapsible>
