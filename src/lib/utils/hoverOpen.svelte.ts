import { onDestroy } from 'svelte'

// Shared hover-open state for popovers that open on mouseenter and close
// with a small delay on mouseleave. Replaces the hand-rolled
// `open + closeTimeout` pairs (e.g. 200ms dice popover, 150ms player popover).
// `onChange` fires on every flip, including the delayed close.
export function useHoverOpen(closeDelay = 200, onChange?: (open: boolean) => void) {
	let open = $state(false)
	let closeTimeout: ReturnType<typeof setTimeout> | undefined = undefined

	function apply(value: boolean) {
		open = value
		onChange?.(value)
	}

	function handleEnter() {
		clearTimeout(closeTimeout)
		apply(true)
	}

	function handleLeave() {
		clearTimeout(closeTimeout)
		closeTimeout = setTimeout(() => {
			apply(false)
		}, closeDelay)
	}

	function setOpen(value: boolean) {
		clearTimeout(closeTimeout)
		apply(value)
	}

	onDestroy(() => {
		clearTimeout(closeTimeout)
	})

	return {
		get open() {
			return open
		},
		setOpen,
		handleEnter,
		handleLeave
	}
}
