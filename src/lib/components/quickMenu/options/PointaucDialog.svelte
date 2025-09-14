<script lang="ts">
	import HeartIcon from '$lib/components/icons/HeartIcon.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
</script>

<Dialog>
	<DialogTrigger>
		<HeartIcon /> Привязать поинтаук
	</DialogTrigger>
	<DialogContent
		class="w-[550px] bg-primary text-primary-foreground selection:bg-foreground selection:text-background"
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
	</DialogContent>
</Dialog>
