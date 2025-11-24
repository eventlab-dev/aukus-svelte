<script lang="ts">
	import type { SkinItem } from '$lib/heyapi/aukus/types.gen'
	import { getSkinIconUrl } from '$lib/utils'

	type Props = {
		skin: SkinItem
	}

	let { skin }: Props = $props()
</script>

{#if skin.slot === 'dice'}
	<div class="dice-preview-container">
		<div class="dice-preview" style="background-image: url('{skin.image_url}');"></div>
	</div>
{:else}
	<img src={getSkinIconUrl(skin.image_url)} alt="skin" class="h-full object-contain" />
{/if}

<style>
	.dice-preview-container {
		width: 100%; /* fit the button width */
		height: 100%; /* fit the button height */
		/*overflow: hidden;*/
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.dice-preview {
		width: 75px;
		height: 90px;
		background-repeat: no-repeat;

		/* scale full image so cropped region fits container */
		/*background-size: 200px auto;*/
		background-size: 300px auto;

		/* shift image so cropped region is visible */
		/*background-position: 0px -23px;*/
		background-position: 0px -54px;

		overflow: hidden;
	}
</style>
