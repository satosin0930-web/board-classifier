export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { images } = req.body;
  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const base64Image = images[0].split(',')[1];

    const boardTypes = {
      'SSクラス基板': 6590,
      'Sクラス基板': 5060,
      'KYクラス基板': 3880,
      'Aクラス基板': 2250,
      'Bクラス基板': 1940,
      'Cクラス基板': 1120,
      'Dクラス基板': 620,
      'マザーボード（PC98系）': 2800,
      'マザーボード（A）': 2460,
      'マザーボード（B）': 1860,
      'マザーボード（C）': 850,
      'マザーボード ノート（上）': 3800,
      'マザーボード ノート（下）': 900,
      '拡張カード（A）': 3500,
      '拡張カード（B）': 2230,
      '拡張カード（C）': 1020,
      'メモリ': 8830,
      'HDD基板': 3950,
      'PCカード': 3160,
      '携帯電話基板': 11000,
      'CPUビラ豆がし': 49700,
      'CPUビラAMD': 22100,
      'CPUブラック': 19500,
      'CPUグリーン（上）': 6500,
      'CPUグリーン（下）': 3400,
      'CPUセラ長方形（金）': 19500,
      'CPUカード': 4500,
      'IC（正方形混合）': 10600,
      'IC（長方形混合）': 1000,
      '金メッキ品': 5000,
      'チューナー基板（上）': 1300,
      'チューナー基板（下）': 730,
      '電源基板': 215,
      'HDD本体': 125,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `この基盤の写真を見て、K-Y System（https://www.k-y-system.jp/）の基盤種別に分類してください。以下の種別の中から最も適切なものを選んでください。必ず日本語で以下の形式で回答してください：
                
【判定結果】
種別: ${Object.keys(boardTypes).join(', ')}
確信度: 0.0から1.0の値（例：0.95）
理由: 判定の理由を簡潔に説明`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content[0]?.text || '';

    const typeMatch = text.match(/種別:\s*([^\n]+)/);
    const confidenceMatch = text.match(/確信度:\s*([\d.]+)/);

    const boardType = typeMatch ? typeMatch[1].trim() : 'その他';
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    const price = boardTypes[boardType] || 1000;

    res.status(200).json({
      result: {
        type: boardType,
        price: price,
        reason: text,
      },
      confidence: confidence,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
