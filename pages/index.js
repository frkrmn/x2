import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

const STEPS = {
  INPUT: 'input',
  FETCHING: 'fetching',
  PREVIEW: 'preview',
  GENERATING: 'generating',
  UPLOADING: 'uploading',
  POSTING: 'posting',
  DONE: 'done',
  ERROR: 'error',
};

export default function Home() {
  const [xUrl, setXUrl] = useState('');
  const [step, setStep] = useState(STEPS.INPUT);
  const [postData, setPostData] = useState(null);
  const [caption, setCaption] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [publicImageUrl, setPublicImageUrl] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const canvasRef = useRef(null);

  const handleFetch = async () => {
    if (!xUrl.trim()) return;
    setStep(STEPS.FETCHING);
    setError('');

    try {
      const res = await fetch('/api/scrape-x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: xUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch post');

      setPostData(data);
      // Generate default caption
      const defaultCaption = `${data.text}\n\n— @${data.authorHandle} on X\n\n#twitter #x #viral #trending`;
      setCaption(defaultCaption);
      
      // Generate image preview
      await generatePreview(data);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  };

  const generatePreview = async (data) => {
    const params = new URLSearchParams({
      text: data.text || '',
      author: data.author || '',
      authorHandle: data.authorHandle || '',
    });
    // Use SVG endpoint as image preview
    setImagePreviewUrl(`/api/generate-image-preview?${params}`);
  };

  const handlePost = async () => {
    setError('');
    setStep(STEPS.GENERATING);

    try {
      // Step 1: Get SVG as base64
      const svgRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: postData?.text,
          author: postData?.author,
          authorHandle: postData?.authorHandle,
          tweetUrl: xUrl,
        }),
      });

      if (!svgRes.ok) throw new Error('Failed to generate image');
      const svgBlob = await svgRes.blob();
      const base64 = await blobToBase64(svgBlob);
      const base64Data = base64.split(',')[1];

      setStep(STEPS.UPLOADING);

      // Step 2: Upload to imgbb for public URL
      let finalImageUrl;

      if (useCustomImage && customImageUrl) {
        finalImageUrl = customImageUrl;
      } else {
        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ svgData: base64Data }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
        finalImageUrl = uploadData.url;
        setPublicImageUrl(finalImageUrl);
      }

      setStep(STEPS.POSTING);

      // Step 3: Post to Instagram
      const igRes = await fetch('/api/post-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: finalImageUrl,
          caption: caption,
        }),
      });

      const igData = await igRes.json();
      if (!igRes.ok) throw new Error(igData.error || 'Instagram post failed');

      setSuccessMsg(`✅ Posted! Instagram Post ID: ${igData.postId}`);
      setStep(STEPS.DONE);

    } catch (err) {
      setError(err.message);
      setStep(STEPS.PREVIEW); // Go back to preview on error
    }
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const reset = () => {
    setXUrl('');
    setStep(STEPS.INPUT);
    setPostData(null);
    setCaption('');
    setImagePreviewUrl(null);
    setPublicImageUrl(null);
    setError('');
    setSuccessMsg('');
    setUseCustomImage(false);
    setCustomImageUrl('');
  };

  const stepLabel = {
    [STEPS.FETCHING]: 'Fetching X post...',
    [STEPS.GENERATING]: 'Generating Instagram image...',
    [STEPS.UPLOADING]: 'Uploading image to hosting...',
    [STEPS.POSTING]: 'Publishing to Instagram...',
  };

  return (
    <>
      <Head>
        <title>X → Instagram</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app">
        <header>
          <div className="logo">
            <span className="logo-x">𝕏</span>
            <span className="logo-arrow">→</span>
            <span className="logo-ig">📸</span>
          </div>
          <h1>X to Instagram</h1>
          <p>Share any public X post to your Instagram in one click</p>
        </header>

        <main>
          {/* INPUT STEP */}
          {step === STEPS.INPUT && (
            <div className="card">
              <label className="field-label">Paste X (Twitter) Post URL</label>
              <div className="input-row">
                <input
                  type="url"
                  value={xUrl}
                  onChange={(e) => setXUrl(e.target.value)}
                  placeholder="https://x.com/user/status/123456789"
                  className="url-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                />
                <button onClick={handleFetch} className="btn-primary" disabled={!xUrl.trim()}>
                  Fetch Post
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATES */}
          {[STEPS.FETCHING, STEPS.GENERATING, STEPS.UPLOADING, STEPS.POSTING].includes(step) && (
            <div className="card loading-card">
              <div className="spinner" />
              <p className="loading-text">{stepLabel[step]}</p>
            </div>
          )}

          {/* PREVIEW STEP */}
          {step === STEPS.PREVIEW && postData && (
            <div className="preview-layout">
              {/* Image Preview */}
              <div className="card image-card">
                <h2>Instagram Image Preview</h2>
                <div className="ig-frame">
                  <div className="ig-image-wrapper">
                    {imagePreviewUrl && (
                      <img
                        src={`/api/generate-image?text=${encodeURIComponent(postData.text)}&author=${encodeURIComponent(postData.author)}&authorHandle=${encodeURIComponent(postData.authorHandle)}`}
                        alt="Instagram preview"
                        className="preview-img"
                      />
                    )}
                  </div>
                  <div className="ig-meta">
                    <span className="ig-badge">1080 × 1080 · Square</span>
                  </div>
                </div>
                
                <div className="custom-image-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={useCustomImage}
                      onChange={(e) => setUseCustomImage(e.target.checked)}
                    />
                    Use a custom image URL instead
                  </label>
                  {useCustomImage && (
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://example.com/your-image.jpg"
                      className="url-input mt-2"
                    />
                  )}
                </div>
              </div>

              {/* Caption Editor */}
              <div className="card caption-card">
                <h2>Caption</h2>
                <div className="post-meta">
                  <strong>{postData.author}</strong>
                  <span className="handle">@{postData.authorHandle}</span>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="caption-input"
                  rows={10}
                  maxLength={2200}
                />
                <div className="char-count">{caption.length} / 2200</div>

                <div className="action-row">
                  <button onClick={reset} className="btn-secondary">← Back</button>
                  <button
                    onClick={handlePost}
                    className="btn-post"
                    disabled={!caption.trim()}
                  >
                    🚀 Post to Instagram
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === STEPS.DONE && (
            <div className="card success-card">
              <div className="success-icon">🎉</div>
              <h2>Posted Successfully!</h2>
              <p className="success-msg">{successMsg}</p>
              {publicImageUrl && (
                <p className="small-link">
                  Image hosted at: <a href={publicImageUrl} target="_blank" rel="noreferrer">{publicImageUrl}</a>
                </p>
              )}
              <button onClick={reset} className="btn-primary mt-4">Post Another</button>
            </div>
          )}

          {/* ERROR */}
          {(step === STEPS.ERROR || error) && (
            <div className="card error-card">
              <p className="error-text">⚠️ {error}</p>
              {step === STEPS.ERROR && (
                <button onClick={reset} className="btn-secondary mt-2">Try Again</button>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f0f13;
          color: #e8e8f0;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .app {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        header {
          text-align: center;
          margin-bottom: 48px;
        }

        .logo {
          font-size: 48px;
          margin-bottom: 12px;
          letter-spacing: 4px;
        }

        .logo-x { color: #fff; }
        .logo-arrow { color: #667eea; margin: 0 8px; }
        .logo-ig { }

        h1 {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        header p {
          color: #888;
          font-size: 16px;
        }

        .card {
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .input-row {
          display: flex;
          gap: 12px;
        }

        .url-input {
          flex: 1;
          background: #0f0f13;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 14px 16px;
          color: #e8e8f0;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }

        .url-input:focus {
          border-color: #667eea;
        }

        .url-input::placeholder { color: #555; }

        .mt-2 { margin-top: 10px; }
        .mt-4 { margin-top: 20px; }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          white-space: nowrap;
        }

        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-secondary {
          background: #2a2a3a;
          color: #ccc;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-secondary:hover { background: #333; }

        .btn-post {
          background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }

        .btn-post:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-post:disabled { opacity: 0.4; cursor: not-allowed; }

        .loading-card {
          text-align: center;
          padding: 60px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #2a2a3a;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-text {
          color: #888;
          font-size: 16px;
        }

        /* Preview layout */
        .preview-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 700px) {
          .preview-layout { grid-template-columns: 1fr; }
          .input-row { flex-direction: column; }
        }

        h2 {
          font-size: 16px;
          font-weight: 700;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }

        .ig-frame { }

        .ig-image-wrapper {
          width: 100%;
          aspect-ratio: 1;
          background: #0f0f13;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #2a2a3a;
        }

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ig-meta {
          margin-top: 8px;
          text-align: center;
        }

        .ig-badge {
          font-size: 12px;
          color: #555;
          background: #1a1a24;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid #2a2a3a;
        }

        .custom-image-toggle {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #2a2a3a;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #888;
          cursor: pointer;
        }

        .toggle-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #667eea;
        }

        .caption-card { display: flex; flex-direction: column; gap: 14px; }

        .post-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
        }

        .handle { color: #667eea; }

        .caption-input {
          background: #0f0f13;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 14px;
          color: #e8e8f0;
          font-size: 14px;
          font-family: inherit;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }

        .caption-input:focus { border-color: #667eea; }

        .char-count {
          text-align: right;
          font-size: 12px;
          color: #555;
          margin-top: -8px;
        }

        .action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }

        /* Success */
        .success-card {
          text-align: center;
          padding: 60px 40px;
        }

        .success-icon { font-size: 64px; margin-bottom: 16px; }

        .success-card h2 {
          font-size: 28px;
          color: #e8e8f0;
          text-transform: none;
          letter-spacing: 0;
          margin-bottom: 12px;
        }

        .success-msg {
          color: #4caf50;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .small-link {
          font-size: 12px;
          color: #555;
          word-break: break-all;
        }

        .small-link a { color: #667eea; }

        /* Error */
        .error-card {
          border-color: #4a1515;
          background: #1a0f0f;
        }

        .error-text { color: #ff6b6b; font-size: 15px; }
      `}</style>
    </>
  );
}
