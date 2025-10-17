import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { transliterationMap } from './constants'
import type { BadgeVariant } from './components/ui/badge'
import { renderToHTMLString } from '@tiptap/static-renderer'
import { initExtensions } from './tiptapExtensions/enabledExtensions'
import dompurify from 'dompurify'
import type { PlayerMoveType } from './heyapi/aukus/types.gen'

const enabledExtensions = initExtensions()

export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }

export function formatMs(diffMs: number) {
	const diffS = Math.floor(diffMs / 1000)
	const days = Math.floor(diffS / (60 * 60 * 24))
	const hours = Math.floor((diffS % (60 * 60 * 24)) / (60 * 60))
	const minutes = Math.floor((diffS % (60 * 60)) / 60)
	const seconds = diffS % 60

	// const hoursPadded = String(hours).padStart(2, '0');
	// const minutesPadded = String(minutes).padStart(2, '0');
	// const secondsPadded = String(seconds).padStart(2, '0');

	if (days > 0) {
		if (hours === 0) {
			return `${days}д ${minutes}м`
		}
		return `${days}д ${hours}ч ${minutes}м`
	}

	if (hours === 0) {
		return `${minutes}м ${seconds}с`
	}

	return `${hours}ч ${minutes}м`
}

// Recursive function to generate all combinations of transliterated strings
function generateCombinations(
	variants: string[][],
	index: number,
	current: string,
	results: string[]
) {
	if (index === variants.length) {
		results.push(current)
		return
	}

	// Loop through all possible phonetic variants for the current character
	for (const variant of variants[index]) {
		generateCombinations(variants, index + 1, current + variant, results)
	}
}

// Function to transliterate a Russian string to all possible phonetically similar English strings
export function transliterateRussianToEnglishVariants(russianText: string): string[] {
	const results: string[] = []
	const variants: string[][] = []

	// Convert Russian text into arrays of possible phonetic matches
	for (const char of russianText.toLocaleLowerCase().split('')) {
		const variant = transliterationMap[char]
		if (variant) {
			variants.push([char, ...variant])
		} else {
			variants.push([char])
		}
	}

	// Generate all possible combinations of the transliterations
	generateCombinations(variants, 0, '', results)

	return results
}

export function formatDateTime(timestamp: number, options: { onlyHourMinute?: boolean } = {}) {
	const date = new Date(timestamp)
	const today = new Date()
	const isToday = date.toDateString() === today.toDateString()

	const day = date.toLocaleString('ru-RU', { day: 'numeric' })
	const month = date.toLocaleString('ru-RU', { month: 'long' })
	const monthFixed = month.slice(0, -1) + 'я'

	const hourMinute = date.toLocaleString('ru-RU', {
		hour: '2-digit',
		hour12: false,
		minute: '2-digit'
	})

	if (options.onlyHourMinute) {
		return hourMinute
	}

	return isToday ? `Сегодня ${hourMinute}` : `${day} ${monthFixed} ${hourMinute}`
}

type MoveTypeStyles = {
	text: string
	variant: BadgeVariant
}

export function getMoveTypeStyles(type?: PlayerMoveType): MoveTypeStyles {
	switch (type) {
		case 'completed': {
			return { text: 'Пройдено', variant: 'green' }
		}
		case 'drop': {
			return { text: 'Дроп', variant: 'red' }
		}
		case 'sheikh_moment': {
			return { text: 'Шейх-момент', variant: 'orange' }
		}
		case 'reroll': {
			return { text: 'Реролл', variant: 'blue' }
		}
		case 'movie': {
			return { text: 'Кино', variant: 'default' }
		}
		default: {
			return { text: 'Ошибка', variant: 'default' }
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
	callback: T,
	delayMs: number
): (...args: Parameters<T>) => void {
	let timeoutId: number | null = null

	return (...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		timeoutId = window.setTimeout(() => {
			callback(...args)
			timeoutId = null
		}, delayMs)
	}
}

export function renderToHTML(content: string) {
	if (!content) return ''

	return dompurify.sanitize(
		renderToHTMLString({
			content: JSON.parse(content),
			extensions: enabledExtensions
		}),
		{ ALLOWED_TAGS: ['p', 'img', 'span'] }
	)
}

export function doubleSineEaseOut(t: number) {
	// Apply sine easing twice for extra smooth deceleration
	const firstPass = Math.sin((t * Math.PI) / 2)
	return Math.sin((firstPass * Math.PI) / 2)
}

export function defaultAuth() {
	return localStorage.getItem('auth_token') ?? undefined
}

export function getSkinIconUrl(url: string) {
	// parse the url and insert "icon_" before the filename
	if (!url.includes('aukus4/skins')) {
		return url
	}
	const parts = url.split('/')
	const filename = parts.pop()
	if (!filename) return url
	return [...parts, `icon_${filename}`].join('/')
}

export function normalizeSteps(mapPosition: number, steps: number) {
	const targetPosition = mapPosition + steps
	if (targetPosition < 0) {
		return -mapPosition // Can't go below 0
	}
	if (targetPosition > 100 && mapPosition < 100) {
		return 100 - mapPosition // Can't go above 100
	}
	if (targetPosition > 100 && mapPosition >= 100) {
		return 101
	}
	return steps // Valid move
}
