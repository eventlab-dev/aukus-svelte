<script lang="ts">
	import { Badge } from '$lib/components/ui/badge'
	import { buttonVariants } from '$lib/components/ui/button'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { EventTitles } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { CommonGameItem } from '$lib/types'
	import { formatDuration, getMoveTypeStyles, renderToHTML } from '$lib/utils'

	type Props = {
		game: CommonGameItem
	}

	const { game }: Props = $props()

	const { usersStore } = getAppManagerContext()

	const parsedReview = $derived(renderToHTML(game.review || ''))
	const playerName = $derived(usersStore.usersBySlug.get(game.player_name)?.username ?? game.player_name)
	const moveTypeStyles = $derived(getMoveTypeStyles(game.completion_status))

	let open = $state(false)

	let closeTimeout: ReturnType<typeof setTimeout> | undefined = undefined

	function handleMouseEnter() {
		clearTimeout(closeTimeout)
		open = true
	}

	function handleMouseLeave() {
		clearTimeout(closeTimeout)
		closeTimeout = setTimeout(() => {
			open = false
		}, 300)
	}
</script>

<Popover {open} onOpenChange={(value) => (open = value)}>
	<PopoverTrigger
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		class={[buttonVariants({ variant: 'secondary', size: 'sm' }), 'data-[state=open]:bg-primary']}
	>
		{playerName}
	</PopoverTrigger>
	<PopoverContent
		class="w-[375px] space-y-3"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<div class="font-bold">{game.game_title}</div>
		<div class="text-sm leading-[18px] font-medium text-muted-foreground">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html parsedReview}
		</div>
		<div class="flex gap-1.5">
			<Badge variant="blue">{EventTitles[game.event_name]}</Badge>
			<Badge variant={moveTypeStyles.variant}>
				{moveTypeStyles.text}
			</Badge>
			{#if game.rating.length > 0}
				<Badge variant="default">
					{game.rating}
				</Badge>
			{/if}
			{#if game.game_time > 0}
				<Badge variant="secondary" class="w-full shrink py-0">
					Играл
					{formatDuration(game.game_time)}
				</Badge>
			{/if}
		</div>
	</PopoverContent>
</Popover>
