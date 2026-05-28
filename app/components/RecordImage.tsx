'use client';
import { useState } from 'react';
import type { Category } from '@/types';

const DEFAULT_ICON: Record<Category, string> = {
  映画: '🎬',
  舞台: '🎭',
  LIVE: '🎤',
};

interface Props {
  imageUrl: string | null;
  category: Category;
  width?: number;
  height?: number;
  className?: string;
}

export default function RecordImage({ imageUrl, category, width = 80, height = 112, className = '' }: Props) {
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={width}
        height={height}
        className={`object-cover rounded ${className}`}
        style={{ width, height, objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className={`img-placeholder rounded ${className}`}
      style={{ width, height, fontSize: Math.min(width, height) * 0.4 }}
    >
      {DEFAULT_ICON[category]}
    </div>
  );
}
