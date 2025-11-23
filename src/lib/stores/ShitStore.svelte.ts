import { AukusBaseUrl } from '$lib/client'
import {
	addShitApiPlayersAddShitPostMutation,
	kickPlayerApiPlayersKickPostMutation,
	makeShieldApiPlayersMakeShieldPostMutation
} from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation } from '@tanstack/svelte-query'

export function createShitStore() {
	const addShit = createMutation(
		addShitApiPlayersAddShitPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	const makeShield = createMutation(
		makeShieldApiPlayersMakeShieldPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	const kickPlayer = createMutation(
		kickPlayerApiPlayersKickPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	return {
		addShit,
		makeShield,
		kickPlayer
	}
}
