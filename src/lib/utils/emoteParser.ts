export type MessagePart = 
	| { type: 'text'; content: string }
	| { type: 'emote'; name: string; url: string; isZeroWidth: boolean }

/**
 * Parses a message string that may contain emotes in the format:
 * [emote_name=NAME,emote_url=URL] or [emote_name=NAME,emote_url=URL,emote_zw=True]
 * 
 * Returns an array of message parts (text segments and emotes)
 */
export function parseMessageWithEmotes(text: string): MessagePart[] {
	const parts: MessagePart[] = []
	
	// Regex to match emote pattern with optional zero-width flag
	// Matches: [emote_name=...,emote_url=...] or [emote_name=...,emote_url=...,emote_zw=True]
	const emoteRegex = /\[emote_name=([^,]+),emote_url=([^\],]+)(?:,emote_zw=(True|False))?\]/g
	
	let lastIndex = 0
	let match: RegExpExecArray | null
	
	while ((match = emoteRegex.exec(text)) !== null) {
		// Add text before the emote (if any)
		if (match.index > lastIndex) {
			const textContent = text.substring(lastIndex, match.index)
			if (textContent) {
				parts.push({ type: 'text', content: textContent })
			}
		}
		
		// Add the emote
		const emoteName = match[1]
		const emoteUrl = match[2]
		const isZeroWidth = match[3] === 'True'
		
		parts.push({ 
			type: 'emote', 
			name: emoteName, 
			url: emoteUrl,
			isZeroWidth 
		})
		
		lastIndex = emoteRegex.lastIndex
	}
	
	// Add remaining text after the last emote (if any)
	if (lastIndex < text.length) {
		const textContent = text.substring(lastIndex)
		if (textContent) {
			parts.push({ type: 'text', content: textContent })
		}
	}
	
	return parts
}

