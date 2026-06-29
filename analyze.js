export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images, isAdditional } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

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
      'LED基板': 3000,
      'チューナー基板（上）': 1300,
      'チューナー基板（下）': 730,
      '電源基板': 215,
      'HDD本体': 125
    };

    const priceList = Object.entries(boardTypes)
      .map(([type, price]) => `- ${type}: ${price}円/kg`)
      .join('\n');

    let prompt;
    if (isAdditional) {
      prompt = `以下のK-Y Systemの基盤買取価格表から、与えられた${images.length}枚の画像の基盤がどのタイプに当てはまるかを判定してください。

【基盤タイプ一覧と買取価格（2026年6月11日現在）】
${priceList}

【複数画像での判定】
${images.length}枚の異なる角度からの画像を参考に、より正確に判定してください。複数の角度があるため、初回判定より信頼度を上げてください。

【判定ポイント】
1. 複数角度から基盤の全体像を把握
2. 色、形状、コネクタ、チップ配置を総合判定
3. 初回判定より確信度は高くなるはず

【回答フォーマット】
JSON形式で以下を返してください:
{
  "type": "判定された基盤タイプ名",
  "price": 買取価格（数値のみ）,
  "confidence": 信頼度（0-100の数値、前回より高い値が望ましい）,
  "reasoning": "複数角度の画像から判定した根拠を2-3行で説明",
  "revisedFromFirst": 初回判定から変更があったか（true/false）
}`;
    } else {
      prompt = `以下のK-Y Systemの基盤買取価格表から、与えられた画像の基盤がどのタイプに当てはまるかを判定してください。

【基盤タイプ一覧と買取価格（2026年6月11日現在）】
${priceList}

【画像1枚のみの判定】
最初の1枚の画像から判定してください。確信度が低い場合は、別角度の追加画像が役立つ可能性があることを記載してください。

【判定ポイント】
1. 基盤の色、形状、コネクタの有無を確認
2. チップの密集度や大きさを確認
3. 1枚の画像で判定可能な情報は限定的なため、判定信頼度を正直に評価

【回答フォーマット】
JSON形式で以下を返してください:
{
  "type": "判定された基盤タイプ名",
  "price": 買取価格（数値のみ）,
  "confidence": 信頼度（0-100の数値）,
  "reasoning": "判定の根拠を1-2行で説明",
  "needsAdditional": 追加画像があるとより正確か（true/false）
}`;
    }

    const imageContent = [
      { type: 'text', text: prompt },
      ...images.map(imageBase64 => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageBase64.split(',')[1] || imageBase64
        }
      }))
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: imageContent
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Claude API error'
      });
    }

    const responseText = data.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(400).json({
        error: 'Failed to parse Claude response'
      });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}
