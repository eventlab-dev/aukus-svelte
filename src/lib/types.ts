import type { PlayerItem } from './heyapi/aukus/types.gen'
import type { UserItem } from './heyapi/eventlab/types.gen'

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

export type PlayerUrl =
	| 'lasqa'
	| 'segall'
	| 'praden'
	| 'browjey'
	| 'uselessmouth'
	| 'roadhouse'
	| 'melharucos'
	| 'maddyson'
	| 'krabick'
	| 'vovapain'
	| 'timofey'
	| 'keliq_q'
	| 'unclebjorn'

export const ColorByUrlHandle: { [key in PlayerUrl]: string } = {
	lasqa: Color.blue,
	segall: Color.green,
	praden: Color.brown,
	browjey: Color.orange,
	uselessmouth: Color.pink,
	roadhouse: Color.purple,
	melharucos: Color.blueLight,
	maddyson: Color.yellow,
	krabick: Color.blueDark,
	vovapain: Color.red,
	timofey: Color.greenLight,
	keliq_q: Color.biege,
	unclebjorn: Color.pinkLight
}

export const ColorNameByUrlHandle: {
	[key in PlayerUrl]: CustomColorNames
} = {
	lasqa: 'customBlue',
	segall: 'customGreen',
	praden: 'customBrown',
	browjey: 'customOrange',
	uselessmouth: 'customPink',
	roadhouse: 'customPurple',
	melharucos: 'customBlueLight',
	maddyson: 'customYellow',
	krabick: 'customBlueDark',
	vovapain: 'customRed',
	timofey: 'customGreenLight',
	keliq_q: 'customBiege',
	unclebjorn: 'customPinkLight'
}

export type TableHeaderType<T> = {
	key: keyof T
	name: string
	width: number
}

export type TurnState =
	| 'filling-form'
	| 'selecting-dice'
	| 'dice-animation'
	| 'dice-results'
	| 'player-animation'
	| 'event-completed'
	| null

export type PlayerData = UserItem & PlayerItem & { total_score: number }

export type PlayerMovementState = {
	steps: number
	startCell: number
	rollValues: number[]
}
