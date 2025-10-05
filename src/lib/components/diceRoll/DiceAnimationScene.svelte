<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { T, useLoader } from '@threlte/core'
	import { utils, animate } from 'animejs'
	import { HTML } from '@threlte/extras'
	import * as THREE from 'three'
	import { DICE_ROLL_ANIMATION_TIME } from '$lib/constants'

	type Vector3 = [number, number, number]
	type ModelParams = {
		position: Vector3
		scale: number
		value: number
		valuePosition: Vector3
	}

	const { turnState, movementStore } = getAppManagerContext()
	const { movementState } = movementStore

	const modelsParams: ModelParams[] = $derived.by(() => {
		if ($turnState === 'dice-animation' || $turnState === 'dice-results') {
			if ($movementState.rollValues.length === 1) {
				return [
					{
						position: [0, 0, -5] as const,
						scale: 3,
						value: $movementState.rollValues[0],
						valuePosition: [-0.8, 1, -5] as const
					}
				]
			}
			if ($movementState.rollValues.length === 2) {
				return [
					{
						position: [-5, 0, -5] as const,
						scale: 3,
						value: $movementState.rollValues[0],
						valuePosition: [-6, 1, -5] as const
					},
					{
						position: [5, 0, -5] as const,
						scale: 3,
						value: $movementState.rollValues[1],
						valuePosition: [4.5, 1, -5] as const
					}
				]
			}
			if ($movementState.rollValues.length === 3) {
				return [
					{
						position: [-7, 0, -5] as const,
						scale: 2.5,
						value: $movementState.rollValues[0],
						valuePosition: [-8.2, 1, -5] as const
					},
					{
						position: [0, 0, -5] as const,
						scale: 2.8,
						value: $movementState.rollValues[1],
						valuePosition: [-0.8, 1, -5] as const
					},
					{
						position: [7, 0, -5] as const,
						scale: 2.5,
						value: $movementState.rollValues[2],
						valuePosition: [6.5, 1, -5] as const
					}
				]
			}
		}
		return []
	})

	let rotation = $state({ x: 0, y: 0, z: 0 })

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

	const texture = useLoader(THREE.TextureLoader).load('/texture1.jpg')

	const totalSum = $derived($movementState.rollValues.reduce((a, b) => a + b, 0))
</script>

{#if modelsParams.length > 0}
	<T.DirectionalLight position={[0, 10, 10]} intensity={1} />
	<T.AmbientLight intensity={0.1} />

	{#if $turnState === 'dice-results' && modelsParams.length > 1}
		<HTML position={[-3, 6, -5]}>
			<div
				class="pointer-events-none rounded-md bg-black px-4 py-2 text-center text-3xl font-bold whitespace-nowrap text-white select-none"
			>
				Всего: {totalSum}
			</div>
		</HTML>
	{/if}

	{#each modelsParams as params, idx (idx)}
		<!-- Main red dodecahedron -->
		<T.Mesh
			rotation={[rotation.x, rotation.y, rotation.z]}
			position={params.position}
			scale={params.scale}
		>
			<T.DodecahedronGeometry />
			<T.MeshStandardMaterial flatShading={true} map={$texture} color="green" />
		</T.Mesh>

		<!-- Black outline mesh (slightly bigger, drawn inside-out) -->
		<T.Mesh
			rotation={[rotation.x, rotation.y, rotation.z]}
			position={params.position}
			scale={params.scale + 0.05}
		>
			<T.DodecahedronGeometry />
			<T.MeshBasicMaterial color="black" side={THREE.BackSide} />
		</T.Mesh>
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
