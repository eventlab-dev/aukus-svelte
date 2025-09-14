<script lang="ts">
	import { getCellPosition } from '$lib/mapUtils';

	const { cellId } = $props<{ cellId: number }>();

	const cellPosition = getCellPosition(cellId);
</script>

<div
	class="absolute flex h-[25px] w-[25px] items-center justify-center rounded-xl bg-black text-white"
	style="top: {cellPosition.y + 10}px; left: {cellPosition.x + 10}px"
>
	{cellId}
</div>
