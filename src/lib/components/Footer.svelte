<script lang="ts">
	import { Button } from './ui/button'

	const sections = [
		{
			title: 'AUKUS-DEVS',
			items: [
				{
					label: 'Поддержать разработчиков',
					href: '#'
				},
				{
					label: 'Мы на Гитхабе',
					href: '#'
				}
			]
		},
		{
			title: 'Уведомления',
			items: [
				{
					label: 'Канал в телеграме',
					href: '#'
				},
				{
					label: 'Канал в дискорде',
					href: '#'
				}
			]
		},
		{
			title: 'Зеркала сайта',
			items: [
				{
					label: 'aukus.fun',
					href: '#'
				},
				{
					label: 'aukus.su',
					href: '#'
				}
			]
		},
		{
			title: 'Связь с нами',
			items: [
				{
					label: 'Наш дискорд',
					href: '#'
				},
				{
					label: 'Помогите стать лучше',
					href: '#'
				}
			]
		}
	]
</script>

<footer class="mt-[100px] flex justify-between rounded-xl bg-card px-[120px] py-[50px]">
	{#each sections as { title, items } (title)}
		<div class="space-y-[25px]">
			<div class="text-xl leading-[24px] font-bold">{title}</div>
			<div class="mt-4 flex flex-col gap-[15px]">
				{#each items as { label, href } (label)}
					<Button {href} variant="link" class="h-auto p-0 text-sm font-medium text-foreground ">
						{label}
					</Button>
				{/each}
			</div>
		</div>
	{/each}
</footer>
