import { browser } from '$app/environment'
import { goto } from '$app/navigation'

export const ssr = false

export const load = () => {
	if (browser) {
		const isMobile = window.matchMedia('(max-width: 768px)').matches
		if (isMobile) {
			goto('/')
			return
		}
	}
}

