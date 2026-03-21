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
      if (ytdl.validateURL(url)) {
        // Handle YouTube via @distube/ytdl-core because it handles bot protections natively much better than yt-dlp currently does
        const info = await ytdl.getInfo(url)
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' }) || ytdl.chooseFormat(info.formats, { quality: 'highest' })
        
        if (format && format.url) {
          return NextResponse.json({ url: format.url })
        }
      }

      // Handle non-YT or fallback via yt-dlp
      const output: any = await youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
      })
      if (output && output.url) {
        return NextResponse.json({ url: output.url })
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
