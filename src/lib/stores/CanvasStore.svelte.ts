import { AukusBaseUrl } from '$lib/client'
import { LONG_REFETCH } from '$lib/constants'
import {
	getCanvasFilesApiCanvasPlayerSlugGetOptions,
	updateCanvasApiCanvasPlayerSlugUpdatePutMutation,
	uploadCanvasImageApiCanvasPlayerSlugUploadPostMutation
} from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import { SvelteSet } from 'svelte/reactivity'

export class CanvasStore {
	editMode = $state(false)
	selectedImageId = $state<number | null>(null)
	updatedImages = $state<CanvasFile[]>([])
	deletedImages = $state<number[]>([])

	playerSlug = $state('')
	queryClient = useQueryClient()

	canvasQuery = createQuery(() => ({
		...getCanvasFilesApiCanvasPlayerSlugGetOptions({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth,
			path: { player_slug: this.playerSlug }
		}),
		refetchOnWindowFocus: false,
		refetchInterval: LONG_REFETCH,
		enabled: !!this.playerSlug
	}))

	updateCanvasMutation = createMutation(() =>
		updateCanvasApiCanvasPlayerSlugUpdatePutMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	uploadImageMutation = createMutation(() =>
		uploadCanvasImageApiCanvasPlayerSlugUploadPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	savedImages = $derived(this.canvasQuery.data?.files || [])

	displayImages = $derived.by(() => {
		const updatedIds = new SvelteSet(this.updatedImages.map((img) => img.id))
		const deletedIds = new SvelteSet(this.deletedImages)
		const filteredSaved = this.savedImages.filter(
			(img) => !updatedIds.has(img.id) && !deletedIds.has(img.id)
		)
		return [...filteredSaved, ...this.updatedImages]
	})

	selectedImage = $derived(
		this.displayImages.find((img) => img.id === this.selectedImageId) || null
	)

	selectImage(image: CanvasFile | null) {
		this.selectedImageId = image?.id ?? null
	}

	deleteImage(imageId: number) {
		this.updatedImages = this.updatedImages.filter((img) => img.id !== imageId)
		this.deletedImages = [...this.deletedImages, imageId]
		if (this.selectedImageId === imageId) {
			this.selectedImageId = null
		}
	}

	async saveCanvasChanges() {
		await this.updateCanvasMutation.mutateAsync({
			body: {
				files: this.updatedImages,
				delete_ids: this.deletedImages
			},
			path: { player_slug: this.playerSlug }
		})

		await this.queryClient.invalidateQueries({
			queryKey: getCanvasFilesApiCanvasPlayerSlugGetOptions({
				baseUrl: AukusBaseUrl,
				auth: defaultAuth,
				path: { player_slug: this.playerSlug }
			}).queryKey
		})

		await this.canvasQuery.refetch()

		this.discardCanvasChanges()
	}

	discardCanvasChanges() {
		this.updatedImages = []
		this.deletedImages = []
	}

	updateImage(img: CanvasFile) {
		this.updatedImages = this.updatedImages.filter((image) => image.id !== img.id)
		this.updatedImages.push(img)
	}

	canvasWidth = $derived.by(() => {
		return 2500
		let maxLeftX = 0
		let maxRightX = 0
		for (const img of this.displayImages) {
			if (img.x < 0) {
				if (-img.x > maxLeftX) {
					maxLeftX = -img.x
				}
			} else {
				const rightX = img.x + img.width
				if (rightX > maxRightX) {
					maxRightX = rightX
				}
			}
		}
		return Math.max(maxLeftX, maxRightX) * 2
	})
}
