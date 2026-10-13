"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

type CloudImageProps = Omit<ImageProps, "loader" | "src"> & {
  src: string;
  blurDataURL?: string;
};

function cloudinaryLoader({ src, width }: ImageLoaderProps): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return src;
  const publicId = src.startsWith("http") ? src.split(`/upload/`)[1] ?? src : src;
  const transformation = `f_auto,q_auto,w_${width},dpr_auto`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

export function CloudImage({ blurDataURL, placeholder, alt, ...props }: CloudImageProps) {
  return <Image alt={alt} {...props} loader={cloudinaryLoader} placeholder={blurDataURL ? "blur" : placeholder} blurDataURL={blurDataURL} />;
}
