export class NowStore {
   nowMs = $state(Date.now())
   nowSeconds = $derived(Math.floor(this.nowMs / 1000))
   interval: ReturnType<typeof setInterval> | null = null
   
   constructor() {
      if (typeof window !== 'undefined') {
         this.interval = setInterval(() => {
            this.nowMs = Date.now()
         }, 1000)
      }
   }
   
   destroy() {
      if (this.interval) {
         clearInterval(this.interval)
      }
   }
}
