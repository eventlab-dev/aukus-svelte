export type AppPage =
	| 'map'
	| 'rules'
	| 'about'
	| 'stats'
	| 'multistream'
	| 'not-found'
	| 'presentation'

const URL_PAGE_MAP: Record<string, AppPage> = {
	'/': 'map',
	'/rules': 'rules',
	'/donaters': 'rules',
	'/about': 'about',
	'/stats': 'stats',
	'/streams': 'multistream',
	'/not-found': 'not-found',
	'/presentation': 'presentation'
}

type AppUrl = keyof typeof URL_PAGE_MAP

function pageToUrl(page: AppPage): AppUrl {
	const pair = Object.entries(URL_PAGE_MAP).find(([, p]) => p === page)
	return pair ? (pair[0] as AppUrl) : '/not-found'
}

const MAIN_PAGE = URL_PAGE_MAP['/']

export class NavStore {
	app_page: AppPage = $state(getAppPageFromUrl())
	app_url: AppUrl = $state(getAppUrlFromUrl())

	closePage() {
		this.changePage(MAIN_PAGE)
	}

	changePage(page: AppPage) {
		if (page === this.app_page) return
		const url = pageToUrl(page)
		this.app_page = page
		this.app_url = url
		history.pushState({ page }, '', url)
	}

	changeUrl(url: AppUrl) {
		const newPage = URL_PAGE_MAP[url] || 'not-found'
		if (newPage === this.app_page) {
			history.pushState({ url }, '', url)
			this.app_url = url
			return
		}
		this.changePage(newPage)
	}

	sync() {
		this.app_page = getAppPageFromUrl()
		this.app_url = getAppUrlFromUrl()
		if (this.app_page === 'not-found') {
			this.changePage(MAIN_PAGE)
		}
	}

	constructor() {
		this.sync()
		window.addEventListener('popstate', () => {
			this.sync()
		})
	}
}

function getAppPageFromUrl(): AppPage {
	const path = getAppUrlFromUrl()
	return URL_PAGE_MAP[path] || 'not-found'
}

function getAppUrlFromUrl(): AppUrl {
	const browserPath = window.location.pathname
	const url = Object.keys(URL_PAGE_MAP).find((key) => key === browserPath) || '/not-found'
	return url as AppUrl
}
