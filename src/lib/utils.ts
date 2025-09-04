import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { transliterationMap } from "./constants";
import type { BadgeVariant } from "./components/ui/badge";
import type { MoveType } from "./api/aukus/types";

export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function formatMs(diffMs: number) {
	const diffS = Math.floor(diffMs / 1000);
	const days = Math.floor(diffS / (60 * 60 * 24));
	const hours = Math.floor((diffS % (60 * 60 * 24)) / (60 * 60));
	const minutes = Math.floor((diffS % (60 * 60)) / 60);
	const seconds = diffS % 60;

	// const hoursPadded = String(hours).padStart(2, '0');
	// const minutesPadded = String(minutes).padStart(2, '0');
	// const secondsPadded = String(seconds).padStart(2, '0');

	if (days > 0) {
		if (hours === 0) {
			return `${days}д ${minutes}м`;
		}
		return `${days}д ${hours}ч ${minutes}м`;
	}

	if (hours === 0) {
		return `${minutes}м ${seconds}с`;
	}

	return `${hours}ч ${minutes}м`;
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

export function formatDateTime(dateString: string): string {
	const date = new Date(dateString);
	const today = new Date();
	const isToday = date.toDateString() === today.toDateString();
	const timeZone = 'Europe/Moscow';

	const day = date.toLocaleString('ru-RU', { timeZone, day: 'numeric' });
	const month = date.toLocaleString('ru-RU', { timeZone, month: 'long' });
	const monthFixed = month.slice(0, -1) + 'я';

	const hourMinute = date.toLocaleString('ru-RU', {
		timeZone,
		hour: '2-digit',
		hour12: false,
		minute: '2-digit',
	});

	return isToday ? `Сегодня ${hourMinute}` : `${day} ${monthFixed} ${hourMinute}`;
}

type MoveTypeStyles = {
	text: string;
	variant: BadgeVariant;
};

export function getMoveTypeStyles(type?: MoveType): MoveTypeStyles {
	switch (type) {
		case 'completed': {
			return { text: 'Пройдено', variant: 'green' };
		}
		case 'drop': {
			return { text: 'Дроп', variant: 'red' };
		}
		case 'sheikh': {
			return { text: 'Шейх-момент', variant: 'orange' };
		}
		case 'reroll': {
			return { text: 'Реролл', variant: 'blue' };
		}
		case 'movie': {
			return { text: 'Кино', variant: 'default' };
		}
		default: {
			return { text: 'Ошибка', variant: 'default' };
		}
	}
}
