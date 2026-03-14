import { NextRequest, NextResponse } from 'next/server'

function friendlyError(err: any): string {
  const msg = typeof err === 'string' ? err : err?.message || ''
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED'))
    return 'AI service is temporarily overloaded. Trying backup provider...'
  if (msg.includes('401') || msg.includes('403') || msg.includes('PERMISSION'))
    return 'API key issue. Please check server configuration.'
  if (msg.includes('timeout') || msg.includes('DEADLINE'))
    return 'Request timed out. Please try again.'
  return 'Generation failed. Trying next provider...'
}

// ── Provider 1: Google Gemini ──────────────────────────────
async function tryGemini(imageBase64: string, mimeType: string, style: string, emotionPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: `Create a professional die-cut sticker of the person in the provided image.
Style: ${style}.
Expression/Emotion: ${emotionPrompt}.
CRITICAL: You MUST maintain the exact same framing, camera angle, and composition as the original photo. If the original photo is a close-up of the face, the sticker must be a close-up. If the original shows the head and shoulders, the sticker must show the head and shoulders. Do not change the subject's pose or distance from the camera.
The background MUST be a solid, pure white color. High quality, clear outlines, clean sticker aesthetic.` },
      ],
    },
  })

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' }
    }
  }
  return null
}

// ── Provider 2: Fal.ai (flux-general) ──────────────────────
async function tryFalAi(imageBase64: string, mimeType: string, style: string, emotionPrompt: string) {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) return null

  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`

  const response = await fetch('https://fal.run/fal-ai/flux-general/image-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageDataUrl,
      prompt: `A professional die-cut sticker in ${style} style. ${emotionPrompt}. White background, high quality, clean sticker aesthetic, clear outlines.`,
      strength: 0.75,
      num_images: 1,
      image_size: 'square',
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

// ── Provider 3: Replicate (SDXL img2img) ───────────────────
async function tryReplicate(imageBase64: string, mimeType: string, style: string, emotionPrompt: string) {
  const apiKey = process.env.REPLICATE_API_TOKEN
  if (!apiKey) return null

  const { default: Replicate } = await import('replicate')
  const replicate = new Replicate({ auth: apiKey })

  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`

  const output = await replicate.run(
    'stability-ai/sdxl:7762fd07cf82c948c1b54b3c3a2f11b15cbf4868b0e7e70284e6c3e5e2c1e0ca',
    {
      input: {
        image: imageDataUrl,
        prompt: `A professional die-cut sticker in ${style} style. ${emotionPrompt}. White background, high quality, clean sticker aesthetic, clear outlines, centered composition.`,
        prompt_strength: 0.7,
        num_outputs: 1,
        width: 1024,
        height: 1024,
      },
    }
  )

  const outputArray = output as any
  if (Array.isArray(outputArray) && outputArray[0]) {
    const url = typeof outputArray[0] === 'string' ? outputArray[0] : outputArray[0].url?.()
    if (url) {
      const imgRes = await fetch(url)
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      return { imageBase64: buffer.toString('base64'), mimeType: 'image/png' }
    }
  }
  return null
}

// ── Main route ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType, style, emotionPrompt } = await request.json()

    if (!imageBase64 || !mimeType || !style || !emotionPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields. Please provide an image, style, and emotion.' },
        { status: 400 },
      )
    }

    const providers = [
      { name: 'Gemini', fn: tryGemini },
      { name: 'Fal.ai', fn: tryFalAi },
      { name: 'Replicate', fn: tryReplicate },
    ]

    const errors: string[] = []

    for (const provider of providers) {
      try {
        console.log(`[generate-sticker] Trying ${provider.name}...`)
        const result = await provider.fn(imageBase64, mimeType, style, emotionPrompt)
        if (result) {
          console.log(`[generate-sticker] ${provider.name} succeeded`)
          return NextResponse.json(result)
        }
        console.log(`[generate-sticker] ${provider.name}: no API key or no result`)
      } catch (err: any) {
        const msg = friendlyError(err)
        console.error(`[generate-sticker] ${provider.name} failed:`, err.message || err)
        errors.push(`${provider.name}: ${msg}`)
      }
    }

    return NextResponse.json(
      { error: 'All AI providers are currently unavailable. Please try again in a few minutes.' },
      { status: 503 },
    )
  } catch (err: any) {
    console.error('[generate-sticker] Request error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
