import { derived } from 'svelte/store'
import { createLocalStore } from './LocalStore.svelte'

export type SnowLevel = 'off' | 'small' | 'big'

export function createSnowStore() {
	const snowState = createLocalStore<SnowLevel>('snowLevel', 'small')

	function cycleSnow() {
		snowState.update((curr) => {
			switch (curr) {
				case 'off':
					return 'small'
				case 'small':
					return 'big'
				case 'big':
					return 'off'
			}
		})
	}

	const flakesCount = derived(snowState, ($snowState) => {
		switch ($snowState) {
			case 'small':
				return 50
			case 'big':
				return 150
			default:
				return 0
		}
	})

	const snowTooltip = derived(snowState, ($snowState) => {
		switch ($snowState) {
			case 'off':
				return 'Снег выключен'
			case 'small':
				return 'Снег: немного'
			case 'big':
				return 'Снег: много'
		}
	})

	return {
		snowState,
		cycleSnow,
		flakesCount,
		snowTooltip
	}
}
