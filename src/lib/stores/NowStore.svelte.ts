import 'temporal-polyfill/global'

export class NowStore {
   nowMs = $state(Temporal.Now.instant().epochMilliseconds)
   nowSeconds = $derived(Math.floor(this.nowMs / 1000))
   interval: ReturnType<typeof setInterval> | null = null
   
   constructor() {
      if (typeof window !== 'undefined') {
         this.interval = setInterval(() => {
            this.nowMs = Temporal.Now.instant().epochMilliseconds
         }, 1000)
      }
   }
   
   destroy() {
      if (this.interval) {
         clearInterval(this.interval)
      }
   }
}
