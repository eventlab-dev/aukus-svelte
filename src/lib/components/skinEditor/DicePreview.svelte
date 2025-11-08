<script lang="ts">
	import { DefaultDiceTexture, DiceModelUrl } from '$lib/constants'
	import { Canvas, T } from '@threlte/core'
	import { GLTFLoader, type GLTF } from 'three/examples/jsm/Addons.js'
	import * as THREE from 'three'

	const loader = new GLTFLoader()

	const textureUrl = DefaultDiceTexture

	let loadedMesh: THREE.Mesh | null = $state(null)

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

	let rotation = $state({ x: 0, y: 0, z: 0 })

	$effect(() => {
		const interval = setInterval(() => {
			rotation.y += 0.01
			rotation.x += 0.005
		}, 10)

		return () => clearInterval(interval)
	})
</script>

<div class="h-[100px] w-[100px] rounded">
	<Canvas toneMapping={THREE.NoToneMapping} colorSpace={THREE.LinearSRGBColorSpace}>
		<T.Group scale={1.5}>
			{#if loadedMesh}
				<T
					is={loadedMesh.clone()}
					position={[0, 0, 0]}
					rotation={[rotation.x, rotation.y, rotation.z]}
					scale={1.7}
				/>
			{/if}
		</T.Group>
	</Canvas>
</div>
