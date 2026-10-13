import Image from "next/image";

import { cloudinaryVideoPoster } from "@/lib/cloudinary/url";

export function CloudVideoPoster({ src, alt, fill, width, height, sizes, className }: { src: string; alt: string; fill?: boolean; width?: number; height?: number; sizes?: string; className?: string }) {
  return <Image src={cloudinaryVideoPoster(src)} alt={alt} fill={fill} width={fill ? undefined : width} height={fill ? undefined : height} sizes={sizes} unoptimized className={className} />;
}
