import { getContext, setContext } from 'svelte';

type CollapsibleContextType = {
	isCollapsed: boolean;
	toggleCollapse: () => void;
	close: () => void;
	open: () => void;
}

const appKey = Symbol('collapsible');

export function setCollapsibleContext(value: CollapsibleContextType) {
	setContext(appKey, value);
}

export function getCollapsibleContext(): CollapsibleContextType {
	return getContext(appKey) as CollapsibleContextType;
}
