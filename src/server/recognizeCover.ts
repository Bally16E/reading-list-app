import Anthropic from '@anthropic-ai/sdk'

export interface RecognizeResult {
  title: string
  author: string
}

const PROMPT =
  'This is a photo of a book cover. Read the title and author printed on it exactly as shown (keep the original language/characters, likely Japanese). ' +
  'Respond with ONLY a JSON object like {"title": "...", "author": "..."} and nothing else. ' +
  'If a field cannot be determined, use an empty string for it.'

export async function recognizeCoverImage(imageDataUrl: string): Promise<RecognizeResult> {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
  if (!match) throw new Error('invalid image data URL')
  const [, mediaType, base64Data] = match

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const anthropic = new Anthropic({ apiKey })
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64Data,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  })

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  const raw = textBlock?.text ?? '{}'
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    title: typeof parsed.title === 'string' ? parsed.title : '',
    author: typeof parsed.author === 'string' ? parsed.author : '',
  }
}
