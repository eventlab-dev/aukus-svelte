<script lang="ts">
	import FireIcon from '$lib/components/icons/new/FireIcon.svelte'
	import ShieldIcon from '$lib/components/icons/new/ShieldIcon.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import AddShitDialog from './AddShitDialog.svelte'
	import MakeShieldDialog from './MakeShieldDialog.svelte'

	const { myPlayer } = getAppManagerContext()
</script>

<div class="flex flex-col">
	<div class="flex w-full items-center justify-between gap-1">
		<div class="flex items-center gap-1">
			<FireIcon /> Подсёров - {myPlayer?.shit_stacks}
		</div>
		<div class="flex items-center gap-1 text-muted-foreground">
			{myPlayer?.shield_stacks}
			<ShieldIcon />
		</div>
	</div>
	<div class="flex w-full justify-between gap-4">
		<div class="flex-1">
			<AddShitDialog />
		</div>
		<div class="flex-1">
			<MakeShieldDialog />
		</div>
	</div>
</div>
