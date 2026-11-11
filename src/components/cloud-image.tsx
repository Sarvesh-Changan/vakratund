"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

type CloudImageProps = Omit<ImageProps, "loader" | "src"> & {
  src: string;
  blurDataURL?: string;
};

function cloudinaryLoader({ src, width }: ImageLoaderProps): string {
  const configuredCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cloudinaryMatch = src.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/);
  const cloudName = configuredCloudName || cloudinaryMatch?.[1];
  const publicId = cloudinaryMatch?.[2] ?? src;
  if (!cloudName) return src;
  const transformation = `f_auto,q_auto,w_${width},dpr_auto`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

export function CloudImage({ blurDataURL, placeholder, alt, ...props }: CloudImageProps) {
  const usesCloudinaryLoader = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) || (typeof props.src === "string" && props.src.startsWith("https://res.cloudinary.com/"));
  return <Image alt={alt} {...props} loader={cloudinaryLoader} unoptimized={!usesCloudinaryLoader} placeholder={blurDataURL ? "blur" : placeholder} blurDataURL={blurDataURL} />;
}
