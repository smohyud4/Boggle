const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function share(result: string, URL?: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    const shareData: ShareData = {
      title: `BoggleVerse`,
      text: result,
    };
    if (URL) shareData.url = URL;

    navigator
      .share(shareData)
      .then(() => console.log('Shared successfully'))
      .catch(() => console.log('Failed to share'));
  } else {
    const textToShare = URL ? `${result}\n${URL}` : result;
    navigator.clipboard
      .writeText(textToShare)
      .then(() => alert('Results copied to clipboard!'))
      .catch(() => alert('Failed to copy results.'));
  }
}

export function generateGameId() {
  const s1 = Math.floor(Math.random() * letters.length);
  const s2 = Math.floor(Math.random() * letters.length);
  const s3 = Math.floor(Math.random() * letters.length);

  return `${letters[s1]}${letters[s2]}${letters[s3]}`;
}
