// GET version of generate-image for <img> tags
export default async function handler(req, res) {
  const { text = '', author = '', authorHandle = '' } = req.query;

  const svg = generateTweetCard({ text, author, authorHandle });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(svg);
}

function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function generateTweetCard({ text, author, authorHandle }) {
  const MAX_CHARS = 42;
  const lines = wrapText(text || '', MAX_CHARS);
  const MAX_LINES = 12;
  const displayLines = lines.slice(0, MAX_LINES);
  const truncated = lines.length > MAX_LINES;

  const fontSize = displayLines.length > 8 ? 28 : 32;
  const lineHeight = fontSize * 1.5;
  const textStartY = 260;

  const textElements = displayLines.map((line, i) => {
    const y = textStartY + i * lineHeight;
    const safe = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<text x="90" y="${y}" font-family="Georgia, serif" font-size="${fontSize}" fill="#1a1a2e" text-anchor="start">${safe}</text>`;
  }).join('\n');

  const safeAuthor = (author || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeHandle = (authorHandle || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8f9ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="950" cy="100" r="200" fill="white" fill-opacity="0.05"/>
  <circle cx="100" cy="950" r="150" fill="white" fill-opacity="0.05"/>
  <circle cx="1000" cy="900" r="100" fill="white" fill-opacity="0.08"/>
  <rect x="60" y="60" width="960" height="960" rx="32" fill="url(#card)" filter="drop-shadow(0 20px 60px rgba(0,0,0,0.25))"/>
  <rect x="60" y="60" width="960" height="8" rx="4" fill="url(#bg)"/>
  <g transform="translate(90, 110)">
    <rect width="60" height="60" rx="12" fill="#000000"/>
    <text x="30" y="43" font-family="Arial" font-size="32" fill="white" text-anchor="middle" font-weight="bold">&#x1D54F;</text>
  </g>
  <text x="165" y="135" font-family="Arial, sans-serif" font-size="20" fill="#888" font-weight="500">Shared from X (Twitter)</text>
  <line x1="90" y1="175" x2="990" y2="175" stroke="#eee" stroke-width="2"/>
  <text x="80" y="200" font-family="Georgia, serif" font-size="80" fill="#667eea" opacity="0.4">"</text>
  ${textElements}
  ${truncated ? `<text x="90" y="${textStartY + displayLines.length * lineHeight}" font-family="Georgia, serif" font-size="${fontSize}" fill="#999">...</text>` : ''}
  <text x="940" y="${Math.min(textStartY + (displayLines.length + 1) * lineHeight, 850)}" font-family="Georgia, serif" font-size="80" fill="#667eea" opacity="0.4" text-anchor="end">"</text>
  <line x1="90" y1="905" x2="990" y2="905" stroke="#eee" stroke-width="2"/>
  <circle cx="120" cy="960" r="32" fill="url(#bg)"/>
  <text x="120" y="967" font-family="Arial" font-size="22" fill="white" text-anchor="middle">${safeAuthor ? safeAuthor[0].toUpperCase() : 'X'}</text>
  <text x="168" y="952" font-family="Arial, sans-serif" font-size="24" fill="#1a1a2e" font-weight="700">${safeAuthor}</text>
  <text x="168" y="978" font-family="Arial, sans-serif" font-size="20" fill="#667eea">@${safeHandle}</text>
  <text x="990" y="975" font-family="Arial" font-size="28" fill="#ccc" text-anchor="end" font-weight="bold">&#x1D54F;</text>
</svg>`;
}
