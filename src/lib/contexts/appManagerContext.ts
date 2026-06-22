import { getAppManager, type AppManager } from '$lib/stores/AppManager.svelte';

export function getAppManagerContext(): AppManager {
	return getAppManager();
}
