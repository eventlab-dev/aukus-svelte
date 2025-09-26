import { createClient } from '@hey-api/openapi-ts'

createClient({
	input: 'http://localhost:8300/openapi.json',
	output: 'src/lib/heyapi/eventlab',
	plugins: ['@tanstack/svelte-query']
})

createClient({
	input: 'http://localhost:8301/openapi.json',
	output: 'src/lib/heyapi/aukus',
	plugins: ['@tanstack/svelte-query']
})
