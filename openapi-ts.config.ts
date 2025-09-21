import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
	input: 'http://localhost:8300/openapi.json',
	output: 'src/lib/heyapi',
	plugins: ['@tanstack/svelte-query']
})
