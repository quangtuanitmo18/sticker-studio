import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
    const { id, name, frameDataUrl, width, height, slots } = body

    if (!name || !slots || slots.length === 0) {
      return NextResponse.json({ error: 'Missing name or slots' }, { status: 400 })
    }

    const ts = Date.now()
    const currentId = id || `frame-${ts}`
    const basePath = `${FOLDER}/${currentId}`

    // Upload frame PNG (if provided as base64), or preserve existing URL
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
    } else if (frameDataUrl && frameDataUrl.startsWith('http')) {
      // Already a URL (re-saving existing cloud frame) — keep it
      pngUrl = frameDataUrl
    }

    // Upload metadata JSON
    const metadata = {
      id: currentId,
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
          const parsed = JSON.parse(text)
          // Inject the exact filename used in the bucket so we can delete it later
          return { ...parsed, _bucketPath: `${FOLDER}/${f.name.replace('.json', '')}` }
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
    const { data, error } = await supabase.storage.from(BUCKET).remove(filesToDelete)

    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error(`Failed to delete (RLS policy missing for DELETE, or files not found).`)
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (err: any) {
    console.error('[frames/DELETE]', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
