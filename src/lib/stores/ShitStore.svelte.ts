import { AukusBaseUrl } from '$lib/client'
import {
	addShitApiPlayersAddShitPostMutation,
	kickPlayerApiPlayersKickPostMutation,
	makeShieldApiPlayersMakeShieldPostMutation
} from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation } from '@tanstack/svelte-query'

export class ShitStore {
	addShitQuery = createMutation(() =>
		addShitApiPlayersAddShitPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	makeShieldQuery = createMutation(() =>
		makeShieldApiPlayersMakeShieldPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	kickPlayerQuery = createMutation(() =>
		kickPlayerApiPlayersKickPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)
}

