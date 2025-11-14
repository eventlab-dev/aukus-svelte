export async function fetchFrontVersion(): Promise<{ version: string }> {
	const response = await fetch('/version.json?ts=' + Date.now());
	return response.json();
}

