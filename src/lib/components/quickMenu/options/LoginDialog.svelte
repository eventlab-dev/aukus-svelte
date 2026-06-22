<script lang="ts">
	import Login from '$lib/components/Login.svelte'
	import { Dialog, DialogContent } from '$lib/components/ui/dialog'

	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { usersStore, navStore } = app

	function handleOpenChange(open: boolean) {
		if (!open) {
			usersStore.loginError = null
			navStore.closePage()
		}
	}
</script>

<Dialog onOpenChange={handleOpenChange} open>
	<DialogContent class="w-100">
		<div class="mt-10 mb-5">
			<Login />
		</div>
	</DialogContent>
</Dialog>
