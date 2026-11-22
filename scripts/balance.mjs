/**
 * Runs the balance probe (`balance-model.ts`) with the repository's own Vite.
 *
 * ```sh
 * node scripts/balance.mjs
 * ```
 *
 * The probe is a normal TypeScript module that imports the shipped roll, so it
 * cannot drift from the game the way a hand-copied model would. Vite bundles it
 * into a temp folder and this script imports and runs the result.
 */
import { build } from 'vite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const entry = fileURLToPath(new URL('./balance-model.ts', import.meta.url))
const outDir = await mkdtemp(join(tmpdir(), 'fishing-balance-'))

try {
	await build({
		configFile: false,
		logLevel: 'silent',
		build: {
			outDir,
			emptyOutDir: false,
			minify: false,
			target: 'node20',
			lib: { entry, formats: ['es'], fileName: () => 'model.mjs' }
		}
	})
	await import(pathToFileURL(join(outDir, 'model.mjs')).href)
} finally {
	await rm(outDir, { recursive: true, force: true })
}
