import { Assets, Rectangle, Texture } from 'pixi.js'
import { FISH } from './config'
import { PEARLS } from './fish/pearls'
import { FONT_OPTIONS, currentFont } from './fonts'
import { HELP_PAGES } from './texts'
import type { HelpPageId } from './texts'
import type { CursorTextures } from './cursors'
import { shellTexture } from './game/pearl/art'

export interface AssetBag {
	/** 4x4 character sheet, row-major, 32px frames. */
	angler: Texture[]
	trees: Texture[]
	bushes: Texture[]
	sign: Texture
	/** 8×4 sheet of 64px rowboat variants. */
	boat: Texture[]
	/** Mouse with a pressed left button, for the cast prompt. */
	mouse: Texture
	/**
	 * 16×16 interface tiles: a dark outline with the light glyph inside, mapped
	 * to the interface palette so they sit with the pause and codex marks.
	 * `close` is tile_0016 (the X of the windows' title row, redrawn at the
	 * interface's 12 px body), `fullscreen` is
	 * tile_0023 (the two corner arrows opening the frame up).
	 */
	close: Texture
	fullscreen: Texture
	/**
	 * Touch chip marks, cut from the two 16 px sheets the project supplies:
	 * the rod (with its line and float) for the cast, the plain hook for the
	 * landing. Both are 16×16 frames of `rod-sheet.png` and `baits-sheet.png`.
	 */
	rod: Texture
	hook: Texture
	fish: Record<string, Texture>
	/** 16×16 sprites of the twelve pearl varieties. */
	pearls: Record<string, Texture>
	cursors: CursorTextures
}

/**
 * Help screenshots are 96 KB of WebP for four pages that are only visible
 * behind the «Как играть» screen. They are loaded on demand (and warmed up
 * while the menu is idle) instead of sitting on the boot path.
 *
 * Two sets, one per input: the desktop stills show the power bar, the grip
 * gauge and the mouse pointer, none of which a phone has. The touch set is the
 * same four lessons shot on a phone frame — the cast chip in the corner, the
 * stick under the left thumb, the dash sector on the pad — so a manual opened
 * on a phone never shows a mouse or a control that is not there.
 *
 * Both sets live on the CDN like the rest of the art: `<base>/cast.webp` for the
 * mouse and `<base>/touch/cast.webp` for a finger, named after the lesson.
 */
function helpUrl(base: string, page: HelpPageId, touch: boolean): string {
	return `${base}/${touch ? 'touch/' : ''}${page}.webp`
}

const helpTextures = new Map<string, Texture>()

/** Loads one help page, cached for the session. */
export async function loadHelpTexture(
	base: string,
	page: HelpPageId,
	touch = false
): Promise<Texture> {
	const key = `${touch ? 'touch:' : 'mouse:'}${page}`
	const cached = helpTextures.get(key)
	if (cached) return cached
	try {
		const texture = await Assets.load<Texture>(helpUrl(base, page, touch))
		helpTextures.set(key, texture)
		return texture
	} catch (error) {
		console.warn(`[fishing] missing help page ${page}`, error)
		return Texture.WHITE
	}
}

/** Warms the whole help set during idle time, never on the boot path. */
export function prefetchHelpPages(base: string, touch = false): Promise<Texture[]> {
	return Promise.all(HELP_PAGES.map((page) => loadHelpTexture(base, page.id, touch)))
}

async function loadFonts(base: string): Promise<boolean> {
	await Promise.allSettled(
		FONT_OPTIONS.flatMap((option) =>
			option.faces.map(async (face) => {
				const font = new FontFace(
					option.family,
					`url("${base}/fonts/${face.file}") format("${face.format}")`,
					{
						weight: face.weight ?? '400',
						style: 'normal',
						display: 'block',
						unicodeRange: face.unicodeRange
					}
				)
				await font.load()
				document.fonts.add(font)
			})
		)
	)
	await document.fonts.ready
	return document.fonts.check(`16px "${currentFont().family}"`)
}

