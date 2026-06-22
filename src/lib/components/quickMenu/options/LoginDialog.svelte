<script lang="ts">
	import ProfileIcon from '$lib/components/icons/ProfileIcon.svelte'
	import Login from '$lib/components/Login.svelte'
	import { Dialog, DialogContent, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { usersStore } = getAppManagerContext()

	function handleOpenChange(open: boolean) {
		if (!open) {
			usersStore.loginError = null
		}
	}
</script>

<Dialog onOpenChange={handleOpenChange}>
	<DialogTrigger><ProfileIcon />Логин</DialogTrigger>
	<DialogContent class="w-100">
		<div class="mt-10 mb-5">
			<Login />
		</div>
	</DialogContent>
</Dialog>
