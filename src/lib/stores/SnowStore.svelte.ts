import { LocalStore } from './LocalStore.svelte'

export type SnowLevel = 'off' | 'small' | 'big'

export const snowStore = new LocalStore<SnowLevel>('snowLevel', 'small')

export function cycleSnow() {
	if (snowStore.value === 'off') {
		snowStore.value = 'small'
	} else if (snowStore.value === 'small') {
		snowStore.value = 'big'
	} else {
		snowStore.value = 'off'
	}
}

export function getFlakesCount(level: SnowLevel): number {
	switch (level) {
		case 'small':
			return 50
		case 'big':
			return 150
		default:
			return 0
	}
}

export function getSnowTooltip(level: SnowLevel): string {
	switch (level) {
		case 'off':
			return 'Снег выключен'
		case 'small':
			return 'Снег: немного'
		case 'big':
			return 'Снег: много'
	}
}

