import type { ParamMatcher } from '@sveltejs/kit';

export type Username =
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

const usernameUrlsSet = new Set<Username>([
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

export const match = ((param: string): param is Username => {
	return usernameUrlsSet.has(param as Username);
}) satisfies ParamMatcher;
