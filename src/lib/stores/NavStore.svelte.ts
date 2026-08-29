import { pushState } from "$app/navigation"

export type AppPage =
	| 'map'
	| 'rules'
	| 'about'
	| 'stats'
	| 'streams'
	| 'presentation'
	| 'login'
	| 'calculator'
	| 'wheels'
	| 'achievements'
	| 'history'
	| 'streams'
	| 'profile'

const URL_PAGE_MAP: Record<string, AppPage> = {
	'/': 'map',
	'/rules': 'rules',
	'/donaters': 'rules',
	'/about': 'about',
	'/stats': 'stats',
	'/streams': 'streams',
	'/presentation': 'presentation',
	'/login': 'login',
	'/calc': 'calculator',
	'/wheels': 'wheels',
	'/achievements': 'achievements',
	'/history': 'history',
	'/profile': 'profile'
}

const STATIC_PAGES = new Set(Object.keys(URL_PAGE_MAP)) as Set<AppUrl>

export type AppSubpage = string

function parseUrl(url: string): { base: AppUrl | null; subpage: AppSubpage | null } {
	if (STATIC_PAGES.has(url as AppUrl)) {
		return { base: url as AppUrl, subpage: null }
	}
	for (const base of STATIC_PAGES) {
		if (url.startsWith(base + '/')) {
			return { base: base as AppUrl, subpage: url.slice(base.length + 1) }
		}
	}
	return { base: null, subpage: null }
}

function getSubpageFromUrl(): AppSubpage | null {
	return parseUrl(window.location.pathname).subpage
}

export type AppUrl = keyof typeof URL_PAGE_MAP

type PageParams = {
	playerSlug?: string
}

function pageToUrl(page: AppPage): AppUrl {
	const pair = Object.entries(URL_PAGE_MAP).find(([, p]) => p === page)
	return pair ? (pair[0] as AppUrl) : '/'
}

const MAIN_PAGE = URL_PAGE_MAP['/']

export class NavStore {
	appPage: AppPage = $state(getAppPageFromUrl())
	appUrl: AppUrl = $state(getAppUrlFromUrl())
	dynamicPage: string | null = $state(null)
	subpage: AppSubpage | null = $state(getSubpageFromUrl())
	pageParams: PageParams = $state({})

	closePage() {
		this.navigate('/')
	}

	navigate(
		url: string,
		params: { updateHistory: boolean, pageParams?: PageParams } = { updateHistory: true }
	) {
		if (params.pageParams) {
			this.pageParams = params.pageParams
		}

		// Check if it's a static page or a subpage of one (e.g. /profile/integrations)
		const parsed = parseUrl(url)
		if (parsed.base) {
			this.appUrl = parsed.base
			this.appPage = URL_PAGE_MAP[parsed.base]
			this.subpage = parsed.subpage
			this.dynamicPage = null
			if (params.updateHistory) {
				pushState(url, {})
			}
			return
		}

		// Handle dynamic pages (like player profiles)
		this.changeDynamicPage(url, params)
	}

	changeDynamicPage(url: string, params: { updateHistory: boolean } = { updateHistory: true }) {
		this.dynamicPage = url.substring(1)
		this.appPage = MAIN_PAGE
		this.appUrl = pageToUrl(MAIN_PAGE)
		if (params.updateHistory) {
			pushState(url, {})
		}
		this.subpage = null
	}

	sync() {
		this.navigate(window.location.pathname, {updateHistory: false})
	}

	constructor() {
		// Intercept anchor tag clicks for internal navigation
		window.addEventListener('click', (e) => {
			const anchor = (e.target as Element)?.closest?.('a')
			if (!anchor) return

			const href = anchor.getAttribute('href')
			if (!href) return

			// Check if it's an internal URL
			if (href.startsWith('/') && !href.startsWith('//')) {
				// Check if the link has target="_blank" or other special attributes
				if (anchor.target === '_blank' || anchor.rel === 'noopener noreferrer') {
					return // Let external links open normally
				}

				e.preventDefault()
				this.navigate(href, {updateHistory: true})
			}
		})
	}
}

function getAppPageFromUrl(): AppPage {
	const path = getAppUrlFromUrl()
	return URL_PAGE_MAP[path]
}

function getAppUrlFromUrl(): AppUrl {
	const browserPath = window.location.pathname
	// Static pages and their subpages resolve to their base URL
	const parsed = parseUrl(browserPath)
	if (parsed.base) {
		return parsed.base
	}
	// For dynamic URLs, return the main page URL
	return '/'
}
