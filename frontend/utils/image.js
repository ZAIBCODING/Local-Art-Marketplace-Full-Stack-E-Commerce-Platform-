// Resolve an artwork image src into something next/image can load.
// - Full URLs (http/https) pass through unchanged
// - Paths already starting with "/" pass through (served from /public)
// - Bare filenames like "placeholder.png" get a leading slash so they
//   resolve to /public instead of being treated as a route-relative URL
// - Missing/empty values fall back to /placeholder.png
export function resolveImageSrc(src) {
  if (!src) return "/placeholder.png";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return "/" + src;
}
