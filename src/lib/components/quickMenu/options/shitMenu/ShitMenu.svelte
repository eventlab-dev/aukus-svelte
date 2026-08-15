<script lang="ts">
	import FireIcon from '$lib/components/icons/new/FireIcon.svelte'
	import ShieldIcon from '$lib/components/icons/new/ShieldIcon.svelte'
	import AddShitDialog from './AddShitDialog.svelte'
	import MakeShieldDialog from './MakeShieldDialog.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()

	// 	<!--
	// <div class="flex items-center gap-2">
	//   <!-- Large component + top -->
	//   <div class="relative">
	//     <div class="absolute bottom-full left-1/2 -translate-x-1/2">
	//       Top
	//     </div>

	//     <div>
	//       Large
	//     </div>
	//   </div>

	//   <!-- Side component -->
	//   <div>
	//     Side
	//   </div>
	// </div>
	//  -->
</script>

<div class="mt-10 flex gap-20 font-extrabold">
	<div class="flex items-center gap-2">
		<div class="relative">
			<div
				class="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 uppercase"
			>
				<FireIcon /> Подсёры
			</div>
			<div class="w-[160px] rounded-[22px] bg-secondary p-2 text-center text-4xl font-bold">
				{app.myPlayer?.shit_stacks}
			</div>
		</div>
		<AddShitDialog />
	</div>
	<div class="flex items-center gap-2">
		<div class="relative">
			<div
				class="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 uppercase"
			>
				<ShieldIcon /> Щиты
			</div>
			<div class="w-[160px] rounded-[22px] bg-secondary p-2 text-center text-4xl font-bold">
				{app.myPlayer?.shield_stacks}
			</div>
		</div>
		<MakeShieldDialog />
	</div>
</div>
