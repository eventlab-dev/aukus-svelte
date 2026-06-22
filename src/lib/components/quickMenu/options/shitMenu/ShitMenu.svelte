<script lang="ts">
	import FireIcon from '$lib/components/icons/new/FireIcon.svelte'
	import ShieldIcon from '$lib/components/icons/new/ShieldIcon.svelte'
	import AddShitDialog from './AddShitDialog.svelte'
	import MakeShieldDialog from './MakeShieldDialog.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
</script>

<div class="flex flex-col">
	<div class="flex w-full items-center justify-between gap-1">
		<div class="flex items-center gap-1">
			<FireIcon /> Подсёров - {app.myPlayer?.shit_stacks}
		</div>
		<div class="flex items-center gap-1 text-muted-foreground">
			{app.myPlayer?.shield_stacks}
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
