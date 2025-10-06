<script lang="ts">
	import TiptapEditor from '$lib/components/TiptapEditor.svelte'
	import { Button } from '$lib/components/ui/button'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCurrentRulesVersionApiRulesCurrentGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'
	import { createQuery } from '@tanstack/svelte-query'

	const { myPlayer } = getAppManagerContext()
	const canEdit = $derived($myPlayer?.role === 'admin')

	const rulesQuery = createQuery(getCurrentRulesVersionApiRulesCurrentGetOptions())

	const defaultRuleValue = '<h3><u>Правила не найдены</u></h3>'

	const rules = $derived($rulesQuery.data?.versions[0]?.content ?? JSON.stringify(defaultRuleValue))

	let editorMode = $state(false)
	let editedRules = $state('')

	$inspect(editedRules)

	function saveRules() {
		editorMode = false
	}
</script>

<div class="mt-[100px] flex w-full justify-center">
	<div>
		<div class="text-center text-[40px] font-bold">Правила ивента</div>
		<div class="mt-10">
			{#if canEdit}
				{#if editorMode}
					<div class="mb-10 flex gap-5">
						<Button variant="default" onclick={() => (editorMode = false)}>Отмена</Button>
						<Button variant="destructive" onclick={saveRules}>Сохранить</Button>
					</div>
				{:else}
					<Button class="mb-10" onclick={() => (editorMode = true)}>Редактировать</Button>
				{/if}
			{/if}
		</div>
		{#if $rulesQuery.isLoading}
			<LoaderCircle class="inline animate-spin" />
		{:else if editorMode}
			<TiptapEditor class="w-[700px]" content={rules} bind:value={editedRules} withMenu />
		{:else}
			<TiptapEditor class="w-[700px] border-none" content={rules} editable={false} />
		{/if}
	</div>
</div>
