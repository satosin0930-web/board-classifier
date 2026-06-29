'use client';

import { useRef, useState } from 'react';

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [photos, setPhotos] = useState([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoRef.current.srcObject = stream;
    } catch (err) {
      alert('カメラへのアクセスが拒否されました');
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setPhoto(imageData);
    setPhotos([...photos, imageData]);
  };

  const analyzePhoto = async () => {
    if (!photo) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [photo] })
      });
      
      const data = await response.json();
      setResult(data.result);
      setConfidence(data.confidence);
      
      if (data.confidence < 0.7) {
        alert('信頼度が低いため、追加撮影をお願いします');
        setPhoto(null);
      }
    } catch (err) {
      alert('分析エラー: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>基盤判定アプリ</h1>
      
      <button onClick={startCamera} style={{ padding: '10px', marginRight: '10px' }}>
        カメラ起動
      </button>
      
      <video ref={videoRef} style={{ width: '100%', marginTop: '10px' }} autoPlay />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {!photo ? (
        <button onClick={capturePhoto} style={{ padding: '10px', marginTop: '10px', width: '100%' }}>
          撮影
        </button>
      ) : (
        <>
          <img src={photo} style={{ width: '100%', marginTop: '10px' }} />
          <button onClick={analyzePhoto} disabled={loading} style={{ padding: '10px', marginTop: '10px', width: '100%' }}>
            {loading ? '分析中...' : '判定'}
          </button>
        </>
      )}
      
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <p><strong>判定結果:</strong> {result.type}</p>
          <p><strong>買取価格:</strong> ¥{result.price}</p>
          <p><strong>信頼度:</strong> {(confidence * 100).toFixed(1)}%</p>
          <div style={{ width: '100%', height: '20px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${confidence * 100}%`, height: '100%', background: '#4CAF50' }} />
          </div>
        </div>
      )}
    </div>
  );
}
