import React from 'react';
import { useContent } from '../../contexts/ContentContext';
import { getFullMediaUrl } from '../../services/api';

export function MediaArtwork({ item, width = '100%', height = '100%' }) {
  const contentCtx = useContent();
  const logoUrl = item?.logoUrl || contentCtx?.brandProfile?.logoUrl || null;
  const brandName = contentCtx?.brandProfile?.name || 'My Brand';
  const monogram = (brandName || 'MB').slice(0, 2).toUpperCase();
  const price = item?.priceTag || '';
  const title = item?.title || `${brandName} Social Post`;

  if (!item) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8' }}>
        No preview available
      </div>
    );
  }

  // Real Media from Cloudinary / Uploads / S3
  const realUrl = item?.mediaUrl || item?.media_url || item?.file_url || item?.thumbnailUrl || item?.thumbnail_url || item?.media_asset?.file_url || item?.meta_info?.generated_media?.image?.image_url || item?.meta_info?.generated_media?.video?.video_url || item?.url;
  if (realUrl && (typeof realUrl === 'string') && (realUrl.startsWith('http') || realUrl.startsWith('/uploads') || realUrl.startsWith('/media'))) {
    const isVideo = Boolean(
      item?.mediaType === 'video' ||
      item?.contentType === 'video' ||
      String(item?.mediaMimeType || '').startsWith('video/') ||
      item?.format?.toLowerCase().includes('reel') ||
      item?.format?.toLowerCase().includes('video') ||
      /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(realUrl) ||
      realUrl.includes('/video/upload/') ||
      realUrl.includes('/video/')
    );
    const fullUrl = getFullMediaUrl(realUrl);

    // Cloudinary poster transformation if applicable
    const posterUrl = (isVideo && fullUrl.includes('res.cloudinary.com') && fullUrl.includes('/video/upload/'))
      ? fullUrl.replace(/\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i, '.jpg$2').replace('/video/upload/', '/video/upload/so_0,w_800,c_fill/')
      : null;

    return (
      <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 'inherit', background: '#090D16' }}>
        {isVideo ? (
          <video
            src={fullUrl}
            poster={posterUrl || undefined}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            controls
            playsInline
            preload="metadata"
            muted
          />
        ) : (
          <img
            src={fullUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // If image fails, fallback to video check if extension was misleading
              if (fullUrl.includes('/video/')) {
                e.currentTarget.style.display = 'none';
              }
            }}
          />
        )}
      </div>
    );
  }

  // 1. Dynamic Branded Image Canvas when no direct file URL
  if (item.contentType === 'image' || !item.contentType) {
    const palette = contentCtx?.brandProfile?.colorPalette || ['#36B987', '#193C2D', '#55D3A0'];
    const c1 = palette[0] || '#36B987';
    const c2 = palette[1] || '#193C2D';
    const displayHeadline = item.headline || item.title || `${brandName} Collection`;
    const formatLabel = item.format || 'Image Post';

    return (
      <svg className="media-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width, height, borderRadius: 'inherit' }}>
        <defs>
          <linearGradient id="brandCanvasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#brandCanvasGrad)" />
        <circle cx="200" cy="150" r="110" fill={c1} opacity="0.12" />
        <circle cx="340" cy="60" r="80" fill={c2} opacity="0.08" />

        {/* Format Tag at Top Right */}
        <g transform="translate(280, 16)">
          <rect width="104" height="26" rx="6" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" />
          <text x="52" y="17" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="9" fill={c2}>
            {formatLabel.slice(0, 14).toUpperCase()}
          </text>
        </g>

        {/* Central Brand Creative Card */}
        <g transform="translate(40, 85)">
          <rect width="320" height="130" rx="12" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.1)" />
          <rect x="0" y="0" width="4" height="130" rx="2" fill="url(#accentGlow)" />
          
          <text x="20" y="32" fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="14" fill="#ffffff">
            {displayHeadline.slice(0, 32)}
          </text>
          {displayHeadline.length > 32 && (
            <text x="20" y="52" fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="13" fill="#ffffff">
              {displayHeadline.slice(32, 64)}
            </text>
          )}

          <text x="20" y="85" fontFamily="'Inter', sans-serif" fontSize="10" fill="#94a3b8">
            {item.objective ? item.objective.slice(0, 42) : `${brandName} Official Social Dispatch`}
          </text>

          <rect x="20" y="98" width="90" height="20" rx="4" fill="url(#accentGlow)" />
          <text x="65" y="112" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="8" fill="#ffffff">
            {item.cta ? item.cta.slice(0, 14).toUpperCase() : 'LEARN MORE'}
          </text>
        </g>

        {/* Footer Bar */}
        <rect x="20" y="255" width="160" height="30" rx="6" fill="rgba(255, 255, 255, 0.05)" />
        <text x="32" y="274" fontFamily="'Inter', sans-serif" fontSize="10" fill="#cbd5e1">
          {item.platform || 'Social Post'} • {brandName}
        </text>

        {price && (
          <g transform="translate(290, 255)">
            <rect width="90" height="30" rx="6" fill={c1} opacity="0.3" stroke={c1} strokeWidth="1" />
            <text x="45" y="274" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="10" fill="#ffffff">
              {price}
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 3. Video Reel Artwork (Video Reel Player Simulation)
  if (item.contentType === 'video') {
    return (
      <svg className="media-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width, height, background: '#0f172a', borderRadius: 'inherit' }}>
        <defs>
          <linearGradient id="reelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#reelGrad)" />

        {/* 9:16 Reel Live Badge */}
        <g transform="translate(285, 16)">
          <rect width="100" height="26" rx="6" fill="rgba(220, 39, 67, 0.9)" />
          <circle cx="12" cy="13" r="4" fill="#ffffff" />
          <text x="56" y="17" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="9" fill="#ffffff">REEL • 9:16 HD</text>
        </g>

        <circle cx="200" cy="125" r="55" fill="rgba(199,164,90,0.12)" />

        {/* Video Player Center Card */}
        <g transform="translate(155, 55)">
          <rect x="5" y="5" width="80" height="125" rx="8" fill="#19251E" stroke="#35483B" strokeWidth="1.5" />
          <circle cx="45" cy="65" r="18" fill="#36B987" />
          <polygon points="40,57 55,65 40,73" fill="#081B12" />
          {/* Overlay Sound Wave */}
          <rect x="18" y="105" width="4" height="10" rx="2" fill="#55D3A0" />
          <rect x="26" y="98" width="4" height="17" rx="2" fill="#55D3A0" />
          <rect x="34" y="108" width="4" height="7" rx="2" fill="#55D3A0" />
          <rect x="42" y="95" width="4" height="20" rx="2" fill="#55D3A0" />
          <rect x="50" y="103" width="4" height="12" rx="2" fill="#55D3A0" />
          <rect x="58" y="100" width="4" height="15" rx="2" fill="#55D3A0" />
          <rect x="66" y="106" width="4" height="9" rx="2" fill="#55D3A0" />
        </g>

        <text x="200" y="215" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="13" fill="#ffffff">{title.toUpperCase()}</text>
        <text x="200" y="233" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="10" fill="#94a3b8">{brandName} Reel • Auto-Synced Audio & Visuals</text>
      </svg>
    );
  }

  // 4. Carousel Artwork
  if (item.contentType === 'carousel') {
    return (
      <svg className="media-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width, height, background: '#ffffff', borderRadius: 'inherit' }}>
        <rect width="400" height="300" fill="#f8fafc" />

        <g transform="translate(100, 45)">
          <rect x="20" y="0" width="160" height="190" rx="8" fill="#e2e8f0" stroke="#cbd5e1" />
          <rect x="10" y="10" width="160" height="190" rx="8" fill="#f1f5f9" stroke="#cbd5e1" />
          <rect x="0" y="20" width="160" height="190" rx="8" fill="#ffffff" stroke="#0E7490" strokeWidth="1.5" />
          <text x="80" y="80" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="14" fill="#0f172a">CAROUSEL</text>
          <text x="80" y="105" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="10" fill="#64748b">{item.title ? item.title.slice(0, 24) : 'Multi-Slide Showcase'}</text>
          <rect x="25" y="130" width="110" height="24" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="80" y="146" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0E7490">SWIPE RIGHT</text>
        </g>
      </svg>
    );
  }

  // 5. Text Hook Announcement
  return (
    <div style={{ padding: '16px', background: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 'inherit' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
          ) : (
            <span style={{ fontSize: '1.2rem' }}>{item.icon || ''}</span>
          )}
          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{item.headline || item.title}</strong>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.45', marginBottom: '8px' }}>
          "{item.caption ? item.caption.slice(0, 140) : (item.prompt || `${brandName} Social Update`)}..." </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
        <span>CTA: <strong>{item.cta || 'Discover more'}</strong></span>
        <span className="badge badge--accent">{item.platform}</span>
      </div>
    </div>
  );
}
