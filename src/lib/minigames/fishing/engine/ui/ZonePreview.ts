import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import { VIEW } from '../config'
import { FISH, type FishSpecies } from '../fish'
import { FIGHT_RADIUS } from '../game/fight'
import { angleDelta } from '../game/fight/angles'
import { FightModel } from '../game/fight/FightModel'
import { RING_SEGMENTS, ringOutline } from '../game/fightRing'
import { zoneArc, zoneInner, zoneOuter, zoneTuning } from '../game/fight/zoneTuning'
import { ZoneClock } from '../game/fightView/zoneClock'
import { drawCounterLock } from '../game/fightView/counterLock'
import { drawZoneWedge } from '../game/fightView/zoneWedge'
import { CURSORS } from '../cursors'
import { clamp } from '../utils'
import { UI } from './palette'

/** The fish the preview fights with: one authored script, shown for real. */
const PREVIEW_FISH_ID = 'barracuda'

/** What the panel's counter tab reads off the preview. */
export interface CounterState {
	/** Seconds left in the grab window; 0 when it is shut. */
	open: number
	/** True while the button is down. */
	held: boolean
	/** The press landed in the band around the dash heading. */
	inWedge: boolean
	/** Length of the drag from the press, in pixels. */
	drag: number
	/** True when a press would land the counter right now. */
	ready: boolean
}

/**
 * A played preview of the dash zone: a real `FightModel` of a barracuda, drawn
 * with the same ring, the same `drawZoneWedge` and the same `ZoneClock` the fight
 * uses.
 *
 * The fish is not an illustration of a dash — it *is* a fight, with the authored
 * script of one species, so the telegraphs, the feints, the real lunge and the
 * grab window arrive when the model says they do. A press inside the band while
 * the window is open is a press on the model itself: the pointer goes to the
 * model, the button goes down, and the model decides.
 */
export class ZonePreview extends Container {
	private readonly g = new Graphics()
	private readonly sprite: Sprite
	private readonly truthZone = new ZoneClock()
	private readonly lieZone = new ZoneClock()
	private readonly fish: FishSpecies
	private model: FightModel
	private time = 0
	/** Seconds the finished fight has been lying there, before a fresh one. */
	private dead = 0
	private truthHeading = 0
	private lieHeading: number | null = null
	private pressAt: { x: number; y: number } | null = null
	private pointerAt: { x: number; y: number } | null = null
	private dragging = false
	private view = { width: 210, height: 158 }

	constructor(texture: Texture, scale: number) {
		super()
		this.fish = FISH.find((entry) => entry.id === PREVIEW_FISH_ID) ?? FISH[0]
		this.model = this.newModel()
		this.sprite = new Sprite(texture)
		this.sprite.anchor.set(0.5)
		this.scale.set(scale)
		this.addChild(this.g, this.sprite)
		this.eventMode = 'static'
		this.cursor = CURSORS.pointer
		this.on('pointerdown', (event: FederatedPointerEvent) =>
			this.press(event.getLocalPosition(this))
		)
		this.on('globalpointermove', (event: FederatedPointerEvent) =>
			this.move(event.getLocalPosition(this))
		)
		this.on('pointerup', () => this.release())
		this.on('pointerupoutside', () => this.release())
		this.draw()
	}

	/** Tell the preview the size of the well it is shown in, for the click target. */
	setViewport(width: number, height: number): void {
		this.view = { width, height }
		this.applyHitArea()
	}

	/** Start a fresh fight, e.g. when the previous one was decided. */
	restart(): void {
		this.model = this.newModel()
		this.truthZone.reset()
		this.lieZone.reset()
		this.pressAt = null
		this.pointerAt = null
		this.dragging = false
		this.dead = 0
		this.draw()
	}

	/** What the counter tab prints. */
	state(): CounterState {
		const press = this.pressAt
		const pointer = this.pointerAt
		let inWedge = false
		let drag = 0
		if (press) {
			const radius = Math.hypot(press.x, press.y)
			inWedge =
				radius >= zoneInner() &&
				radius <= zoneOuter() &&
				Math.abs(angleDelta(Math.atan2(press.y, press.x), this.truthHeading)) <= zoneArc()
			if (pointer) drag = Math.hypot(pointer.x - press.x, pointer.y - press.y)
		}
		const open = this.model.counterOpen
		const ready =
			this.dragging &&
			inWedge &&
			drag >= zoneTuning.counterDrag &&
			open > 0 &&
			this.model.gripValue > 0 &&
			!this.model.isGripLocked
		return {
			open,
			held: this.dragging,
			inWedge,
			drag,
			ready
		}
	}

	/** Advance the fight and the fades by `dt` seconds. */
	update(dt: number): void {
		if (dt > 0) {
			this.time += dt
			if (this.model.isRunning) {
				this.model.update(dt)
				this.stepClocks(dt)
			} else {
				this.dead += dt
				if (this.dead > 0.9) this.restart()
			}
		}
		this.draw()
	}

