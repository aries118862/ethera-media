export function facebookVideoEmbedUrl(permalink) {
  if (!permalink) return '';
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(permalink)}&show_text=false&width=560`;
}
