export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Extract tweet ID from URL
  const tweetIdMatch = url.match(/status\/(\d+)/);
  if (!tweetIdMatch) return res.status(400).json({ error: 'Invalid X/Twitter URL' });

  const tweetId = tweetIdMatch[1];

  try {
    // Use Twitter/X oEmbed API (no auth needed) for basic data
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const oembedRes = await fetch(oembedUrl);
    
    if (!oembedRes.ok) throw new Error('Failed to fetch tweet');
    
    const oembedData = await oembedRes.json();
    
    // Parse the HTML to extract text
    const html = oembedData.html || '';
    
    // Extract text from the <p> tag in oEmbed HTML
    const textMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    let rawText = textMatch ? textMatch[1] : '';
    
    // Clean HTML tags
    rawText = rawText
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '$2')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    // Try to extract image from oEmbed or use a placeholder
    // For images we try the Twitter syndication endpoint
    let imageUrl = null;
    
    // Check if there's media in the URL by checking syndication
    try {
      const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
      const synRes = await fetch(syndicationUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (synRes.ok) {
        const synData = await synRes.json();
        const media = synData?.mediaDetails?.[0];
        if (media?.media_url_https) {
          imageUrl = media.media_url_https;
        }
      }
    } catch (e) {
      // No image available
    }

    return res.status(200).json({
      text: rawText,
      author: oembedData.author_name || '',
      authorHandle: oembedData.author_url?.split('/').pop() || '',
      imageUrl,
      tweetId,
      url,
    });

  } catch (err) {
    console.error('Scrape error:', err);
    return res.status(500).json({ error: 'Failed to fetch X post. Make sure the post is public.' });
  }
}
