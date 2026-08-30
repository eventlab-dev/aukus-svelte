import { AukusBaseUrl, EventlabBaseUrl } from '$lib/client'
import {
	createPlayerMoveApiPlayersMovePostMutation,
	finishPlayerMoveApiPlayersMoveFinishPostMutation,
	getUnlockableSkinsApiPlayersUnlockableSkinsGetOptions,
	setPlayerSkinsApiPlayersSkinsPostMutation,
	unlockSkinApiPlayersUnlockSkinPostMutation
} from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { makeDiceRollApiDiceRollsPostMutation } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation, createQuery } from '@tanstack/svelte-query'
import type { ReactiveGetter } from '$lib/types'

type Props = {
	/** ReactiveGetter — must be called inside $derived/$effect/createQuery */
	getIsPlayer: ReactiveGetter<boolean>
}

export class PlayerStore {
	getIsPlayer: ReactiveGetter<boolean> = () => true

	constructor(props?: Props) {
		if (props?.getIsPlayer) {
			this.getIsPlayer = props.getIsPlayer
		}
	}

	saveMoveForm = createMutation(() =>
		createPlayerMoveApiPlayersMovePostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	finishMove = createMutation(() =>
		finishPlayerMoveApiPlayersMoveFinishPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	rollDice = createMutation(() =>
		makeDiceRollApiDiceRollsPostMutation({
			baseUrl: EventlabBaseUrl,
			auth: defaultAuth
		})
	)

	setSkins = createMutation(() =>
		setPlayerSkinsApiPlayersSkinsPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	unlockableSkinsQuery = createQuery(() => ({
		...getUnlockableSkinsApiPlayersUnlockableSkinsGetOptions({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		}),
		enabled: () => this.getIsPlayer(),
		refetchOnWindowFocus: false
	}))

	unlockableSkins = $derived(this.unlockableSkinsQuery.data?.skins ?? [])

	unlockSkinQuery = createMutation(() =>
		unlockSkinApiPlayersUnlockSkinPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)
}
