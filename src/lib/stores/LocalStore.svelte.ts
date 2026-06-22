import { untrack } from 'svelte'

let StoreIdCounter = 0

function getStoreId() {
  StoreIdCounter += 1
  return StoreIdCounter
}

type CustomEventData<T> = {
  value: T
  emitterId: number
}

class _LocalStore<T> {
  key: string
  value = $state<T>() as T
  _storeId: number

  constructor(key: string, defaultValue: T | null = null) {
    this.key = key
    this.value = this.loadValue(key, defaultValue)
    this._storeId = getStoreId()

    window.addEventListener(`localStore:${key}`, (event: Event) => {
      const customEvent = event as CustomEvent<CustomEventData<T>>
      if (customEvent.detail.emitterId !== this._storeId) {
        untrack(() => {
          this.value = customEvent.detail.value
        })
      }
    })

    $effect(() => {
      const value = this.value

      localStorage.setItem(this.key, JSON.stringify(value))
      window.dispatchEvent(
        new CustomEvent<CustomEventData<T>>(`localStore:${this.key}`, {
          detail: {
            emitterId: this._storeId,
            value,
          },
        }),
      )
    })
  }

  loadValue(key: string, defaultValue: T | null): T {
    const storedValue = localStorage.getItem(key)
    if (storedValue !== null) {
      try {
        return JSON.parse(storedValue)
      } catch (e) {
        console.error(`Failed to parse stored value for key ${key}`, e)
        return defaultValue as T
      }
    }
    return defaultValue as T
  }
}

export type LocalStore<T> = _LocalStore<T>

export const LocalStore = _LocalStore as unknown as {
  new <T>(key: string, defaultValue: T): LocalStore<T>
  new <T>(key: string): LocalStore<T | null>
}