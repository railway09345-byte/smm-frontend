import React, { useState, useEffect } from 'react';
import { Play, Film, Camera } from 'lucide-react';
import { getFullMediaUrl } from '../../services/api';

/**
 * Curated high-resolution lifestyle, product, and campaign imagery
 * so every post without a direct uploaded asset displays vibrant, relevant visuals.
 */
function getCuratedFallback(title = '') {
  const t = (title || '').toLowerCase();
  if (t.includes('toy') || t.includes('kid') || t.includes('doll') || t.includes('play')) {
    return 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('linen') || t.includes('shirt') || t.includes('wear') || t.includes('cloth') || t.includes('season') || t.includes('outfit')) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('reel') || t.includes('style') || t.includes('drop') || t.includes('look') || t.includes('casual')) {
    return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('tech') || t.includes('ai') || t.includes('digital') || t.includes('marketing') || t.includes('studio')) {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80';
  }

  const library = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
  ];
  let hash = 0;
  for (let i = 0; i < (title || 'brand').length; i++) {
    hash = (hash << 5) - hash + (title || 'brand').charCodeAt(i);
    hash |= 0;
  }
  return library[Math.abs(hash) % library.length];
}

function isValidHttpOrStaticUrl(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return true;
  if (s.startsWith('/uploads/') || s.startsWith('/media/') || s.startsWith('/assets/') || s.startsWith('data:image/')) return true;
  if (/\.(jpeg|jpg|png|webp|gif|mp4|mov|webm)(\?.*)?$/i.test(s)) return true;
  return false;
}

/**
 * Robust media preview for posts.
 * Correctly renders images, Cloudinary video frames, native videos, and fallback cards.
 */
export function PostMediaThumbnail({
  url,
  title = '',
  className = 'w-16 h-16 sm:w-20 sm:h-20 rounded-xl',
  isVideo: explicitIsVideo = false,
  showBadge = true,
  onClick = null,
}) {
  const hasValidDirectUrl = isValidHttpOrStaticUrl(url);
  const initialUrl = hasValidDirectUrl ? getFullMediaUrl(url) : getCuratedFallback(title);

  const [currentSrc, setCurrentSrc] = useState(initialUrl);
  const [triedFallback, setTriedFallback] = useState(!hasValidDirectUrl);
  const [loadError, setLoadError] = useState(false);
  const [useVideoFallback, setUseVideoFallback] = useState(false);

  useEffect(() => {
    const valid = isValidHttpOrStaticUrl(url);
    const resolved = valid ? getFullMediaUrl(url) : getCuratedFallback(title);
    setCurrentSrc(resolved);
    setTriedFallback(!valid);
    setLoadError(false);
    setUseVideoFallback(false);
  }, [url, title]);

  // Detect whether target asset is video
  const isVideo = Boolean(
    explicitIsVideo ||
    (currentSrc && (
      /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(currentSrc) ||
      currentSrc.includes('/video/upload/') ||
      currentSrc.includes('/video/')
    ))
  );

  // Cloudinary video poster generator
  const getPosterUrl = (src) => {
    if (!src) return '';
    if (src.includes('res.cloudinary.com') && src.includes('/video/upload/')) {
      return src
        .replace(/\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i, '.jpg$2')
        .replace('/video/upload/', '/video/upload/so_0,w_400,c_fill/');
    }
    return src;
  };

  const posterUrl = isVideo ? getPosterUrl(currentSrc) : currentSrc;
  const isCompact = className.includes('w-10') || className.includes('w-8') || className.includes('w-12') || className.includes('h-10');

  const handleMediaError = () => {
    if (isVideo && !useVideoFallback) {
      setUseVideoFallback(true);
    } else if (!triedFallback) {
      setTriedFallback(true);
      setCurrentSrc(getCuratedFallback(title));
    } else {
      setLoadError(true);
    }
  };

  if (loadError) {
    return (
      <div
        className={`${className} shrink-0 bg-surface border border-border flex flex-col items-center justify-center relative overflow-hidden group shadow-inner`}
        title={title}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-slate-800/20 to-indigo-500/10" />
        {isVideo ? (
          <Film className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-warning relative z-10`} />
        ) : (
          <Camera className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-text-muted relative z-10`} />
        )}
        {!isCompact && (
          <span className="text-[9px] font-bold text-text-muted mt-1 uppercase tracking-wider relative z-10 truncate max-w-[90%] px-1 text-center">
            {isVideo ? 'Video' : 'Media'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 overflow-hidden bg-surface border border-border shadow-sm ${className} ${onClick ? 'cursor-pointer hover:border-warning/30 transition-colors' : ''}`}
    >
      {isVideo && useVideoFallback ? (
        <video
          src={currentSrc}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          onError={handleMediaError}
        />
      ) : (
        <img
          src={posterUrl}
          alt={title || 'Media thumbnail'}
          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
          onError={handleMediaError}
        />
      )}

      {/* Video Overlay Badge */}
      {isVideo && showBadge && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs border border-white/10 flex items-center gap-1 text-[9px] font-bold text-warning pointer-events-none shadow-xs">
          <Play className="w-2.5 h-2.5 fill-amber-300 text-warning" />
          <span>REEL</span>
        </div>
      )}
    </div>
  );
}

export default PostMediaThumbnail;