function frame(sheet: Texture, x: number, y: number, width: number, height: number): Texture {
	return new Texture({
		source: sheet.source,
		frame: new Rectangle(x, y, width, height)
	})
}

/** One 16×16 cell of an icon sheet, or the sheet itself when it is too small. */
function iconFrame(sheet: Texture | undefined, column: number, row: number): Texture {
	const size = 16
	if (!sheet) return Texture.WHITE
	if (sheet.width < (column + 1) * size || sheet.height < (row + 1) * size) {
		return sheet
	}
	return frame(sheet, column * size, row * size, size, size)
}

type FallbackKind = 'fish' | 'person' | 'plant' | 'rock'

function fallbackTexture(color: number, size: number, kind: FallbackKind): Texture {
	const canvas = document.createElement('canvas')
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext('2d')
	if (!ctx) return Texture.WHITE
	const hex = `#${color.toString(16).padStart(6, '0')}`
	const dark = `#${Math.max(0, color - 0x2a2a2a)
		.toString(16)
		.padStart(6, '0')}`
	ctx.imageSmoothingEnabled = false
	const px = Math.max(1, Math.floor(size / 16))
	const rect = (x: number, y: number, w: number, h: number, fill: string) => {
		ctx.fillStyle = fill
		ctx.fillRect(x * px, y * px, w * px, h * px)
	}
	if (kind === 'fish') {
		rect(4, 5, 8, 6, hex)
		rect(3, 6, 1, 4, dark)
		rect(1, 5, 3, 2, dark)
		rect(1, 9, 3, 2, dark)
		rect(9, 6, 1, 1, '#f5ffe8')
		rect(6, 3, 4, 1, dark)
	} else if (kind === 'person') {
		rect(11, 3, 10, 9, '#ffae70')
		rect(10, 2, 12, 3, '#2b2b45')
		rect(9, 11, 14, 13, '#e64539')
		rect(12, 24, 3, 6, '#2b2b45')
		rect(17, 24, 3, 6, '#2b2b45')
		rect(20, 0, 1, 20, '#ab5130')
	} else if (kind === 'plant') {
		rect(5, 13, 6, 3, dark)
		rect(6, 6, 4, 8, hex)
		rect(2, 9, 4, 5, dark)
		rect(10, 8, 4, 6, dark)
		rect(4, 3, 8, 5, hex)
	} else if (kind === 'rock') {
		rect(3, 7, 10, 7, hex)
		rect(5, 5, 6, 3, hex)
		rect(3, 12, 10, 2, dark)
	}
	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'nearest'
	return texture
}

/**
 * Loads the boot art.
 *
 * `cursors` is passed in instead of being requested here: the page hides the
 * system pointer over the canvas, so the game has to paint its own from the
 * first frames. The caller starts that request before this one and mounts the
 * overlay as soon as it lands, while the rest of the art is still arriving.
 */
