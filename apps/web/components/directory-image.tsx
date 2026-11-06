'use client';

import { useState } from 'react';

import Image from 'next/image';

import {
  canOptimizeDirectoryImage,
  directoryImageSource,
} from '~/lib/directory-images';

export function DirectoryImage({
  src,
  ...props
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = directoryImageSource(src);
  if (!source) return null;
  const optimize = failedSource !== source && canOptimizeDirectoryImage(source);
  return (
    <Image
      {...props}
      src={source}
      unoptimized={!optimize}
      onError={optimize ? () => setFailedSource(source) : undefined}
    />
  );
}

