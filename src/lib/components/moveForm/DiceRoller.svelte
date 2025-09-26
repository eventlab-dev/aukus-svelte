<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Button } from '../ui/button'
	import { ToggleGroupItem } from '../ui/toggle-group'
	import ToggleGroup from '../ui/toggle-group/toggle-group.svelte'

	const { usersStore } = getAppManagerContext()

	const { turnState } = usersStore

	function handleClick() {
		turnState.set('filling-form')
	}
</script>

<div class="w-100 rounded-2xl bg-card p-5">
	<ToggleGroup type="single" value="3d6" variant="outline" class="w-full">
		<ToggleGroupItem value="1d6" class="data-[state=on]:bg-primary">1d6</ToggleGroupItem>
		<ToggleGroupItem value="2d6" class="data-[state=on]:bg-primary">2d6</ToggleGroupItem>
		<ToggleGroupItem value="3d6" class="data-[state=on]:bg-primary">3d6</ToggleGroupItem>
	</ToggleGroup>
	<div class="py-5">
		<p>Шанс лестницы: 5%</p>
		<p>Шанс змейки: 5%</p>
	</div>
	<Button class="mt-5 w-full" onclick={handleClick}>Бросить кубики</Button>
</div>
