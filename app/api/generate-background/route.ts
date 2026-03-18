import { NextRequest, NextResponse } from 'next/server'

// ─── Provider 1: Gemini (text-to-image) ─────────────────────
async function tryGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Generate a seamless, tileable background pattern. Style: ${prompt}. 
                 The image should be suitable as a sticker or image background. 
                 Make it vibrant, visually appealing, and high quality. 
                 Size: 1024x1024 pixels. No text, no watermarks.`,
        },
      ],
    },
  })

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      }
    }
  }
  return null
}

// ─── Provider 2: Fal.ai (flux schnell) ─────────────────────
async function tryFalAi(prompt: string) {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: `A seamless background pattern: ${prompt}. Vibrant, high quality, no text, no watermarks.`,
      image_size: 'square',
      num_images: 1,
    }),
  })

  if (!response.ok) throw new Error(`Fal.ai: ${response.status}`)
  const data = await response.json()

  if (data.images?.[0]?.url) {
    const imgRes = await fetch(data.images[0].url)
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    return { imageBase64: buffer.toString('base64'), mimeType: 'image/png' }
  }
  return null
}

// ─── Main route ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 },
      )
    }

    const providers = [
      { name: 'Gemini', fn: tryGemini },
      { name: 'Fal.ai', fn: tryFalAi },
    ]

    for (const provider of providers) {
      try {
        console.log(`[generate-bg] Trying ${provider.name}...`)
        const result = await provider.fn(prompt)
        if (result) {
          console.log(`[generate-bg] ${provider.name} succeeded`)
          return NextResponse.json(result)
        }
      } catch (err: any) {
        console.error(`[generate-bg] ${provider.name} failed:`, err.message || err)
      }
    }

    return NextResponse.json(
      { error: 'Background generation is currently unavailable.' },
      { status: 503 },
    )
  } catch (err: any) {
    console.error('[generate-bg] Request error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
