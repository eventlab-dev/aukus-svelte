<script lang="ts">
	import DevelopersIcon from '../icons/new/DevelopersIcon.svelte'
	import MapIcon from '../icons/new/MapIcon.svelte'
	import RulesIcon from '../icons/new/RulesIcon.svelte'
	import StatsIcon from '../icons/new/StatsIcon.svelte'
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
	>
		<MapIcon />
	</Button>
	<Button
		class="flex-1 rounded-xl"
		variant={page === 'table' ? 'default' : 'secondary'}
		onclick={() => (page = 'table')}
	>
		<StatsIcon />
	</Button>
	<Button
		class="flex-1 rounded-xl"
		variant={page === 'rules' ? 'default' : 'secondary'}
		onclick={() => (page = 'rules')}
	>
		<RulesIcon />
	</Button>
	<Button
		class="flex-1 rounded-xl"
		variant={page === 'about' ? 'default' : 'secondary'}
		onclick={() => (page = 'about')}
	>
		<DevelopersIcon />
	</Button>
</div>
