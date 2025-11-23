<script lang="ts">
	import AddShitDialog from './AddShitDialog.svelte'
	import MakeShieldDialog from './MakeShieldDialog.svelte'
</script>

<div class="flex flex-col">
	<div>Подсер</div>
	<div class="flex w-full justify-between gap-4">
		<div class="flex-1">
			<AddShitDialog />
		</div>
		<div class="flex-1">
			<MakeShieldDialog />
		</div>
	</div>
</div>
