import { NextRequest, NextResponse } from 'next/server'

// ─── Provider 1: Replicate (Real-ESRGAN) ────────────────────
async function tryReplicate(imageBase64: string, mimeType: string, scale: number) {
  const apiKey = process.env.REPLICATE_API_TOKEN
  if (!apiKey) return null

  const { default: Replicate } = await import('replicate')
  const replicate = new Replicate({ auth: apiKey })

  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`

  const output = await replicate.run(
    'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    {
      input: {
        image: imageDataUrl,
        scale: Math.min(scale, 4),
        face_enhance: true,
      },
    },
  )

  if (output && typeof output === 'string') {
    const imgRes = await fetch(output)
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    return { imageBase64: buffer.toString('base64'), mimeType: 'image/png' }
  }
  return null
}

// ─── Provider 2: Fal.ai (Real-ESRGAN) ──────────────────────
async function tryFalAi(imageBase64: string, mimeType: string, scale: number) {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) return null

  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`

  const response = await fetch('https://fal.run/fal-ai/real-esrgan', {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageDataUrl,
      scale: Math.min(scale, 4),
    }),
  })

  if (!response.ok) throw new Error(`Fal.ai: ${response.status}`)
  const data = await response.json()

  if (data.image?.url) {
    const imgRes = await fetch(data.image.url)
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    return { imageBase64: buffer.toString('base64'), mimeType: 'image/png' }
  }
  return null
}

// ─── Main route ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType, scale = 2 } = await request.json()

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageBase64, mimeType' },
        { status: 400 },
      )
    }

    const providers = [
      { name: 'Replicate', fn: tryReplicate },
      { name: 'Fal.ai', fn: tryFalAi },
    ]

    for (const provider of providers) {
      try {
        console.log(`[upscale] Trying ${provider.name}...`)
        const result = await provider.fn(imageBase64, mimeType, scale)
        if (result) {
          console.log(`[upscale] ${provider.name} succeeded`)
          return NextResponse.json(result)
        }
        console.log(`[upscale] ${provider.name}: no API key or no result`)
      } catch (err: any) {
        console.error(`[upscale] ${provider.name} failed:`, err.message || err)
      }
    }

    return NextResponse.json(
      { error: 'Image upscaling is currently unavailable. Please try again later.' },
      { status: 503 },
    )
  } catch (err: any) {
    console.error('[upscale] Request error:', err)
    return NextResponse.json(
      { error: 'Something went wrong with upscaling. Please try again.' },
      { status: 500 },
    )
  }
}
