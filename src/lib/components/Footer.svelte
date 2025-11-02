<script lang="ts">
	import { Button } from './ui/button'

	const sections = [
		{
			title: 'EventLab',
			items: [
				{
					label: 'Поддержать разработчиков',
					href: 'https://boosty.to/aukus'
				},
				{
					label: 'Мы на Гитхабе',
					href: 'https://github.com/eventlab-dev'
				}
			]
		},
		{
			title: 'Связь с нами',
			items: [
				{
					label: 'Телеграм',
					href: 'https://t.me/eventlabdev'
				},
				{
					label: 'Почта для отзывов',
					href: 'mailto:contact@eventlab.dev'
				}
			]
		}
	]
</script>

<footer class="mt-[100px] flex justify-center rounded-xl bg-card px-[120px] py-[50px]">
	<div class="flex w-[700px] justify-between">
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
	</div>
</footer>
