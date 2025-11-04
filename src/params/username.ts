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
	| 'vk_user'
	| 'kick_user'
	| 'twitch_user'

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
	'unclebjorn',
	'vk_user',
	'kick_user',
	'twitch_user'
]);

export const match = ((param: string): param is Username => {
	return usernameUrlsSet.has(param as Username);
}) satisfies ParamMatcher;
