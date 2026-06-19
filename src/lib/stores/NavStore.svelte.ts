export type AppPage = 'map' | 'rules' | 'about' | 'stats' | 'multistream' | 'not-found'

const MAIN_PAGE: AppPage = 'map'

export class NavStore {
    current_page: AppPage = $state(getPageFromUrl())

    closePage() {
        this.navigate(MAIN_PAGE)
    }

    navigate(page: AppPage) {
        if (page === this.current_page) return
        if (page === MAIN_PAGE) {
            history.pushState({ page }, '', '/')
            this.current_page = page
            return
        }
        this.current_page = page
        history.pushState({ page }, '', `/${page}`)
    }

    sync() {
        this.current_page = getPageFromUrl()
        if (this.current_page === 'not-found') {
            this.navigate(MAIN_PAGE)
        }
    }

    constructor() {
        this.sync()
        window.addEventListener('popstate', () => {
            this.sync()
        })
    }
}


function getPageFromUrl(): AppPage {
    const path = window.location.pathname
    console.log({path})
    switch (path) {
        case '/':
            return MAIN_PAGE
        case '/rules':
            return 'rules'
        case '/about':
            return 'about'
        case '/stats':
            return 'stats'
        case '/multistream':
            return 'multistream'
        default:
            return 'not-found'
    }
}