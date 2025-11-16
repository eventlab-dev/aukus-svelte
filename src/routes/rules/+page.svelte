<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { AukusBaseUrl } from '$lib/client'
	import TiptapEditor from '$lib/components/richEditor/TiptapEditor.svelte'
	import { Button } from '$lib/components/ui/button'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import {
		createNewRulesVersionApiRulesPostMutation,
		getCurrentRulesVersionApiRulesCurrentGetOptions
	} from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
	import { type RulesCategory } from '$lib/heyapi/aukus/types.gen'
	import { defaultAuth } from '$lib/utils'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'
	import { createMutation, createQuery } from '@tanstack/svelte-query'

	const { myPlayer } = getAppManagerContext()
	const canEdit = $derived(
		$myPlayer?.roles.includes('admin') || $myPlayer?.roles.includes('rules.edit')
	)

	let category = $state<RulesCategory>('general')

	$effect(() => {
		if (page.url.pathname === '/rules/donators') {
			category = 'donations'
		}
	})

	const rulesQuery = createQuery(
		getCurrentRulesVersionApiRulesCurrentGetOptions({ baseUrl: AukusBaseUrl })
	)
	const saveQuery = createMutation(
		createNewRulesVersionApiRulesPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth()
		})
	)

	const defaultRuleValue = JSON.stringify('<h3><u>Правила не найдены</u></h3>')

	const { generalRules, donationsRules } = $derived.by(() => {
		const general = $rulesQuery.data?.versions.find((v) => v.category === 'general')?.content
		const donations = $rulesQuery.data?.versions.find((v) => v.category === 'donations')?.content
		return {
			generalRules: general || defaultRuleValue,
			donationsRules: donations || defaultRuleValue
		}
	})

	const rules = $derived(category === 'general' ? generalRules : donationsRules)

	let editorMode = $state(false)
	let editedRules = $state('')

	// $inspect(rules)

	function saveRules() {
		editorMode = false
		$saveQuery.mutate(
			{ body: { category, content: editedRules } },
			{
				onSettled: () => {
					$rulesQuery.refetch()
				}
			}
		)
	}

	function setCategory(newCategory: RulesCategory) {
		category = newCategory
		goto(newCategory === 'general' ? '/rules' : '/rules/donators')
	}
</script>

<div class="mt-[100px] flex w-full justify-center">
	<div class="w-[700px]">
		<div class="flex gap-3">
			<Button
				class="w-60 rounded-2xl data-[active=false]:bg-secondary data-[active=true]:bg-primary"
				onclick={() => setCategory('general')}
				data-active={category === 'general'}
			>
				Для участников
			</Button>
			<Button
				class="w-60 rounded-2xl data-[active=false]:bg-secondary data-[active=true]:bg-[#FF881E]"
				onclick={() => setCategory('donations')}
				data-active={category === 'donations'}
			>
				Для донатеров
			</Button>
		</div>
		<div class="mt-[20px] text-5xl font-bold">
			Правила Аукуса для {category === 'general' ? 'участников' : 'донатеров'}
		</div>
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
			<TiptapEditor
				class="h-[80vh] w-[700px]"
				content={rules}
				bind:value={editedRules}
				withMenu
				extensions={{ withLinks: true, sectionsMode: 'parse-only' }}
			/>
		{:else}
			<TiptapEditor
				class="h-fit w-[700px] border-none"
				content={rules}
				editable={false}
				extensions={{ sectionsMode: 'full', withTOC: true, withLinks: true }}
			/>
		{/if}
	</div>
</div>
