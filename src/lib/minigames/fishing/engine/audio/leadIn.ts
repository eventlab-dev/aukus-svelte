import { LEAD_IN_GATE, LEAD_IN_KEEP, LEAD_IN_LIMIT, LEAD_IN_WINDOW } from './catalog'

/** Samples of silent lead to drop; 0 when the cue starts promptly. */
export function leadInSamples(buffer: AudioBuffer): number {
	const channels: Float32Array[] = []
	for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
		channels.push(buffer.getChannelData(channel))
	}
	if (channels.length === 0) return 0

	let peak = 0
	for (const data of channels) {
		for (let i = 0; i < data.length; i += 1) {
			const value = Math.abs(data[i])
			if (value > peak) peak = value
		}
	}
	// −34 dB below the cue's own peak: quiet room tone is still "nothing" by
	// ear, while the first real transient is a whole order of magnitude louder.
	const gate = peak * LEAD_IN_GATE
	if (gate <= 0) return 0

	// One sample over the gate is a tick: the onset is the first hit that is
	// answered by another inside a short window.
	const data0 = channels[0]
	const window = Math.max(1, Math.round(LEAD_IN_WINDOW * buffer.sampleRate))
	let pending = -1
	let onset = -1
	for (let i = 0; i < data0.length; i += 1) {
		let loud = false
		for (const data of channels) {
			if (data[i] > gate || data[i] < -gate) {
				loud = true
				break
			}
		}
		if (!loud) continue
		if (pending >= 0 && i - pending <= window) {
			onset = pending
			break
		}
		pending = i
	}
	if (onset < 0) return 0

	const keep = Math.round(LEAD_IN_KEEP * buffer.sampleRate)
	const drop = onset - keep
	const minimum = Math.round((LEAD_IN_LIMIT + LEAD_IN_KEEP) * buffer.sampleRate)
	return drop >= minimum ? drop : 0
}

/**
 * Cuts a dead lead-in off a sample.
 *
 * `cast.wav` opens with about 140 ms below −50 dB, so the whoosh arrives a
 * beat after the release and the cast feels late. The trim is measured on the
 * sample rather than hard-coded per file: a cue with more than
 * `LEAD_IN_LIMIT` of silence loses it, a cue that starts promptly keeps its own
 * timing, and a short lead is kept so the attack is never chopped.
 */
export function trimLeadIn(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
	const start = leadInSamples(buffer)
	if (start <= 0) return buffer
	const trimmed = ctx.createBuffer(
		buffer.numberOfChannels,
		buffer.length - start,
		buffer.sampleRate
	)
	for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
		trimmed.copyToChannel(buffer.getChannelData(channel).subarray(start), channel)
	}
	return trimmed
}
