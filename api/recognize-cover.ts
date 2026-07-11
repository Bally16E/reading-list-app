import type { VercelRequest, VercelResponse } from '@vercel/node'
import { recognizeCoverImage } from '../src/server/recognizeCover'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { imageDataUrl } = req.body as { imageDataUrl?: string }
  if (!imageDataUrl) {
    res.status(400).json({ error: 'imageDataUrl is required' })
    return
  }

  try {
    const result = await recognizeCoverImage(imageDataUrl)
    res.status(200).json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'recognition failed' })
  }
}
