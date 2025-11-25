<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

	type Props = {
		src: string
		name: string
		isOnline: boolean
		class?: string
		size?: 'default' | 'lg' | 'small' | 'tiny'
	}

	const { class: className, src, name, isOnline, size = 'default' }: Props = $props()
</script>

<div class={['group relative w-fit', className]} data-size={size}>
	<Avatar
		class="size-[41px] group-data-[size=lg]:size-[70px] group-data-[size=small]:size-[25px] group-data-[size=tiny]:size-[18px] md:size-7 "
	>
		<AvatarImage {src} />
		<AvatarFallback class="text-[10px] uppercase group-data-[size=lg]:text-xl group-data-[size=tiny]:text-[8px]">
			{name.slice(0, 2)}
		</AvatarFallback>
	</Avatar>
	{#if isOnline}
		<span
			class="absolute right-0 bottom-0 size-2.5 rounded-full bg-green-500 group-data-[size=lg]:size-4 group-data-[size=small]:size-2 group-data-[size=tiny]:size-1.5"
		></span>
	{/if}
</div>
