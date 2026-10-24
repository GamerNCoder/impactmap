import { ImageResponse } from 'next/og'

export const alt = 'ImpactMap — verified service hours without the paperwork'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#022c22', color: '#ecfdf5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>IM</div>
          ImpactMap
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}><span>Verified service hours,</span><span>without the paperwork.</span></div>
          <div style={{ fontSize: 30, color: '#a7f3d0' }}>Find events · Check in · Organizer-approved hours</div>
        </div>
        <div style={{ fontSize: 24, color: '#6ee7b7' }}>impactmap.vercel.app</div>
      </div>
    ),
    size
  )
}
