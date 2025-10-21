import { AukusBaseUrl } from '$lib/client'
import {
	getCanvasFilesApiCanvasPlayerSlugGetOptions,
	updateCanvasApiCanvasPlayerSlugUpdatePutMutation,
	uploadCanvasImageApiCanvasPlayerSlugUploadPostMutation
} from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation, createQuery } from '@tanstack/svelte-query'
import { SvelteSet } from 'svelte/reactivity'
import { derived, get, writable } from 'svelte/store'

export function createCanvasStore() {
	const editMode = writable(false)
	const selectedImageId = writable<number | null>(null)
	const updatedImages = writable<CanvasFile[]>([])
	const deletedImages = writable<number[]>([])

	const playerSlug = writable('')

	const canvasQuery = createQuery(
		derived(playerSlug, ($playerSlug) => {
			return getCanvasFilesApiCanvasPlayerSlugGetOptions({
				baseUrl: AukusBaseUrl,
				auth: defaultAuth,
				path: { player_slug: $playerSlug }
			})
		})
	)

	const updateCanvasMutation = createMutation(
		updateCanvasApiCanvasPlayerSlugUpdatePutMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	const uploadImageMutation = createMutation(
		uploadCanvasImageApiCanvasPlayerSlugUploadPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	const savedImages = derived(canvasQuery, ($canvasQuery) => $canvasQuery.data?.files || [])

	const displayImages = derived(
		[savedImages, updatedImages, deletedImages],
		([$savedImages, $updatedImages, $deletedImages]) => {
			const updatedIds = new SvelteSet($updatedImages.map((img) => img.id))
			const deletedIds = new SvelteSet($deletedImages)
			const filteredSaved = $savedImages.filter(
				(img) => !updatedIds.has(img.id) && !deletedIds.has(img.id)
			)
			return [...filteredSaved, ...$updatedImages]
		}
	)

	const selectedImage = derived(
		[displayImages, selectedImageId],
		([$displayImages, $selectedImageId]) =>
			$displayImages.find((img) => img.id === $selectedImageId) || null
	)

	function selectImage(image: CanvasFile | null) {
		selectedImageId.set(image?.id ?? null)
	}

	function deleteImage(imageId: number) {
		updatedImages.update((images) => images.filter((img) => img.id !== imageId))
		deletedImages.update((ids) => {
			const filtered = ids.filter((id) => id !== imageId)
			return [...filtered, imageId]
		})
		const currentSelected = get(selectedImage)
		if (currentSelected?.id === imageId) {
			selectedImageId.set(null)
		}
	}

	async function saveCanvasChanges() {
		const _playerSlug = get(playerSlug)
		const _updatedImages = get(updatedImages)
		const _deletedImages = get(deletedImages)
		return get(updateCanvasMutation).mutateAsync({
			body: {
				files: _updatedImages,
				delete_ids: _deletedImages
			},
			path: { player_slug: _playerSlug }
		})
	}

	function discardCanvasChanges() {
		updatedImages.set([])
		deletedImages.set([])
	}

	function updateImage(img: CanvasFile) {
		updatedImages.update((images) => {
			const index = images.findIndex((i) => i.id === img.id)
			if (index !== -1) {
				images[index] = img
			} else {
				images.push(img)
			}
			return images
		})
	}

	return {
		playerSlug,
		canvasQuery,
		updatedImages,
		updateImage,
		uploadImageMutation,
		editMode,
		selectImage,
		selectedImage,
		displayImages,
		deleteImage,
		updateCanvasMutation,
		saveCanvasChanges,
		discardCanvasChanges
	}
}
