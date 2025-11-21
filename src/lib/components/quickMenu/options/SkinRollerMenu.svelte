<script lang="ts">
	import SkinsRoller from '$lib/components/roller/SkinsRoller.svelte'
	import { Button } from '$lib/components/ui/button'

	let isOpen = $state(false)

	function handleClick() {
		isOpen = true
	}
</script>

<Button onclick={handleClick}>Ролл скинов</Button>

<SkinsRoller
	autoOpen={isOpen}
	onClose={() => {
		isOpen = false
	}}
	options={[
		{
			label: '1',
			imageUrl: 'https://storage.yandexcloud.net/eventlab/assets/aukus4/skins/body_chad.png',
			value: '1',
			weight: 1
		},
		{
			label: '2',
			imageUrl: 'https://storage.yandexcloud.net/eventlab/assets/aukus4/skins/head_sonic.png',
			value: '2',
			weight: 1
		}
	]}
	header="Скин за прохождение игры"
	onRollFinish={(option) => {
		console.log('Выбранный скин:', option)
		return Promise.resolve()
	}}
	getWinnerText={(option) => ''}
/>
