import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server' },
      { status: 500 },
    )
  }

  try {
    const { imageBase64, mimeType, style, emotionPrompt } = await request.json()

    if (!imageBase64 || !mimeType || !style || !emotionPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: imageBase64, mimeType, style, emotionPrompt' },
        { status: 400 },
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
          {
            text: `Create a professional die-cut sticker of the person in the provided image.
Style: ${style}.
Expression/Emotion: ${emotionPrompt}.
CRITICAL: You MUST maintain the exact same framing, camera angle, and composition as the original photo. If the original photo is a close-up of the face, the sticker must be a close-up. If the original shows the head and shoulders, the sticker must show the head and shoulders. Do not change the subject's pose or distance from the camera.
The background MUST be a solid, pure white color. High quality, clear outlines, clean sticker aesthetic.`,
          },
        ],
      },
    })

    // Extract generated image
    let generatedBase64 = null
    let generatedMimeType = 'image/png'
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        generatedBase64 = part.inlineData.data
        generatedMimeType = part.inlineData.mimeType || 'image/png'
        break
      }
    }

    if (!generatedBase64) {
      return NextResponse.json(
        { error: 'Gemini did not return an image' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      imageBase64: generatedBase64,
      mimeType: generatedMimeType,
    })
  } catch (err: any) {
    console.error('[generate-sticker] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate sticker' },
      { status: 500 },
    )
  }
}