	/** Redraw the current frame without advancing it — the panel's pause. */
	redraw(): void {
		this.draw()
	}

	// ------------------------------------------------------------- internals

	private newModel(): FightModel {
		const [min, max] = this.fish.weightKg
		// The model clamps its centre to the playfield, so it gets the frame's centre
		// and the preview draws everything relative to that point.
		return new FightModel(this.fish, {
			anchor: { x: VIEW.width / 2, y: VIEW.height / 2 },
			weightKg: (min + max) / 2
		})
	}

	/** The same envelopes the fight view runs. */
	private stepClocks(dt: number): void {
		const model = this.model
		const open = model.counterOpen > 0
		const lie = model.warn > 0 && model.isFeint
		const blocked = model.counterFlashValue > 0
		if (open) this.truthHeading = model.counterHeading
		if (lie) this.lieHeading = model.warnHeading
		this.truthZone.update(dt, open, blocked, zoneTuning.truthTime)
		this.lieZone.update(dt, lie, blocked, zoneTuning.lieTime)
	}

	private press(point: { x: number; y: number }): void {
		if (!this.model.isRunning) return
		this.pressAt = point
		this.pointerAt = point
		this.dragging = true
		const at = this.toFight(point)
		this.model.setPointer(at.x, at.y)
		this.model.setHold(true)
	}

	private move(point: { x: number; y: number }): void {
		if (!this.dragging) return
		this.pointerAt = point
		const at = this.toFight(point)
		this.model.setPointer(at.x, at.y)
	}

	/** The preview draws around its own origin; the model lives around its centre. */
	private toFight(point: { x: number; y: number }): { x: number; y: number } {
		return {
			x: point.x + this.model.centerX,
			y: point.y + this.model.centerY
		}
	}

	private release(): void {
		if (!this.dragging) return
		this.dragging = false
		this.model.setHold(false)
	}

	private draw(): void {
		const g = this.g
		g.clear()
		// The band can be pushed further out than the ring itself, so the whole
		// picture is scaled to keep it inside the well.
		const reach = Math.max(FIGHT_RADIUS, zoneOuter())
		this.scale.set(Math.min(1.2, 74 / reach))
		this.applyHitArea()

		this.strokeRing(g, FIGHT_RADIUS, 1, 0.22)
		this.strokeRing(g, FIGHT_RADIUS - 3, 0, 0.08)
		drawZoneWedge(g, 0, 0, this.truthHeading, this.truthZone.alpha(), this.truthZone.tone(UI.rose))
		if (this.lieHeading !== null && this.lieZone.alpha() > 0) {
			drawZoneWedge(g, 0, 0, this.lieHeading, this.lieZone.alpha(), this.lieZone.tone(UI.violet))
		}
		this.placeFish()
		// The lock and the receipt ring of a landed counter, drawn by the same
		// helpers the fight calls — with the fish standing in for the float, because
		// the preview has no bobber of its own. That is the point of the sample: the
		// ring is judged on the fish here instead of on the water it normally rings.
		if (this.model.counterFlashValue > 0) {
			const lit = clamp(this.model.counterFlashValue / Math.max(0.05, zoneTuning.lockTime))
			drawCounterLock(
				g,
				this.model.fishPoint.x - this.model.centerX,
				this.model.fishPoint.y - this.model.centerY,
				lit
			)
		}
		if (this.model.stunValue > 0) {
			const total = Math.max(0.05, zoneTuning.counterStun)
			const progress = clamp(1 - this.model.stunValue / total)
			g.circle(
				this.model.fishPoint.x - this.model.centerX,
				this.model.fishPoint.y - this.model.centerY,
				zoneTuning.cueSize + zoneTuning.cueGrow * progress
			).stroke({
				width: 1.5,
				color: UI.ice,
				alpha: Math.sin(Math.PI * progress) * 0.75
			})
		}
	}

	/** The barracuda itself, relative to the ring's centre. */
	private placeFish(): void {
		const point = this.model.fishPoint
		const velocity = this.model.fishVelocity
		this.sprite.position.set(point.x - this.model.centerX, point.y - this.model.centerY)
		this.sprite.rotation = Math.max(-0.45, Math.min(0.45, velocity.x / 420))
		const face = velocity.x < -6 ? -1 : 1
		this.sprite.scale.set(face, 1)
		this.sprite.alpha = this.model.isRunning ? 0.95 : Math.max(0, 0.95 - this.dead)
	}

	/** One closed ring outline, wobbled the way the fight's is. */
	private strokeRing(g: Graphics, radius: number, line: number, alpha: number): void {
		const points = ringOutline(0, 0, radius, line, this.time, RING_SEGMENTS)
		g.poly(points).stroke({ width: 1, color: UI.text, alpha })
	}

	/** The click target: the well, converted into the preview's own scale. */
	private applyHitArea(): void {
		const scale = this.scale.x || 1
		const width = this.view.width / scale
		const height = this.view.height / scale
		this.hitArea = new Rectangle(-width / 2, -height / 2, width, height)
	}
}
