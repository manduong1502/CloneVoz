// Helper to strip HTML and count words
export function countWords(htmlContent) {
  if (!htmlContent) return 0;
  // Replace HTML tags with space
  const text = htmlContent.replace(/<[^>]*>?/gm, ' ');
  // Split by whitespace
  const words = text.trim().split(/\s+/);
  // Filter out empty strings
  const validWords = words.filter(w => w.length > 0);
  return validWords.length;
}
