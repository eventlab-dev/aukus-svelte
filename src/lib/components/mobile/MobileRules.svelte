<script lang="ts">
	import { AukusBaseUrl } from '$lib/client'
	import { getCurrentRulesVersionApiRulesCurrentGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
	import type { RulesCategory } from '$lib/heyapi/aukus/types.gen'
	import { createQuery } from '@tanstack/svelte-query'
	import { Button } from '../ui/button'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'
	import TiptapEditor from '../richEditor/TiptapEditor.svelte'

	let category = $state<RulesCategory>('general')

	const rulesQuery = createQuery(
		getCurrentRulesVersionApiRulesCurrentGetOptions({ baseUrl: AukusBaseUrl })
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

	function setCategory(newCategory: RulesCategory) {
		category = newCategory
	}
</script>

<div class="mt-[52px] mb-4 text-center text-4xl font-bold">Правила</div>

<div class="mb-8 flex gap-2">
	<Button
		class="flex-1 rounded-xl data-[active=false]:bg-secondary data-[active=true]:bg-primary"
		onclick={() => setCategory('general')}
		data-active={category === 'general'}
	>
		Для участников
	</Button>
	<Button
		class="flex-1 rounded-xl data-[active=false]:bg-secondary data-[active=true]:bg-[#FF881E]"
		onclick={() => setCategory('donations')}
		data-active={category === 'donations'}
	>
		Для донатеров
	</Button>
</div>

{#if $rulesQuery.isLoading}
	<LoaderCircle class="inline animate-spin" />
{:else}
	<TiptapEditor
		class="h-fit w-[700px] border-none"
		content={rules}
		editable={false}
		extensions={{ sectionsMode: 'full', withTOC: true, withLinks: true }}
	/>
{/if}
