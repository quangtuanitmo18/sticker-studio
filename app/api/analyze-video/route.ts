import { NextRequest, NextResponse } from 'next/server'

/**
 * AI Auto-Highlight: Gemini analyzes video frames and
 * suggests the most visually interesting segment to clip.
 */
export async function POST(request: NextRequest) {
  try {
    const { frames, duration } = await request.json()

    if (!frames || !Array.isArray(frames) || frames.length === 0 || !duration) {
      return NextResponse.json(
        { error: 'Provide an array of base64 frame images and the total duration.' },
        { status: 400 },
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured.' },
        { status: 503 },
      )
    }

    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })

    // Send sample frames to Gemini for analysis
    const parts: any[] = frames.slice(0, 6).map((frame: string, idx: number) => ({
      inlineData: {
        data: frame.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: 'image/jpeg',
      },
    }))

    parts.push({
      text: `You are analyzing ${frames.length} evenly-spaced frames from a ${duration.toFixed(1)}s video.
Each frame corresponds to approximately ${(duration / frames.length).toFixed(1)}s intervals.

Identify the most visually interesting or dynamic 2-5 second segment.
Consider: facial expressions, action, motion, composition, visual appeal.

Reply ONLY with valid JSON (no markdown):
{"start": <seconds>, "end": <seconds>, "reason": "<brief reason>"}`,
    })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*?\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        start: Math.max(0, Number(parsed.start) || 0),
        end: Math.min(duration, Number(parsed.end) || duration),
        reason: String(parsed.reason || 'Best moment detected'),
      })
    }

    return NextResponse.json(
      { start: 0, end: Math.min(3, duration), reason: 'Could not determine best segment' },
    )
  } catch (err: any) {
    console.error('[analyze-video]', err.message || err)
    return NextResponse.json(
      { error: 'AI analysis failed. Please try again.' },
      { status: 500 },
    )
  }
}
