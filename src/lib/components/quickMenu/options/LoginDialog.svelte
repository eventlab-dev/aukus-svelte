<script lang="ts">
	import ProfileIcon from '$lib/components/icons/ProfileIcon.svelte'
	import Login from '$lib/components/Login.svelte'
	import { Dialog, DialogContent, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { usersStore } = getAppManagerContext()
	const { loginError } = usersStore

	function handleOpenChange(open: boolean) {
		if (!open) {
			loginError.set(null)
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
