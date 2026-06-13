export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageUrl, caption } = req.body;

  const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
  const IG_USER_ID = process.env.IG_USER_ID;

  if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    return res.status(500).json({ error: 'Instagram credentials not configured in environment variables.' });
  }

  if (!imageUrl || !caption) {
    return res.status(400).json({ error: 'imageUrl and caption are required' });
  }

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.instagram.com/v21.0/${IG_USER_ID}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: IG_ACCESS_TOKEN,
        }),
      }
    );

    const containerData = await containerRes.json();

    if (!containerRes.ok || containerData.error) {
      console.error('Container error:', containerData);
      return res.status(400).json({
        error: containerData.error?.message || 'Failed to create Instagram media container',
        details: containerData,
      });
    }

    const creationId = containerData.id;

    // Step 2: Wait a moment then publish
    await new Promise((r) => setTimeout(r, 3000));

    // Step 3: Publish the container
    const publishRes = await fetch(
      `https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: IG_ACCESS_TOKEN,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (!publishRes.ok || publishData.error) {
      console.error('Publish error:', publishData);
      return res.status(400).json({
        error: publishData.error?.message || 'Failed to publish to Instagram',
        details: publishData,
      });
    }

    return res.status(200).json({
      success: true,
      postId: publishData.id,
      message: 'Successfully posted to Instagram!',
    });

  } catch (err) {
    console.error('Instagram post error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
