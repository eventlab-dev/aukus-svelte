import 'temporal-polyfill/global'

export class TimeStore {
	now = $state(Temporal.Now.instant())
	nowSeconds = $derived(this.now.epochMilliseconds / 1000)

	constructor() {
		setInterval(() => {
			this.now = Temporal.Now.instant()
		}, 1000)
	}

  intlLocale = 'ru-RU'

	format(instant: Temporal.Instant, options?: Intl.DateTimeFormatOptions) {
		const dateTimeFormat = new Intl.DateTimeFormat(this.intlLocale, {timeZone: 'Europe/Moscow', ...options})
		return dateTimeFormat.format(instant.epochMilliseconds)
	}

  formatNow(options?: Intl.DateTimeFormatOptions) {
    return this.format(this.now, options)
  }
}
