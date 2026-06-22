import { LocalStore } from './LocalStore.svelte'

export type SnowLevel = 'off' | 'small' | 'big'

export class SnowStore {
	snowState = new LocalStore<SnowLevel>('snowLevel', 'small')

	cycleSnow() {
		switch (this.snowState.value) {
			case 'off':
				this.snowState.value = 'small'
				break
			case 'small':
				this.snowState.value = 'big'
				break
			case 'big':
				this.snowState.value = 'off'
				break
		}
	}

	flakesCount = $derived.by(() => {
		switch (this.snowState.value) {
			case 'small':
				return 50
			case 'big':
				return 150
			default:
				return 0
		}
	})

	snowTooltip = $derived.by(() => {
		switch (this.snowState.value) {
			case 'off':
				return 'Снег выключен'
			case 'small':
				return 'Снег: немного'
			case 'big':
				return 'Снег: много'
		}
	})
}
