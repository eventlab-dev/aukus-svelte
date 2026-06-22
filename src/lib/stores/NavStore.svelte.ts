export type AppPage =
	| 'map'
	| 'rules'
	| 'about'
	| 'stats'
	| 'multistream'
	| 'presentation'
	| 'login'
	| 'calculator'

const URL_PAGE_MAP: Record<string, AppPage> = {
	'/': 'map',
	'/rules': 'rules',
	'/donaters': 'rules',
	'/about': 'about',
	'/stats': 'stats',
	'/streams': 'multistream',
	'/presentation': 'presentation',
	'/login': 'login',
	'/calc': 'calculator',
}

const STATIC_PAGES = new Set(Object.keys(URL_PAGE_MAP)) as Set<AppUrl>

type AppUrl = keyof typeof URL_PAGE_MAP

function pageToUrl(page: AppPage): AppUrl {
	const pair = Object.entries(URL_PAGE_MAP).find(([, p]) => p === page)
	return pair ? (pair[0] as AppUrl) : '/'
}

const MAIN_PAGE = URL_PAGE_MAP['/']

export class NavStore {
	appPage: AppPage = $state(getAppPageFromUrl() ?? MAIN_PAGE)
	appUrl: AppUrl = $state(getAppUrlFromUrl() ?? pageToUrl(MAIN_PAGE))
	dynamicPage: string | null = $state(null)

	closePage() {
		this.changePage(MAIN_PAGE)
	}

	changePage(page: AppPage) {
		const url = pageToUrl(page)
		this.appPage = page
		this.appUrl = url
		this.dynamicPage = null
		history.pushState({ page, url }, '', url)
	}

	changeUrl(url: AppUrl) {
		const newPage = URL_PAGE_MAP[url] || 'not-found'
		if (newPage === this.appPage) {
			history.pushState({ url }, '', url)
			this.appUrl = url
			return
		}
		this.changePage(newPage)
	}

	changeDynamicPage(page: string) {
		this.dynamicPage = page
		this.appPage = MAIN_PAGE
		this.appUrl = pageToUrl(MAIN_PAGE)
		history.pushState({ page }, '', `/${page}`)
	}

	sync() {
		const appPage = getAppPageFromUrl()
		if (appPage) {
			this.changePage(appPage)
		} else {
			this.changeDynamicPage(window.location.pathname.substring(1))
		}
	}

	constructor() {
		this.sync()
		window.addEventListener('popstate', () => {
			this.sync()
		})
	}
}

function getAppPageFromUrl(): AppPage | null {
	const path = getAppUrlFromUrl()
	if (!path) return null
	return URL_PAGE_MAP[path]
}

function getAppUrlFromUrl(): AppUrl | null {
	const browserPath = window.location.pathname
	if (STATIC_PAGES.has(browserPath as AppUrl)) {
		return browserPath as AppUrl
	}
	return null
}
