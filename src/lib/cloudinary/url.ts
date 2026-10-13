export function cloudinaryVideoPoster(url: string): string {
  const transformed = url.replace("/video/upload/", "/video/upload/so_0/");
  return transformed.replace(/\.(?:mp4|webm)(?=$|\?)/i, ".jpg");
}
