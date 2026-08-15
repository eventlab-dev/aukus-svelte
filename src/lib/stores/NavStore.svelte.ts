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

		// Check if it's a static page
		if (STATIC_PAGES.has(url as AppUrl)) {
			this.changePage(url as AppUrl, params)
		} else {
			// Handle dynamic pages (like player profiles)
			this.changeDynamicPage(url, params)
		}
	}

	changePage(
		url: AppUrl,
		params: { updateHistory: boolean } = { updateHistory: true }
	) {
		const page = URL_PAGE_MAP[url]
		this.appUrl = url
		this.appPage = page
		if (params.updateHistory) {
			pushState(url, {})
		}
		this.dynamicPage = null
	}

	changeDynamicPage(url: string, params: { updateHistory: boolean } = { updateHistory: true }) {
		this.dynamicPage = url.substring(1)
		this.appPage = MAIN_PAGE
		this.appUrl = pageToUrl(MAIN_PAGE)
		if (params.updateHistory) {
			pushState(url, {})
		}
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
	if (STATIC_PAGES.has(browserPath as AppUrl)) {
		return browserPath as AppUrl
	}
	// For dynamic URLs, return the main page URL
	return '/'
}
