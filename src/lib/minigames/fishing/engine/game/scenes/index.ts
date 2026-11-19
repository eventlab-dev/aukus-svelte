import type { AssetBag } from '../../assets'
import type { AreaDef } from '../../areas'
import { FishingScene } from './FishingScene'
import { CoveRenderer } from './cove'
import { PoolRenderer } from './pool'
import { RiverRenderer } from './river'
import type { SceneRenderer } from './types'

export { FishingScene } from './FishingScene'
export type { SceneRenderer } from './types'

/** Builds the scene renderer that belongs to the area. */
export function createFishingScene(area: AreaDef, assets: AssetBag): FishingScene {
	let renderer: SceneRenderer
	switch (area.id) {
		case 'deep':
			renderer = new PoolRenderer(assets, area)
			break
		// "rapids" is the historical id of the third water body; it is the quiet
		// river now, and the id stays so saved progress keeps pointing at it.
		case 'rapids':
			renderer = new RiverRenderer(assets, area)
			break
		default:
			renderer = new CoveRenderer(assets, area)
			break
	}
	return new FishingScene(assets, area, renderer)
}
