import { EventlabBaseUrl } from '$lib/client'
import { LONG_REFETCH } from '$lib/constants'
import { authorizeOauthApiOauth2AuthorizePostMutation, listUserIntegrationsApiOauth2IntegrationsGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation, createQuery } from '@tanstack/svelte-query'

type Props = {
	getPlayerSlug: () => string | null
}

export class IntegrationsStore {
	getPlayerSlug: Props['getPlayerSlug'] = () => null

	constructor(props: Props) {
		this.getPlayerSlug = props.getPlayerSlug
	}

	integrationsQuery = createQuery(() => {
		const params = listUserIntegrationsApiOauth2IntegrationsGetOptions({
			baseUrl: EventlabBaseUrl,
			auth: defaultAuth
		})
		params.refetchInterval = LONG_REFETCH
		params.refetchOnWindowFocus = false
		params.enabled = () => this.getPlayerSlug() !== null
		return params
	})

	integrations = $derived(this.integrationsQuery.data)

	starteAuthQuery = createMutation(() =>
		authorizeOauthApiOauth2AuthorizePostMutation({
			baseUrl: EventlabBaseUrl,
			auth: defaultAuth
		})
	)
}
