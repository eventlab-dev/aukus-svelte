<script lang="ts">
	import { getCellPosition } from '$lib/mapUtils';

	const { cellId } = $props<{ cellId: number }>();

	const cellPosition = getCellPosition(cellId);
</script>

<div class="absolute z-40" style="top: {cellPosition.y + 10}px; left: {cellPosition.x + 10}px">
	#{cellId}
</div>
