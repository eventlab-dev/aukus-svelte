export type MessagePart = 
	| { type: 'text'; content: string }
	| { type: 'emote'; name: string; url: string }

/**
 * Parses a message string that may contain emotes in the format:
 * [emote_name=NAME,emote_url=URL]
 * 
 * Returns an array of message parts (text segments and emotes)
 */
export function parseMessageWithEmotes(text: string): MessagePart[] {
	const parts: MessagePart[] = []
	
	// Regex to match emote pattern: [emote_name=...,emote_url=...]
	const emoteRegex = /\[emote_name=([^,]+),emote_url=([^\]]+)\]/g
	
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
		parts.push({ type: 'emote', name: emoteName, url: emoteUrl })
		
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

