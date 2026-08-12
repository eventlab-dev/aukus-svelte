<script lang="ts">
	import DevelopersIcon from '../icons/new/DevelopersIcon.svelte'
	import MapIcon from '../icons/new/MapIcon.svelte'
	import RulesIcon from '../icons/new/RulesIcon.svelte'
	import StatsIcon from '../icons/new/StatsIcon.svelte'
	import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
	import type { MobilePage } from './types'
	import { goto } from '$app/navigation'

	type Props = {
		page: MobilePage
	}

	let { page = $bindable() }: Props = $props()

	function setPage(newPage: MobilePage) {
		page = newPage
		// Update URL when changing pages
		if (newPage === 'map') {
			goto('/', { noScroll: true, replaceState: false })
		}
		// Other pages don't have specific URLs in mobile view
	}
</script>

<div class="sticky top-2 z-1000 p-2">
	<Tabs
		value={page}
		class="m-0 bg-none! w-full"
		onValueChange={(value) => {
			setPage(value as MobilePage)
		}}
	>
		<TabsList class="w-full gap-2 bg-transparent h-[43px] justify-between">
			<TabsTrigger value="map" class="flex-1 w-full max-w-full rounded-xl">
				<MapIcon class="size-8" />
			</TabsTrigger>
			<TabsTrigger value="table" class="flex-1 w-full max-w-full rounded-xl">
				<StatsIcon class="size-8" />
			</TabsTrigger>
			<TabsTrigger value="rules" class="flex-1 w-full max-w-full rounded-xl">
				<RulesIcon class="size-8" />
			</TabsTrigger>
			<TabsTrigger value="about" class="flex-1 w-full max-w-full rounded-xl">
				<DevelopersIcon class="size-8" />
			</TabsTrigger>
		</TabsList>
	</Tabs>
</div>
