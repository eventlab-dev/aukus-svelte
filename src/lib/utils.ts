import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DifficultyTitle, LastMapPosition } from './constants'
import type { BadgeVariant } from './components/ui/badge'
import { renderToHTMLString } from '@tiptap/static-renderer'
import { initExtensions } from './tiptapExtensions/enabledExtensions'
import dompurify from 'dompurify'
import type { PlayerMoveItem, PlayerMoveType, PlayerStatsItem } from './heyapi/aukus/types.gen'
import type { JSONContent } from '@tiptap/core'
import type { CommonGameItem } from './types'

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

export function formatDateTime(timestamp: number, options: { onlyHourMinute?: boolean } = {}) {
	const date = new Date(timestamp * 1000)
	const today = new Date()
	const isToday = date.toDateString() === today.toDateString()

	const hourMinute = date.toLocaleString('ru-RU', {
		hour: '2-digit',
		hour12: false,
		minute: '2-digit'
	})

	if (options.onlyHourMinute) {
		return hourMinute
	}

	if (isToday) {
		return `Сегодня ${hourMinute}`
	}

	const day = date.toLocaleString('ru-RU', { day: 'numeric' })
	const month = date.toLocaleString('ru-RU', { month: 'long' })
	const monthFixed = month.slice(0, -1) + 'я'

	const year = date.getFullYear()
	const currentYear = today.getFullYear()

	if (year !== currentYear) {
		return `${day} ${monthFixed} ${year}`
	}

	return `${day} ${monthFixed} ${hourMinute}`
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

function safeText(text: string) {
	return text?.normalize('NFC') ?? ''
}

export function renderToHTML(content: string) {
	if (!content) return ''

	let parsed: Node | JSONContent
	try {
		parsed = JSON.parse(content)
	} catch {
		parsed = {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: safeText(content) }]
				}
			]
		}
	}

	if (typeof parsed === 'string') {
		parsed = {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: safeText(content) }]
				}
			]
		}
	}

	return dompurify.sanitize(
		renderToHTMLString({
			content: parsed,
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
	if (targetPosition > LastMapPosition && mapPosition < LastMapPosition) {
		return LastMapPosition - mapPosition // Can't go above 101
	}
	if (targetPosition > LastMapPosition && mapPosition >= LastMapPosition) {
		return 102
	}
	return steps // Valid move
}

function cellRow(position: number) {
	if (position >= 100) return 11
	return Math.floor((position - 1) / 10) + 1
}

export function getPlayerScore(stats: PlayerStatsItem) {
	// («Пройденные игры до 15ч» * 1 + «Пройденные игры до 30ч» * 1,5 + «Пройденные игры от 30ч» * 2 - дропнутые игры)*ряд
	const row = cellRow(stats.map_position)
	const score =
		(stats.games_0_4 * 0.5 +
			stats.games_5_10 * 1 +
			stats.games_11_16 * 1.5 +
			stats.games_17_24 * 2 +
			stats.games_25_40 * 3 +
			stats.games_40_plus * 4 +
			stats.games_dropped * 2 -
			stats.sheikh_moments * 2) *
			row +
		stats.first_achievements * 3 +
		stats.regular_achievements * 3
	return Math.max(0, Math.floor(score))
}

export function getPlayerScoreDescription(stats: PlayerStatsItem) {
	const row = cellRow(stats.map_position)
	return [
		`Игры 0-4: ${stats.games_0_4} * 0.5`,
		`Игры 5-10: ${stats.games_5_10} * 1`,
		`Игры 11-16: ${stats.games_11_16} * 1.5`,
		`Игры 17-24: ${stats.games_17_24} * 2`,
		`Игры 25-39: ${stats.games_25_40} * 3`,
		`Игры 40+: ${stats.games_40_plus} * 4`,
		`Дропы: -${stats.games_dropped} * 2`,
		`Шейх-дропы: -${stats.sheikh_moments} * 2`,
		`Ряд: ${row}`,
		`Первые ачивки: ${stats.first_achievements}`,
		`Ачивки: ${stats.regular_achievements}`,
		`Всего: (${stats.games_0_4 * 0.5} + ${stats.games_5_10 * 1} + ${stats.games_11_16 * 1.5} + ${stats.games_17_24 * 2} + ${stats.games_25_40 * 3} + ${stats.games_40_plus * 4}  - ${stats.games_dropped * 2} - ${stats.sheikh_moments * 2}) * ${row} + ${stats.first_achievements} * 3 + ${stats.regular_achievements} * 3`
	]
}

export function formatDuration(timestamp: number, params: { includeSeconds?: boolean } = {}) {
	const totalSeconds = Math.floor(timestamp)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60
	if (!params.includeSeconds) {
		return `${hours}ч ${minutes}м`
	}
	return `${hours}ч ${minutes}м ${seconds}с`
}

export function playerMoveToCommonGame(move: PlayerMoveItem): CommonGameItem {
	return {
		id: move.id,
		player_name: move.player_slug,
		event_name: 'aukus4',
		game_title: move.item_title,
		completion_status: move.type,
		timestamp: move.created_at,
		difficulty: DifficultyTitle[move.difficulty_level],
		review: move.item_review,
		rating: `${move.item_rating}/10`,
		game_id: move.game_id,
		game_time: move.item_duration,
		game_cover: move.cover_image_url ?? '',
		game_link: ''
	}
}

export function uniqBy<T, K>(arr: T[], fn: (item: T) => K): T[] {
	const seen = new Set<K>()
	return arr.filter((item) => {
		const key = fn(item)
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

export function getConfirmationText(): string {
	const options = ['Круто', 'Тупа топ', 'Я рад', 'Спасибо', 'Ахуеньчик', 'Согласен']
	return options[Math.floor(Math.random() * options.length)]
}
