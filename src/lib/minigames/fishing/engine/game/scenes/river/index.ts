import type { SceneRenderer } from '../types'
import { RiverMotion } from './RiverMotion'

export class RiverRenderer extends RiverMotion implements SceneRenderer {}
export { RiverRenderer as default }
