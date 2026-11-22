/**
 * Interface palette: deep indigo glass, periwinkle controls and ice-white
 * primary actions, taken from the stream dashboard this game is skinned after.
 *
 * The painted world keeps its own palette (`C` in `config.ts`): the lake, the
 * snow, the fish and the props are art and must not change when the interface
 * is re-skinned. Keeping the two palettes apart is also what lets the UI adopt
 * a colour family that the winter scenes never used.
 *
 * Contrast is part of the contract, not a taste: white copy (7.15:1) and muted
 * copy (5.06:1) sit on `panel`; dark navy labels sit on the light periwinkle
 * and ice surfaces (5.30:1 and 13.11:1). Do not put white copy on
 * `periwinkle` — it is 2.5:1 and unreadable at the 6–11 px this UI uses.
 */
export const UI = {
	/** Outlines, hard pixel shadows, scrims and text strokes. */
	ink: 0x141a3d,
	/** Page chrome behind and around the canvas. */
	night: 0x232a56,
	/** Flat full-screen dimming under menus. */
	scrim: 0x1a2148,
	/** Window and HUD-card fill. */
	panel: 0x3f4b91,
	/** Raised surface: chips, fader tracks, keycaps. */
	panelAlt: 0x4b59a4,
	/** Hover/pressed fills on dark surfaces and empty codex slots. */
	surface: 0x5d6dbb,
	/** Lavender controls, tabs and dividers. */
	periwinkle: 0x8299e6,
	periwinkleLight: 0xa3b5f0,
	periwinklePressed: 0x7b91e2,
	/** Highlights along the top edge of a pixel frame. */
	periwinklePale: 0xc9d4f8,
	/** Ice-white primary buttons, the selected tab and the focus ring. */
	primary: 0xeef3ff,
	primaryHover: 0xffffff,
	primaryPressed: 0xcfdaf9,
	/** Main copy on dark surfaces. */
	text: 0xeef2ff,
	/** Secondary copy on dark surfaces. */
	textMuted: 0xc2cdf0,
	/** Copy on light controls (periwinkle, ice-white, mint). */
	textOnBright: 0x1c2554,
	/** Success, the luck band and the rare-fish glyph. */
	mint: 0x6fd6b0,
	/** Information, rare tier, the grip liquid and the counter's cue ring. */
	ice: 0x8fd8ff,
	/** Warning, the landing cue and clear weather. */
	amber: 0xffc46b,
	/** Filled danger surfaces with white copy. */
	danger: 0xc04358,
	dangerHover: 0xc94d61,
	dangerPressed: 0xa9364a,
	/** Thin danger strokes over dark water, and the срыв bar's fill. */
	rose: 0xff6f80,
	/** Feint telegraph; must never read as red. */
	violet: 0xc08cf0,
	/** Mythic rarity, a first catch and the platinum frame. */
	legendary: 0xffd98a,
	/** Ambience channel in the audio mixer. */
	teal: 0x7fd6c0
} as const
