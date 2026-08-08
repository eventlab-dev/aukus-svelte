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
}

const STATIC_PAGES = new Set(Object.keys(URL_PAGE_MAP)) as Set<AppUrl>

type AppUrl = keyof typeof URL_PAGE_MAP

type PageParams = {
	playerSlug?: string
}

function pageToUrl(page: AppPage): AppUrl {
	const pair = Object.entries(URL_PAGE_MAP).find(([, p]) => p === page)
	return pair ? (pair[0] as AppUrl) : '/'
}

const MAIN_PAGE = URL_PAGE_MAP['/']

export class NavStore {
	appPage: AppPage = $state(getAppPageFromUrl() ?? MAIN_PAGE)
	appUrl: AppUrl = $state(getAppUrlFromUrl() ?? pageToUrl(MAIN_PAGE))
	dynamicPage: string | null = $state(null)
	pageParams: PageParams = $state({})

	closePage() {
		this.changePage(MAIN_PAGE)
	}

	navigate(url: string) {
		// Check if it's a static page
		if (STATIC_PAGES.has(url as AppUrl)) {
			this.changePage(URL_PAGE_MAP[url as AppUrl])
		} else {
			// Handle dynamic pages (like player profiles)
			this.changeDynamicPage(url.substring(1))
		}
	}

	changePage(page: AppPage, params: { changeUrl?: boolean; pageParams?: PageParams } = { changeUrl: true }) {
		const url = pageToUrl(page)
		this.appPage = page
		this.pageParams = params.pageParams ?? {}
		if (params.changeUrl) {
			this.appUrl = url
			history.pushState({ page, url }, '', url)
		}
		this.dynamicPage = null
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
		this.navigate(window.location.pathname)
		// const appPage = getAppPageFromUrl()
		// if (appPage) {
		// 	this.changePage(appPage, {changeUrl: false})
		// } else {
		// 	this.changeDynamicPage(window.location.pathname.substring(1))
		// }
	}

	constructor() {
		this.sync()
		window.addEventListener('popstate', () => {
			this.sync()
		})
		
		// Intercept anchor tag clicks for internal navigation
		window.addEventListener('click', (e) => {
			const anchor = (e.target as Element)?.closest?.('a')
			if (!anchor) return
			
			const href = anchor.getAttribute('href')
			if (!href) return
			
			// Check if it's an internal URL
			if (href.startsWith('/') && !href.startsWith('//')) {
				// Check if it's a known static page or dynamic page
				const isInternal = STATIC_PAGES.has(href as AppUrl) || href.startsWith('/')
				
				if (isInternal) {
					// Check if the link has target="_blank" or other special attributes
					if (anchor.target === '_blank' || anchor.rel === 'noopener noreferrer') {
						return // Let external links open normally
					}
					
					e.preventDefault()
					this.navigate(href)
				}
			}
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
