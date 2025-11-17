<script lang="ts">
	import { Button } from '../ui/button'
	import type { MobilePage } from './types'

	type Props = {
		page: MobilePage
	}

	let { page = $bindable() }: Props = $props()
</script>

<div class="sticky top-2 z-1000 flex gap-2 p-2">
	<Button
		class="flex-1 rounded-xl"
		variant={page === 'map' ? 'default' : 'secondary'}
		onclick={() => (page = 'map')}
		>M
	</Button>
	<Button
		class="flex-1 rounded-xl"
		variant={page === 'table' ? 'default' : 'secondary'}
		onclick={() => (page = 'table')}>T</Button
	>
	<Button
		class="flex-1 rounded-xl"
		variant={page === 'rules' ? 'default' : 'secondary'}
		onclick={() => (page = 'rules')}>R</Button
	>
	<Button
		class="flex-1 rounded-xl"
		variant={page === 'about' ? 'default' : 'secondary'}
		onclick={() => (page = 'about')}>A</Button
	>
</div>
