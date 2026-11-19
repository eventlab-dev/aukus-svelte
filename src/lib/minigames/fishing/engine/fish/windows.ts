import type { TimeWindow } from '../types'

/** Minutes from midnight, for the authored bite windows. */
export const at = (hour: number, minute = 0): number => hour * 60 + minute

/** `win(5, 8)` is 05:00–08:00; a window may wrap past midnight. */
export const win = (fromHour: number, toHour: number): TimeWindow => ({
	from: at(fromHour),
	to: at(toHour)
})
