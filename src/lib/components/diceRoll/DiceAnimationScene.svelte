<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { T } from '@threlte/core'
	import { utils, animate } from 'animejs'
	import { HTML } from '@threlte/extras'
	import * as THREE from 'three'
	import { DefaultDiceTexture, DICE_ROLL_ANIMATION_TIME, DiceModelUrl } from '$lib/constants'
	import { GLTFLoader, type GLTF } from 'three/examples/jsm/Addons.js'

	type Vector3 = [number, number, number]
	type ModelParams = {
		position: Vector3
		scale: number
		value: number
		valuePosition: Vector3
	}

	const { turnState, movementStore, eventDataStore, myPlayer } = getAppManagerContext()
	const { myMovementState } = movementStore
	const { skinsById } = eventDataStore

	const diceSkin = $derived.by(() => {
		if ($myPlayer?.equipped_skins) {
			const skins = $myPlayer.equipped_skins
				.map((s) => $skinsById.get(s))
				.filter((s) => s !== undefined)
			const diceSkin = skins.find((s) => s.slot === 'dice')
			return diceSkin ?? null
		}
		return null
	})

	const modelsParams: ModelParams[] = $derived.by(() => {
		if ($turnState === 'dice-animation' || $turnState === 'dice-results') {
			const n = $myMovementState.rollValues.length
			const baseZ = -5
			const spread = 7
			const centerOffset = (n - 1) / 2

			return $myMovementState.rollValues.map((v, i) => {
				const x = (i - centerOffset) * spread
				const z = baseZ - Math.abs(i - centerOffset) * 0.5 // push side dice slightly back
				const scale = 2.8 - Math.abs(i - centerOffset) * 0.2

				return {
					position: [x, 0, z] as const,
					scale,
					value: v,
					valuePosition: [x - 0.8, 1, z + 1] as const
				}
			})
		}
		return []
	})

	let rotation = $state({ x: 0, y: 0, z: 0 })

	const loader = new GLTFLoader()
	let loadedMesh: THREE.Mesh | null = $state(null)

	$effect(() => {
		const textureUrl = diceSkin?.image_url ?? DefaultDiceTexture
		loader.load(DiceModelUrl, (gltf: GLTF) => {
			// Assume the mesh is the first child of the scene
			const mesh = gltf.scene.children[0] as THREE.Mesh

			// Load the paintable texture
			const texture: THREE.Texture = new THREE.TextureLoader().load(textureUrl)
			texture.flipY = false
			texture.needsUpdate = true

			const newMaterial = new THREE.MeshBasicMaterial({
				map: texture
				// flatShading: true
			})

			// Apply the texture
			if (Array.isArray(mesh.material)) {
				mesh.material = (mesh.material as THREE.Material[]).map(() => newMaterial.clone())
			} else {
				mesh.material = newMaterial
			}
			loadedMesh = mesh
		})
	})

	$effect(() => {
		if ($turnState === 'dice-animation') {
			const xRotation = utils.random(70, 100)
			const yRotation = utils.random(70, 100)
			const zRotation = utils.random(70, 100)

			animate(rotation, {
				x: [0, xRotation],
				y: [0, yRotation],
				z: [0, zRotation],
				duration: DICE_ROLL_ANIMATION_TIME,
				easing: 'easeInOutQuad'
			})
		}
	})

	const totalSum = $derived($myMovementState.rollValues.reduce((a, b) => a + b, 0))
</script>

{#if modelsParams.length > 0}
	<!-- <T.DirectionalLight position={[0, 10, 10]} intensity={1} /> -->
	<!-- <T.AmbientLight intensity={0} /> -->

	{#if $turnState === 'dice-results' && modelsParams.length > 1}
		<HTML position={[-3, 6, -5]}>
			<div
				class="pointer-events-none rounded-md bg-black px-4 py-2 text-center text-3xl font-bold whitespace-nowrap text-white select-none"
			>
				Всего: {totalSum}
			</div>
		</HTML>
	{/if}

	{#if loadedMesh}
		{#each modelsParams as params, idx (idx)}
			<T
				is={loadedMesh.clone()}
				position={params.position}
				rotation={[rotation.x, rotation.y, rotation.z]}
				scale={params.scale}
			/>

			<!-- Black outline mesh (slightly bigger, drawn inside-out) -->
			<T
				is={loadedMesh?.clone()}
				position={params.position}
				rotation={[rotation.x, rotation.y, rotation.z]}
				scale={params.scale + 0.05}
			>
				<T.MeshStandardMaterial color="black" side={THREE.BackSide} flatShading={true} />
			</T>

			{#if $turnState === 'dice-results'}
				<HTML position={params.valuePosition}>
					<div
						class="pointer-events-none rounded-md bg-black/70 px-2 py-1 text-center text-5xl font-bold text-white select-none"
					>
						{params.value}
					</div>
				</HTML>
			{/if}
		{/each}
	{/if}
{/if}
