<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.TriggerProps = $props();
</script>

<DialogPrimitive.Trigger
	bind:ref
	data-slot="dialog-trigger"
	class={['cursor-pointer transition-colors data-[state=open]:bg-primary', className]}
	{...restProps}
/>
