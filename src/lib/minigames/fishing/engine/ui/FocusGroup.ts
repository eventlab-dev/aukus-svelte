export interface Focusable {
	setFocused(focused: boolean): void
	activate(): void
}

/**
 * Keyboard navigation helper. A plain list (`columns = 1`) is navigated with
 * up/down (or left/right); grids additionally support horizontal movement.
 *
 * The highlight is a keyboard affordance, not a default state: a panel that
 * opens with one button already outlined reads as an answer that has been
 * given. Nothing is lit until the player navigates with the keyboard, and the
 * first navigation key only reveals the ring where the panel already points.
 */
export class FocusGroup {
	private items: Focusable[] = []
	private columns = 1
	private index = -1
	/** True once the keyboard has been used in this group. */
	private keyboard = false
	/**
	 * Which slots may take the ring. A picker with a closed location hands a
	 * predicate over its cards so the arrow keys step over them instead of
	 * parking the highlight on a choice that cannot be made.
	 */
	private canFocus: (index: number) => boolean = () => true

	onMove?: () => void

	setItems(items: Focusable[], columns = 1, canFocus?: (index: number) => boolean): void {
		this.blur()
		this.items = items
		this.columns = Math.max(1, columns)
		this.index = -1
		this.canFocus = canFocus ?? (() => true)
	}

	get current(): Focusable | null {
		return this.index >= 0 ? (this.items[this.index] ?? null) : null
	}

	get currentIndex(): number {
		return this.index
	}

	/** True once the player has navigated this group with the keyboard. */
	get keyboardActive(): boolean {
		return this.keyboard
	}

	/**
	 * Points the group at an item without lighting it. Panels use this to open
	 * on the current choice; the pointer is never shown a ring it did not ask
	 * for.
	 */
	select(index = 0): void {
		if (this.items.length === 0) return
		const wanted = Math.max(0, Math.min(this.items.length - 1, index))
		const next = this.canFocus(wanted) ? wanted : this.nearestFrom(wanted)
		if (next < 0) return
		if (this.index >= 0 && this.index !== next) {
			this.items[this.index]?.setFocused(false)
		}
		this.index = next
	}

	/**
	 * Closest slot that accepts the ring: the wanted one, else the nearest one
	 * before it, else the nearest one after it.
	 */
	private nearestFrom(index: number): number {
		const before = this.nearest(index, -1)
		return before >= 0 ? before : this.nearest(index, 1)
	}

	/** First slot at or after `from` that accepts the ring, walking by `step`. */
	private nearest(from: number, step: number): number {
		for (let i = from; i >= 0 && i < this.items.length; i += step) {
			if (this.canFocus(i)) return i
		}
		return -1
	}

	/** Points at an item and lights it: a key press asked for the ring. */
	focus(index = 0): void {
		this.keyboard = true
		this.select(index)
		if (this.index >= 0) this.items[this.index].setFocused(true)
	}

	blur(): void {
		if (this.index >= 0) this.items[this.index]?.setFocused(false)
		this.index = -1
	}

	/** Forgets the keyboard state, so a freshly opened panel starts unlit. */
	reset(): void {
		this.blur()
		this.keyboard = false
	}

	move(dx: number, dy: number): void {
		if (this.items.length === 0) return
		if (!this.keyboard) {
			// The first navigation key reveals the ring on the item the panel
			// already points at, or on the first one when it points at nothing.
			this.keyboard = true
			if (this.index < 0) this.select(0)
			this.items[this.index]?.setFocused(true)
			this.onMove?.()
			return
		}
		let next = this.index
		if (this.columns <= 1) {
			if (dx > 0 || dy > 0) next += 1
			if (dx < 0 || dy < 0) next -= 1
		} else {
			if (dx !== 0) {
				const row = Math.floor(this.index / this.columns)
				const col = this.index % this.columns
				const nextCol = col + dx
				if (nextCol >= 0 && nextCol < this.columns) {
					next = Math.min(this.items.length - 1, row * this.columns + nextCol)
				}
			}
			if (dy !== 0) {
				next = Math.max(0, Math.min(this.items.length - 1, this.index + dy * this.columns))
			}
		}
		next = Math.max(0, Math.min(this.items.length - 1, next))
		if (!this.canFocus(next)) {
			// Step over the slots that refuse the ring, in the direction of travel;
			// when nothing is open that way the highlight stays where it is.
			const step =
				this.columns <= 1
					? dx < 0 || dy < 0
						? -1
						: 1
					: dx !== 0
						? Math.sign(dx)
						: Math.sign(dy) * this.columns
			next = this.nearest(next + step, step)
			if (next < 0) return
		}
		if (next !== this.index) {
			this.items[this.index]?.setFocused(false)
			this.index = next
			this.items[this.index].setFocused(true)
			this.onMove?.()
		}
	}

	activate(): void {
		this.items[this.index]?.activate()
	}

	handleKey(event: KeyboardEvent): boolean {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.move(0, -1)
				return true
			case 'ArrowDown':
			case 'KeyS':
				this.move(0, 1)
				return true
			case 'ArrowLeft':
			case 'KeyA':
				this.move(-1, 0)
				return true
			case 'ArrowRight':
			case 'KeyD':
				this.move(1, 0)
				return true
			case 'Enter':
			case 'Space':
			case 'NumpadEnter':
				this.activate()
				return true
			default:
				return false
		}
	}
}
