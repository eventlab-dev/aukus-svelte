import type { PlayerItem, PlayerMoveType, PlayerStatsItem } from './heyapi/aukus/types.gen'
import type { GameHistoryItem, UserItem } from './heyapi/eventlab/types.gen'

export const Color = {
	greyLight: '#414141',
	greyDark: '#222222',
	greyDarkest: '#121212',
	greyNew: '#CECECE',
	greyText: '#656565',
	greyText2: '#9F9F9F',
	red: '#ff3b30',
	green: '#34C759',
	greenLight: '#00B88C',
	purple: '#AF52DE',
	blue: '#007AFF',
	blueDark: '#5856D6',
	blueLight: '#32ADE6',
	brown: '#A2845E',
	orange: '#E58600',
	pink: '#FF2D55',
	pinkLight: '#ECA3D4',
	white: '#FFFFFF',
	blueTg: '#27a7e7',
	biege: '#AF99DF',
	yellow: '#F2C200'
}

type CustomColorNames = `custom${Capitalize<keyof typeof Color>}`

export type CustomColorOverrides = {
	[K in keyof typeof Color as CustomColorNames]: true
}

export type TableHeaderType<T> = {
	key: keyof T
	name: string
	width: number
}

export type TurnState =
	| 'filling-form'
	| 'form-sent'
	| 'selecting-dice'
	| 'dice-animation'
	| 'dice-results'
	| 'player-map-animation'
	| 'player-win-animation'
	| 'event-completed'
	| null

export type PlayerData = UserItem & PlayerItem & { total_score: number }

export type PlayerMovementState = {
	steps: number
	startCell: number
	rollValues: number[]
	minSteps: number
}

export type CommonGameItem = Omit<GameHistoryItem, 'completion_status'> & {
	completion_status: PlayerMoveType
}

export type StatItem = PlayerStatsItem & {
	username: string
	avatarLink: string
	currentGame: string
	position: number
	total_score: number
	clean_score: number
	color: string
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'very-hard'
