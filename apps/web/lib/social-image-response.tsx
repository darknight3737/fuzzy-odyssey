import 'server-only';

import { ImageResponse } from 'next/og';

export function createSocialImage({
  title,
  description,
  label,
}: {
  title: string;
  description: string;
  label: string;
}) {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '64px 72px',
        backgroundColor: '#f5f3ed',
        color: '#20261f',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 38, fontWeight: 700 }}>selletive</div>
        <div style={{ fontSize: 22, color: '#53634e' }}>{label}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', fontSize: 64, lineHeight: 1.1, fontWeight: 700 }}>
          {title.slice(0, 100)}
        </div>
        <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.4, color: '#53634e' }}>
          {description.slice(0, 180)}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 22, borderTop: '1px solid #c6cfc0', paddingTop: 24 }}>
        Encontre seu próximo parceiro de negócios.
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    },
  );
}
