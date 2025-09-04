import type { ParamMatcher } from '@sveltejs/kit';

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

const playerUrlsSet = new Set<PlayerUrl>([
	'lasqa',
	'segall',
	'praden',
	'browjey',
	'uselessmouth',
	'roadhouse',
	'melharucos',
	'maddyson',
	'krabick',
	'vovapain',
	'timofey',
	'keliq_q',
	'unclebjorn'
]);

export const match = ((param: string): param is PlayerUrl => {
	return playerUrlsSet.has(param as PlayerUrl);
}) satisfies ParamMatcher;
