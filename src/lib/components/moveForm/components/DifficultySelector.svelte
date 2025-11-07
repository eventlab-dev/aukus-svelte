<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select'
	import type { Difficulty } from '$lib/types'

	type Props = {
		disabled?: boolean
		value: Difficulty
	}

	let { disabled, value = $bindable() }: Props = $props()
</script>

<Select type="single" {disabled} bind:value>
	<SelectTrigger class="w-full">Сложность</SelectTrigger>
	<SelectContent>
		<SelectItem value="easy">Легкая</SelectItem>
		<SelectItem value="normal">Нормальная</SelectItem>
		<SelectItem value="hard">Сложная</SelectItem>
		<SelectItem value="very-hard">Очень сложная</SelectItem>
	</SelectContent>
</Select>
