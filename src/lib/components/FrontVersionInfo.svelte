<script lang="ts">
	const version = import.meta.env.PACKAGE_VERSION
</script>

<div
	class="pointer-events-none fixed bottom-4 left-4 z-50 hidden select-none flex-col items-start rounded p-1 text-xs text-white/80 md:flex"
	id="front-version-info"
>
	v.{version}
</div>
