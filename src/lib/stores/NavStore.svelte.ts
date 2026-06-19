export type AppPage = 'map' | 'rules' | 'about' | 'stats' | 'multistream'

export class NavStore {
    current_page: AppPage = $state('map')

    closePage() {
        this.current_page = 'map'
    }
}
