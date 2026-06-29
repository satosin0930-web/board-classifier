import { useState, useRef, useEffect } from 'react';

const boardCategories = {
  'SSクラス基板': 'A',
  'Sクラス基板': 'A',
  'KYクラス基板': 'A',
  'Aクラス基板': 'B',
  'Bクラス基板': 'B',
  'Cクラス基板': 'B',
  'Dクラス基板': 'B',
  'マザーボード（PC98系）': 'C',
  'マザーボード（A）': 'C',
  'マザーボード（B）': 'C',
  'マザーボード（C）': 'C',
  'マザーボード ノート（上）': 'C',
  'マザーボード ノート（下）': 'C',
  '拡張カード（A）': 'D',
  '拡張カード（B）': 'D',
  '拡張カード（C）': 'D',
  'メモリ': 'E',
  'HDD基板': 'E',
  'PCカード': 'F',
  '携帯電話基板': 'F',
  'CPUビラ豆がし': 'G',
  'CPUビラAMD': 'G',
  'CPUブラック': 'G',
  'CPUグリーン（上）': 'G',
  'CPUグリーン（下）': 'G',
  'CPUセラ長方形（金）': 'G',
  'CPUカード': 'H',
  'IC（正方形混合）': 'H',
  'IC（長方形混合）': 'H',
  '金メッキ品': 'I',
  'LED基板': 'J',
  'チューナー基板（上）': 'K',
  'チューナー基板（下）': 'K',
  '電源基板': 'K',
  'HDD本体': 'L'
};

