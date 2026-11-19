import { FISH_TEXT, type FishText } from '../texts'

/** Typed access to the flavour text of a species. */
export function fishText(id: string): FishText | undefined {
	return (FISH_TEXT as Record<string, FishText>)[id]
}
