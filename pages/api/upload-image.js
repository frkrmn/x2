// Uploads image to imgbb (free, no account needed for API key based upload)
// Returns a public URL that Instagram can fetch

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { svgData } = req.body; // base64 encoded image or SVG string

  const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '9593345208a5bfeb3204d09da7646b2a';

  try {
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', svgData); // base64 string

    const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await uploadRes.json();

    if (!data.success) {
      return res.status(400).json({ error: 'Image upload failed', details: data });
    }

    return res.status(200).json({
      url: data.data.url,
      displayUrl: data.data.display_url,
    });

  } catch (err) {
    return res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
}