export default function Home() {
  const [screen, setScreen] = useState('camera');
  const [currentImageData, setCurrentImageData] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (screen === 'camera') {
      initCamera();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [screen, facingMode]);

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('カメラへのアクセスが拒否されました');
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    setCurrentImageData(imageData);
    setAdditionalImages([]);
    setScreen('analysis');
    analyzeFirstImage(imageData);
  }

  async function analyzeFirstImage(imageData) {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [imageData],
          isAdditional: false
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setCurrentResult(result);
      setScreen('result');
    } catch (error) {
      alert('エラー: ' + error.message);
      setScreen('camera');
    } finally {
      setLoading(false);
    }
  }

  async function analyzeWithAdditional() {
    setLoading(true);
    setScreen('analysis');
    try {
      const allImages = [currentImageData, ...additionalImages];
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: allImages,
          isAdditional: true
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setCurrentResult(result);
      setScreen('result');
    } catch (error) {
      alert('エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function addAdditionalImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newImages = [...additionalImages, ev.target.result];
        setAdditionalImages(newImages);
        if (newImages.length > 0) {
          analyzeWithAdditional();
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function resetToCamera() {
    setCurrentImageData(null);
    setAdditionalImages([]);
    setCurrentResult(null);
    setScreen('camera');
  }

  // Screen 1: Camera
  if (screen === 'camera') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>基盤判定アプリ</h1>
        <p style={styles.stepText}>ステップ 1/3: 基盤を撮影してください</p>

        <video ref={videoRef} autoPlay playsInline style={styles.video} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={styles.buttonGroup}>
          <button onClick={capturePhoto} style={{ ...styles.button, ...styles.primaryButton }}>
            📸 撮影
          </button>
          <button onClick={() => setFacingMode(fm => fm === 'environment' ? 'user' : 'environment')} 
                  style={styles.button}>
            🔄 カメラ切替
          </button>
        </div>

        <div style={styles.infoPanel}>
          <p style={styles.infoText}>
            💡 <strong>撮影のコツ</strong><br/>
            基盤全体が見えるように、真正面から光を当てて撮影してください。
          </p>
        </div>
      </div>
    );
  }

  // Screen 2: Loading
  if (screen === 'analysis') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>分析中...</h1>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Claude が画像を分析しています</p>
        </div>
      </div>
    );
  }

  // Screen 3: Result
  if (screen === 'result' && currentResult) {
    const confidence = currentResult.confidence;
    const confidenceBadge = confidence >= 70 ? '✅ 判定確定' : '⚠️ 精度が低い';
    const needsAdditional = confidence < 70 && additionalImages.length === 0;
    const category = boardCategories[currentResult.type] || '不明';

    return (
      <div style={styles.container}>
        <h1 style={styles.title}>判定結果</h1>
        <p style={styles.stepText}>
          {additionalImages.length === 0 
            ? 'ステップ 2/3: 初期判定結果'
            : `ステップ 3/3: 再分析結果（${additionalImages.length + 1}枚で判定）`}
        </p>

        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <div>
              <div style={styles.resultType}>{currentResult.type}</div>
              <p style={styles.resultCategory}>カテゴリ: {category}</p>
            </div>
            <div style={styles.priceSection}>
              <div style={styles.price}>¥{currentResult.price.toLocaleString()}</div>
              <div style={styles.priceUnit}>/kg</div>
            </div>
          </div>

          <div style={styles.badge(confidence)}>{confidenceBadge}</div>

          <div style={styles.confidenceSection}>
            <p style={styles.label}>判定信頼度</p>
            <div style={styles.confidenceBar}>
              <div style={{ ...styles.confidenceFill, width: `${confidence}%` }}></div>
            </div>
            <p style={styles.confidencePercent}>{confidence}%</p>
          </div>

          <div style={styles.reasoningSection}>
            <p style={styles.label}>判定理由</p>
            <p style={styles.reasoning}>{currentResult.reasoning}</p>
          </div>
        </div>

        {needsAdditional && (
          <div style={styles.messageWarning}>
            💡 <strong>精度を高めるため、別角度の追加画像をお願いします</strong><br/>
            異なる角度（表・裏・斜めなど）から撮影すると、より正確に判定できます。
          </div>
        )}

        {additionalImages.length > 0 && (
          <div style={styles.messageSuccess}>
            ✅ 複数画像での再分析が完了しました
          </div>
        )}

        {needsAdditional && (
          <button onClick={addAdditionalImage} style={{ ...styles.button, ...styles.primaryButton, width: '100%', marginBottom: '0.5rem' }}>
            📷 追加画像を撮影
          </button>
        )}

        <div style={styles.imagePreviewSection}>
          <p style={styles.sectionTitle}>撮影画像</p>
          <div style={styles.imageGrid}>
            <div style={styles.imageThumbnail}>
              <img src={currentImageData} alt="初期" style={styles.thumbnailImg} />
              <div style={styles.thumbnailLabel}>初期</div>
            </div>
            {additionalImages.map((img, idx) => (
              <div key={idx} style={styles.imageThumbnail}>
                <img src={img} alt={`追加${idx + 1}`} style={styles.thumbnailImg} />
                <div style={styles.thumbnailLabel}>追加{idx + 1}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={resetToCamera} style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}>
            🔄 別の基盤を判定
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  stepText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '1rem'
  },
  video: {
    width: '100%',
    borderRadius: '12px',
    marginBottom: '1rem',
    backgroundColor: '#000'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1rem'
  },
  button: {
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none'
  },
  infoPanel: {
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '1rem'
  },
  infoText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem'
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: '3px solid #ddd',
    borderTopColor: '#0066cc',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    margin: '0 auto 1rem'
  },
  resultCard: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1rem'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #ddd'
  },
  resultType: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  resultCategory: {
    fontSize: '12px',
    color: '#666',
    margin: '4px 0 0 0'
  },
  priceSection: {
    textAlign: 'right'
  },
  price: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#0066cc'
  },
  priceUnit: {
    fontSize: '11px',
    color: '#666'
  },
  badge: (confidence) => ({
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '1rem',
    backgroundColor: confidence >= 70 ? '#e8f5e9' : '#fff3e0',
    color: confidence >= 70 ? '#2e7d32' : '#f57f17'
  }),
  confidenceSection: {
    marginBottom: '1rem'
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px'
  },
  confidenceBar: {
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    transition: 'width 0.3s'
  },
  confidencePercent: {
    fontSize: '13px',
    fontWeight: '500',
    margin: 0
  },
  reasoningSection: {
    borderTop: '1px solid #ddd',
    paddingTop: '1rem'
  },
  reasoning: {
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.6',
    margin: '0'
  },
  messageWarning: {
    backgroundColor: '#fff3e0',
    color: '#f57f17',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '13px'
  },
  messageSuccess: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '13px'
  },
  imagePreviewSection: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #ddd'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '0.5rem'
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '8px',
    marginTop: '1rem'
  },
  imageThumbnail: {
    position: 'relative',
    aspectRatio: '1',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #ddd'
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  thumbnailLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '2px 4px',
    fontSize: '10px'
  }
};