export async function loadGameAssets(
	base: string,
	onProgress: (progress: number) => void,
	cursors: Promise<CursorTextures>
): Promise<AssetBag> {
	onProgress(0.02)

	const fishList = FISH.map((fish) => ({
		id: fish.id,
		url: `${base}/fish/${fish.id}.png`,
		tint: fish.tint
	}))

	const textureEntries: Array<{
		key: string
		url: string
		fallback: () => Texture
	}> = [
		{
			key: 'angler',
			url: `${base}/angler.png`,
			fallback: () => fallbackTexture(0xe64539, 32, 'person')
		},
		{
			key: 'tree-a',
			url: `${base}/tree-a.png`,
			fallback: () => fallbackTexture(0x63ab3f, 48, 'plant')
		},
		{
			key: 'tree-b',
			url: `${base}/tree-b.png`,
			fallback: () => fallbackTexture(0x63ab3f, 48, 'plant')
		},
		{
			key: 'tree-c',
			url: `${base}/tree-c.png`,
			fallback: () => fallbackTexture(0x63ab3f, 48, 'plant')
		},
		{
			key: 'bush-a',
			url: `${base}/bush-a.png`,
			fallback: () => fallbackTexture(0x3b7d4f, 16, 'plant')
		},
		{
			// CC0 art from Kenney's «Input Prompts Pixel»; see CREDITS.md.
			key: 'mouse',
			url: `${base}/mouse-lmb.png`,
			fallback: () => Texture.WHITE
		},
		{
			// The interface's own tiles: the outline, the light glyph and its grey
			// shade only take the palette's ink, ice and periwinkle-pale, so they
			// sit beside the pause bars and the codex book. The close is tile_0016
			// redrawn at the 12 px body those marks use — the pack's glyph fills its
			// whole canvas and read a size above everything else — so it keeps two
			// pixels of air inside the 16 px box; the fullscreen tile keeps its own
			// 1 px margin.
			key: 'ui-close',
			url: `${base}/tile_0016.png`,
			fallback: () => Texture.WHITE
		},
		{
			key: 'ui-fullscreen',
			url: `${base}/tile_0023.png`,
			fallback: () => Texture.WHITE
		},
		{
			// The project's own chip marks: a three-frame rod sheet and a bait sheet
			// of hooks. Only one 16 px frame of each is used (see `iconFrame`).
			key: 'rod',
			url: `${base}/rod-sheet.png`,
			fallback: () => Texture.WHITE
		},
		{
			key: 'baits',
			url: `${base}/baits-sheet.png`,
			fallback: () => Texture.WHITE
		},
		{
			// Pearl set 1: twelve hand-drawn 16 px sprites on a 4×3 sheet, in
			// `PEARLS` order. The set is one 16 px cell per variety, so the sheet is
			// exactly the twelve varieties and nothing else.
			key: 'pearls-sheet',
			url: `${base}/pearls-sheet.png`,
			fallback: () => fallbackTexture(0xf3e6cf, 16, 'rock')
		},
		{
			key: 'sign',
			url: `${base}/sign.png`,
			fallback: () => fallbackTexture(0xcf752b, 16, 'rock')
		},
		{
			key: 'boat',
			url: `${base}/boat.png`,
			fallback: () => fallbackTexture(0x4c6885, 64, 'rock')
		},
		...fishList.map((fish) => ({
			key: `fish:${fish.id}`,
			url: fish.url,
			fallback: () => fallbackTexture(fish.tint, 16, 'fish')
		}))
	]

	// Fonts and textures are independent: start both now. Awaiting the font
	// first used to put a 230 KB TTF in front of every other request.
	const fontPromise = loadFonts(base)
	const loaded = new Map<string, Texture>()
	let done = 0

	// The loader walked this list one `await` at a time. Every texture is tiny,
	// so the cost was pure latency: on a 150 ms-RTT phone the ~50 files meant
	// seconds of dead waiting. A small pool keeps the worker busy without
	// flooding it, and the progress bar still advances once per file.
	await mapLimit(textureEntries, LOAD_CONCURRENCY, async (entry) => {
		try {
			const texture = await Assets.load<Texture>(entry.url)
			// Every sprite in the game is pixel art, and the world is scaled up to
			// the host size (2.5× at 1200×675) on top of the per-sprite scales.
			// Pixi samples textures linearly by default, which turns those few
			// texels into a soft mush; nearest keeps the pixels square.
			texture.source.scaleMode = 'nearest'
			loaded.set(entry.key, texture)
		} catch (error) {
			console.warn(`[fishing] missing texture ${entry.url}`, error)
			loaded.set(entry.key, entry.fallback())
		}
		done += 1
		// The bar is the only reading here: the caption under it names the stage of
		// the boot, and the boot layer derives it from this number (see
		// `GameBootLayer`). A file name is not a progress report.
		onProgress(0.05 + (done / textureEntries.length) * 0.95)
	})

	await fontPromise

	const anglerSheet = loaded.get('angler') ?? Texture.WHITE
	const angler: Texture[] = []
	if (anglerSheet.width >= 128 && anglerSheet.height >= 128) {
		for (let row = 0; row < 4; row += 1) {
			for (let col = 0; col < 4; col += 1) {
				angler.push(frame(anglerSheet, col * 32, row * 32, 32, 32))
			}
		}
	} else {
		for (let index = 0; index < 16; index += 1) angler.push(anglerSheet)
	}

	const fish: Record<string, Texture> = {}
	for (const fishItem of fishList) {
		fish[fishItem.id] = loaded.get(`fish:${fishItem.id}`) ?? Texture.WHITE
	}
	// The shell is not a roster species, but the fight, the flight and the
	// reveal all look it up through `assets.fish` like any other catch.
	fish.shell = shellTexture()

	// The pearl sheet is cut in the same order as `PEARLS`, four cells per row,
	// so a rebalance or rename never has to touch the art mapping.
	const pearlSheet = loaded.get('pearls-sheet') ?? Texture.WHITE
	const pearls: Record<string, Texture> = {}
	const pearlCell = 16
	if (pearlSheet.width >= pearlCell * 4 && pearlSheet.height >= pearlCell * 3) {
		PEARLS.forEach((pearl, index) => {
			const column = index % 4
			const row = Math.floor(index / 4)
			pearls[pearl.id] = frame(
				pearlSheet,
				column * pearlCell,
				row * pearlCell,
				pearlCell,
				pearlCell
			)
		})
	} else {
		for (const pearl of PEARLS) pearls[pearl.id] = pearlSheet
	}

	const boatSheet = loaded.get('boat') ?? Texture.WHITE
	const boat: Texture[] = []
	if (boatSheet.width >= 64 && boatSheet.height >= 64) {
		for (let row = 0; row < 4; row += 1) {
			for (let col = 0; col < 8; col += 1) {
				boat.push(frame(boatSheet, col * 64, row * 64, 64, 64))
			}
		}
	} else {
		boat.push(boatSheet)
	}

	const cursorTextures = await cursors
	onProgress(1)

	return {
		angler,
		trees: [
			loaded.get('tree-a') ?? Texture.WHITE,
			loaded.get('tree-b') ?? Texture.WHITE,
			loaded.get('tree-c') ?? Texture.WHITE
		],
		bushes: [loaded.get('bush-a') ?? Texture.WHITE],
		sign: loaded.get('sign') ?? Texture.WHITE,
		boat,
		mouse: loaded.get('mouse') ?? Texture.WHITE,
		close: loaded.get('ui-close') ?? Texture.WHITE,
		fullscreen: loaded.get('ui-fullscreen') ?? Texture.WHITE,
		// Rod frame 1 is the rod with its line and float — the one that reads as a
		// cast. The catch is the baited hook (row 1, column 1): the sheet's bare
		// hooks are drawn as a single curve that at 40 px reads as a worm, while the
		// float-and-hook cell says "tackle" and shows the hook itself.
		rod: iconFrame(loaded.get('rod'), 1, 0),
		hook: iconFrame(loaded.get('baits'), 1, 1),
		fish,
		pearls,
		cursors: cursorTextures
	}
}

/** How many textures the loader keeps in flight at once. */
const LOAD_CONCURRENCY = 8

/**
 * Runs `task` over `items` with at most `limit` promises in flight, preserving
 * the input order of the results. A bounded pool is enough here: the list is
 * small, and the point is only to overlap the per-file request latency.
 */
async function mapLimit<T, R>(
	items: readonly T[],
	limit: number,
	task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
	const results = new Array<R>(items.length)
	let next = 0
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			const index = next
			next += 1
			results[index] = await task(items[index], index)
		}
	})
	await Promise.all(workers)
	return results
}
