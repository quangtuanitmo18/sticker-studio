import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUCKET = 'studio-assets'
const FOLDER = 'frames'

// ─── POST: Upload a frame template (PNG + metadata JSON) ─────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, frameDataUrl, width, height, slots } = body

    if (!name || !slots || slots.length === 0) {
      return NextResponse.json({ error: 'Missing name or slots' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const ts = Date.now()
    const basePath = `${FOLDER}/${slug}-${ts}`

    // Upload frame PNG (if provided)
    let pngUrl: string | null = null
    if (frameDataUrl && frameDataUrl.startsWith('data:')) {
      const base64 = frameDataUrl.split(',')[1]
      const buffer = Buffer.from(base64, 'base64')
      const pngPath = `${basePath}.png`

      const { error: pngErr } = await supabase.storage
        .from(BUCKET)
        .upload(pngPath, buffer, { contentType: 'image/png', upsert: true })

      if (pngErr) throw pngErr

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(pngPath)
      pngUrl = urlData.publicUrl
    }

    // Upload metadata JSON
    const metadata = {
      id: `frame-${ts}`,
      name,
      width,
      height,
      slots,
      frameUrl: pngUrl,
      createdAt: ts,
    }

    const jsonPath = `${basePath}.json`
    const { error: jsonErr } = await supabase.storage
      .from(BUCKET)
      .upload(jsonPath, JSON.stringify(metadata), {
        contentType: 'application/json',
        upsert: true,
      })

    if (jsonErr) throw jsonErr

    return NextResponse.json({ success: true, frame: metadata })
  } catch (err: any) {
    console.error('[frames/POST]', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

// ─── GET: List all saved frame templates ─────────────────────
export async function GET() {
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) throw error

    // Filter to JSON files only (metadata)
    const jsonFiles = (files || []).filter(f => f.name.endsWith('.json'))

    // Download each metadata file
    const frames = await Promise.all(
      jsonFiles.map(async (f) => {
        const { data, error: dlErr } = await supabase.storage
          .from(BUCKET)
          .download(`${FOLDER}/${f.name}`)

        if (dlErr || !data) return null

        try {
          const text = await data.text()
          return JSON.parse(text)
        } catch {
          return null
        }
      })
    )

    return NextResponse.json({ frames: frames.filter(Boolean) })
  } catch (err: any) {
    console.error('[frames/GET]', err)
    return NextResponse.json({ error: err.message || 'List failed' }, { status: 500 })
  }
}

// ─── DELETE: Remove a frame template ─────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const basePath = searchParams.get('path')

    if (!basePath) {
      return NextResponse.json({ error: 'Missing path param' }, { status: 400 })
    }

    // Delete both PNG and JSON
    const filesToDelete = [`${basePath}.png`, `${basePath}.json`]
    const { error } = await supabase.storage.from(BUCKET).remove(filesToDelete)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[frames/DELETE]', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
