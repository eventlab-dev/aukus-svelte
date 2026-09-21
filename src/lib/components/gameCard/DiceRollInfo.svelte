<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { getRollByIdApiDiceRollsRollIdGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
	import { Skeleton } from '$lib/components/ui/skeleton'
	import { EventlabBaseUrl } from '$lib/client'

	type Props = {
		diceRollId: number | null
	}

	const { diceRollId }: Props = $props()

	const diceRollQuery = createQuery(() => ({
		...getRollByIdApiDiceRollsRollIdGetOptions({
			baseUrl: EventlabBaseUrl,
			path: { roll_id: diceRollId || 0 }
		}),
		enabled: !!diceRollId
	}))

	const diceRoll = $derived(diceRollQuery.data)
	const isLoading = $derived(diceRollQuery.isLoading)
	const isError = $derived(diceRollQuery.isError)
</script>

<div class="min-w-[280px] space-y-3 font-['Shantell_Sans'] text-[#F1F5FF]">
	{#if isLoading}
		<div class="space-y-2">
			<Skeleton class="h-4 w-32" />
			<Skeleton class="h-4 w-full" />
			<Skeleton class="h-4 w-24" />
		</div>
	{:else if isError || !diceRoll}
		<div class="text-sm text-[#F1F5FF]/70">Failed to load dice roll information</div>
	{:else}
		<div class="space-y-2">
			<div class="text-sm font-medium">Dice Roll Information</div>

			<div class="space-y-1 text-sm">
				<div>
					<span class="text-[#F1F5FF]/70">Values:</span>
					<span class="ml-2 font-medium">{diceRoll.roll_values.join(', ')}</span>
				</div>

				<div>
					<span class="text-[#F1F5FF]/70">Type:</span>
					<span class="ml-2">{diceRoll.dice_type}</span>
				</div>

				<div>
					<span class="text-[#F1F5FF]/70">Sum:</span>
					<span class="ml-2 font-medium">{diceRoll.roll_values.reduce((a, b) => a + b, 0)}</span>
				</div>

				<div>
					<span class="text-[#F1F5FF]/70">Random.org:</span>
					<span class="ml-2">
						{diceRoll.is_random_org_result ? 'Yes' : 'No'}
					</span>
				</div>

				{#if diceRoll.random_org_check_url}
					<div>
						<span class="text-[#F1F5FF]/70">Verification:</span>
						<a
							href={diceRoll.random_org_check_url}
							target="_blank"
							rel="noopener noreferrer"
							class="ml-2 text-[#F1F5FF] underline hover:text-[#F1F5FF]/80"
						>
							Check result
						</a>
					</div>
				{/if}

				{#if diceRoll.random_org_fail_reason}
					<div>
						<span class="text-[#F1F5FF]/70">Random.org failed:</span>
						<span class="ml-2 text-xs">{diceRoll.random_org_fail_reason}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
