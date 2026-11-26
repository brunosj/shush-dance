'use client';

import Image, { type ImageProps } from 'next/image';

import { getMediaBlurDataURL } from '../_utilities/getMediaUrl';

type BlurMedia = { blurDataURL?: string | null } | null | undefined;

type CMSImageProps = Omit<
  ImageProps,
  'src' | 'alt' | 'placeholder' | 'blurDataURL'
> & {
  src: string;
  alt: string;
  media?: BlurMedia;
  blurDataURL?: string | null;
};

export function CMSImage({
  src,
  alt,
  media,
  blurDataURL: blurProp,
  ...rest
}: CMSImageProps) {
  const blurDataURL = blurProp ?? getMediaBlurDataURL(media);
  const hasBlur = Boolean(blurDataURL);

  return (
    <Image
      src={src}
      alt={alt}
      {...rest}
      {...(hasBlur
        ? { placeholder: 'blur' as const, blurDataURL: blurDataURL! }
        : {})}
    />
  );
}