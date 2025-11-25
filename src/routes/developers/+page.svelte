<script lang="ts">
	import { AukusBaseUrl } from '$lib/client'
	import { Button } from '$lib/components/ui/button'
	import { getDonationsApiDonationsGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
	import { createQuery } from '@tanstack/svelte-query'

	type Developer = {
		name: string
		description: string
		isFounder?: boolean
	}

	const founder: Developer = {
		name: 'Lasqa',
		description: 'Организатор и автор идеи',
		isFounder: true
	}

	const developers: Developer[] = [
		founder,
		...[
			{
				name: 'mapcar',
				description: 'Огранизация, фронтенд, бекенд'
			},
			{
				name: 'olegsvs',
				description: 'Сайт, сервера, бекенд'
			},
			{
				name: 'lepayy',
				description: 'Дизайн интерфейсов'
			},
			{
				name: 'Grib0nya',
				description: 'Скины, логотип'
			},
			{
				name: 'Рот в говне (huykakoyto)',
				description: 'Карта, скины'
			},
			{
				name: 'esouqu',
				description: 'Фронтенд'
			},
			{
				name: 'Pechenka',
				description: 'Тестирование'
			},
			{
				name: 'CorruptedMushroom',
				description: 'Бекенд'
			}
		].sort((a, b) => a.name.localeCompare(b.name))
	]

	const sponsorsQuery = createQuery(
		getDonationsApiDonationsGetOptions({
			baseUrl: AukusBaseUrl
		})
	)

	const sponsors = $derived($sponsorsQuery.data?.donations ?? [])

	function openLink(link: 'boosty' | 'tg' | 'eventlab') {
		let url = ''
		if (link === 'boosty') {
			url = 'https://boosty.to/aukus'
		} else if (link === 'tg') {
			url = 'https://t.me/eventlabdev'
		} else if (link === 'eventlab') {
			url = 'https://eventlab.dev/'
		}
		window.open(url, '_blank', 'noopener,noreferrer')
	}
</script>

<div class="flex justify-center">
	<div class="mt-[100px] w-[700px]">
		<div class="text-5xl font-bold">Разработчиков можно поддержать на Boosty</div>
		<div class="my-[40px] flex gap-4">
			<Button class="w-[250px] bg-[#FF881E]" onclick={() => openLink('boosty')}
				>-> Поддержать на бусти</Button
			>
			<Button class="flex-1" variant="secondary" onclick={() => openLink('tg')}>Наш телеграм</Button
			>
			<Button class="flex-1" variant="secondary" onclick={() => openLink('eventlab')}
				>Сайт EventLab</Button
			>
		</div>
		<div>
			<div class="text-4xl font-bold">Наши спонсоры</div>
			<div class="mt-[20px] flex flex-col gap-5">
				{#if sponsors.length === 0}
					<Button
						variant="link"
						class="p-0 text-foreground"
						href="https://boosty.to/aukus"
						target="_blank"
						rel="noopener noreferrer"
					>
						Стать первым!
					</Button>
				{/if}
				{#each sponsors as sponsor (sponsor.name)}
					<span>
						<strong>{sponsor.name}</strong>
						{#if sponsor.message}
							— {sponsor.message}
						{/if}
					</span>
				{/each}
			</div>
			<div class="mt-[40px] text-4xl font-bold">Команда разработчиков</div>
			<div class="mt-[20px] flex flex-col gap-5">
				{#each developers as developer (developer.name)}
					<span>
						<strong class={developer.isFounder ? 'text-[#FF881E]' : ''}>{developer.name}</strong> — {developer.description}
					</span>
				{/each}
			</div>

			<div class="mt-[40px] text-4xl font-bold">Сделано с использованием</div>
			<div class="mt-20 flex flex-wrap gap-4">
				<Button variant="link" href="https://svelte.dev/" target="_blank" rel="noopener noreferrer">
					<img class="h-20 w-auto" src="https://svelte.dev/favicon.png" alt="svelte" />
				</Button>
				<Button
					variant="link"
					href="https://tailwindcss.com/"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						class="h-20 w-auto"
						src="https://tailwindcss.com/favicons/favicon.ico?v=4"
						alt="tailwind"
					/>
				</Button>
				<Button
					variant="link"
					href="https://fastapi.tiangolo.com/"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						class="h-20 w-auto"
						src="https://fastapi.tiangolo.com/img/favicon.png"
						alt="tailwind"
					/>
				</Button>
			</div>
		</div>
	</div>
</div>
