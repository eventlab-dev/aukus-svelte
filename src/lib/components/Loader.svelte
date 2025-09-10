<script lang="ts">
	import SnowflakeIcon from './icons/SnowflakeIcon.svelte';

	type Props = {
		class?: string;
	};

	const { class: className }: Props = $props();
</script>

<SnowflakeIcon class={['size-12 animate-spin-alt', className]} />
