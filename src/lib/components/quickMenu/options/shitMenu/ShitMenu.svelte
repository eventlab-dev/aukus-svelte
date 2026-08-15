<script lang="ts">
	import FireIcon from '$lib/components/icons/new/FireIcon.svelte'
	import ShieldIcon from '$lib/components/icons/new/ShieldIcon.svelte'
	import AddShitDialog from './AddShitDialog.svelte'
	import MakeShieldDialog from './MakeShieldDialog.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
</script>

<div class="flex gap-20 font-extrabold">
<div class="flex">
	<div class="flex flex-col gap-2">
		<div class="ml-6 flex items-center gap-1">
			<FireIcon /> Подсёры
		</div>
		<div class="flex items-center gap-3">
			<div class="font-bold w-[160px] bg-secondary rounded-[22px] text-4xl text-center p-2">{app.myPlayer?.shit_stacks}</div>
			<div class="flex items-center gap-2 flex-1">
				<AddShitDialog />
			</div>
		</div>
	</div>
	
</div>
	<div class="flex flex-col gap-2">
		<div class="ml-6 flex items-center gap-1">
			<ShieldIcon /> Щиты
		</div>
		<div class="flex items-center gap-3">
			<div class="font-bold w-[160px] bg-secondary rounded-[22px] text-4xl text-center p-2">{app.myPlayer?.shield_stacks}</div>
			<div class="flex items-center gap-2 flex-1">
				<MakeShieldDialog />
			</div>
		</div>
	</div>
</div>
