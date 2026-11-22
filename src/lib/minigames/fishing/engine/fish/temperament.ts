import type { Temperament } from '../types'
import type { FishSpecies } from './species'

/**
 * Fixed temperament per species. This used to be rolled for every fight, which
 * made the codex's "character" line flavour text instead of a real hint. It is
 * authored next to the roster so a species always fights the same way.
 */
export const FISH_TEMPERAMENT: Record<string, Temperament> = {
	// The shell is not in the roster, but its fight reads the same table.
	shell: 'stubborn',
	bluegill: 'calm',
	tilapia: 'calm',
	carp: 'stubborn',
	perch: 'aggressive',
	largemouthbass: 'stubborn',
	smallmouthbass: 'skittish',
	pike: 'aggressive',
	walleye: 'skittish',
	cod: 'stubborn',
	angelfish: 'stubborn',
	catfish: 'stubborn',
	koi: 'stubborn',
	minnow: 'skittish',
	capelin: 'skittish',
	chub: 'skittish',
	flounder: 'calm',
	rainbowtrout: 'skittish',
	mudskipper: 'skittish',
	shrimp: 'skittish',
	seabass: 'aggressive',
	salmon: 'stubborn',
	eel: 'skittish',
	tigerfish: 'aggressive',
	sturgeon: 'stubborn',
	anchovy: 'skittish',
	sardine: 'skittish',
	mackerel: 'aggressive',
	haddock: 'calm',
	grouper: 'stubborn',
	redsnapper: 'aggressive',
	lionfish: 'aggressive',
	butterflyfish: 'stubborn',
	clownfish: 'skittish',
	oceansunfish: 'calm',
	tuna: 'stubborn',
	barracuda: 'aggressive',
	halibut: 'stubborn',
	oarfish: 'skittish',
	marlin: 'aggressive',
	swordfish: 'aggressive'
}

export function temperamentFor(fish: FishSpecies): Temperament {
	return FISH_TEMPERAMENT[fish.id] ?? 'calm'
}
