import { createClient } from '@hey-api/openapi-ts'

createClient({
	input: 'http://localhost:8094/openapi.json',
	output: 'src/lib/heyapi/eventlab',
	plugins: ['@tanstack/svelte-query']
})

createClient({
	input: 'http://localhost:8093/openapi.json',
	output: 'src/lib/heyapi/aukus',
	plugins: ['@tanstack/svelte-query']
})
