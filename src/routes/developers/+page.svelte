<script lang="ts">
	import { Button } from '$lib/components/ui/button'

	type Developer = {
		name: string
		description: string
	}

	const developers: Developer[] = [
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
			name: 'Rvg',
			description: 'Карта, скины'
		},
		{
			name: 'esouqu',
			description: 'Фронтенд'
		},
		{
			name: 'Pechenka',
			description: 'Тестирование'
		}
	].sort((a, b) => a.name.localeCompare(b.name))

	type Sponsor = {
		name: string
		message: string
		type: 'big' | 'small'
	}

	const sponsors: Sponsor[] = [
		{
			name: 'Donator1',
			message: 'Спасибо за ваш труд!',
			type: 'big'
		},
		{
			name: 'Donator2',
			message: 'Отличный проект!',
			type: 'small'
		}
	]
</script>

<div class="flex justify-center">
	<div class="mt-[100px] w-[700px]">
		<div class="text-5xl">Разработчиков можно поддержать на Boosty</div>
		<div class="my-[40px] flex gap-4">
			<Button class="flex-1 bg-[#FF881E]">-> Поддержать на бусти</Button>
			<Button class="flex-1" variant="secondary">Наш телеграм</Button>
			<Button class="flex-1" variant="secondary">Сайт EventLab</Button>
		</div>
		<div>
			<div class="text-4xl">Наши споносры</div>
			<div class="mt-[20px] flex flex-col gap-5">
				{#each sponsors as sponsor (sponsor.name)}
					<span>
						<strong>{sponsor.name}</strong> — {sponsor.message}
					</span>
				{/each}
			</div>
			<div class="mt-[40px] text-4xl">Команда разработчиков</div>
			<div class="mt-[20px] flex flex-col gap-5">
				{#each developers as developer (developer.name)}
					<span>
						<strong>{developer.name}</strong> — {developer.description}
					</span>
				{/each}
			</div>
		</div>
	</div>
</div>
