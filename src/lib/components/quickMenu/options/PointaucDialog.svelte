<script lang="ts">
	import HeartIcon from '$lib/components/icons/HeartIcon.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogClose,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import X from '@lucide/svelte/icons/x';
</script>

<Dialog>
	<DialogTrigger>
		<HeartIcon /> Привязать поинтаук
	</DialogTrigger>
	<DialogContent
		class="w-[550px] rounded-[15px] bg-primary p-3 text-primary-foreground selection:bg-foreground selection:text-background"
		showCloseButton={false}
	>
		<DialogHeader class="mb-[74px] gap-3">
			<DialogTitle class="text-2xl font-bold">Привязка PointAuk</DialogTitle>
			<DialogDescription class="text-base leading-normal font-semibold text-foreground">
				Прежде чем перейти, скройте свой экран, после успешкой привязки обновите страницу поинтаука
			</DialogDescription>
		</DialogHeader>
		<Button
			href="https://pointauc.com"
			target="_blank"
			class="hover:bg-unset bg-foreground font-bold text-background hover:brightness-90"
		>
			Перейти на проинтаук
		</Button>

		<DialogClose
			class="absolute top-4.5 right-3 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-5 stroke-4" />
		</DialogClose>
	</DialogContent>
</Dialog>
