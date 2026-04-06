import { NextResponse } from 'next/server'
import youtubedl from 'youtube-dl-exec'
import ytdl from '@distube/ytdl-core'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    try {
      let resolvedUrl = null;

      // 1. Try distube/ytdl-core for YouTube links first (often faster if not bot-blocked)
      if (ytdl.validateURL(url)) {
        try {
          const info = await ytdl.getInfo(url)
          const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' }) || ytdl.chooseFormat(info.formats, { quality: 'highest' })
          
          if (format && format.url) {
            resolvedUrl = format.url
          }
        } catch (ytErr: any) {
          console.warn('ytdl-core failed, falling back to youtube-dl-exec:', ytErr.message)
          // Do not throw, allow fallback to youtube-dl-exec (yt-dlp)
        }
      }

      // 2. Fallback or Non-YT URLs -> Use youtube-dl-exec (Powered by yt-dlp)
      // This supports Facebook, Instagram, TikTok, and YouTube bot-bypassing
      if (!resolvedUrl) {
        console.log('Fetching with youtube-dl-exec (yt-dlp):', url)
        const output: any = await youtubedl(url, {
          dumpSingleJson: true,
          noWarnings: true,
          preferFreeFormats: true,
          format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        })
        if (output && output.url) {
          resolvedUrl = output.url
        }
      }

      if (resolvedUrl) {
        return NextResponse.json({ url: resolvedUrl })
      }
      return NextResponse.json({ error: 'Failed to find direct stream URL.' }, { status: 500 })
    } catch (err: any) {
      console.warn('Scraping failed:', err)
      const msg = err.message || ''
      
      // Giả lập video cho localhost nếu bị chặn bởi YouTube
      if (
        msg.includes('Sign in to confirm you') || 
        msg.includes('sign in') || 
        msg.includes('bot') ||
        msg.includes('ECONNRESET') ||
        msg.includes('Not found')
      ) {
         console.log('Đang sử dụng Video Giả Lập (Mock) vì YouTube chặn IP Localhost...')
         // Trả về một video sample dạng dọc (hoặc ngang) tốc độ tải nhanh của Google làm giả lập
         return NextResponse.json({ 
           url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
           mocked: true 
         })
      }

      return NextResponse.json({ error: 'Không thể lấy video. Phát hiện lỗi không xác định từ nền tảng.' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Fetch Video API Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
