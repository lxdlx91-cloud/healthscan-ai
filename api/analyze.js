export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  const prompt = `You are a food health analyst. Analyze this food product image and return ONLY a JSON object (no markdown, no explanation).

Return this exact JSON structure:
{
  "productName": "Product name",
  "brand": "Brand name or Unknown",
  "category": "Food/Beverage/Snack/etc",
  "emoji": "relevant emoji",
  "healthScore": 75,
  "rating": "Good",
  "summary": "2 sentence summary here.",
  "nutrition": [
    {"emoji":"🔥","name":"Calories","value":"250 kcal","pct":60,"color":"#ff9800"},
    {"emoji":"🍬","name":"Sugar","value":"12g","pct":40,"color":"#f44336"},
    {"emoji":"🧂","name":"Sodium","value":"400mg","pct":35,"color":"#ff5722"},
    {"emoji":"🫙","name":"Carbs","value":"30g","pct":50,"color":"#ff9800"},
    {"emoji":"💪","name":"Protein","value":"8g","pct":25,"color":"#4caf50"}
  ],
  "ingredients": [
    {"name":"Water","level":"safe"},
    {"name":"Sugar","level":"caution"},
    {"name":"Preservatives","level":"avoid"}
  ],
  "allergens": [
    {"name":"Gluten","present":false},
    {"name":"Dairy","present":false},
    {"name":"Nuts","present":false},
    {"name":"Eggs","present":false},
    {"name":"Soy","present":false}
  ],
  "recommendations": [
    {"emoji":"🛒","label":"Should I buy?","verdict":"Yes","bg":"#e8f5e9"},
    {"emoji":"👶","label":"Safe for children?","verdict":"Maybe","bg":"#fff3e0"},
    {"emoji":"🩺","label":"Diabetic-friendly?","verdict":"No","bg":"#ffebee"},
    {"emoji":"⚖️","label":"Weight loss?","verdict":"Maybe","bg":"#fff3e0"},
    {"emoji":"❤️","label":"Heart-friendly?","verdict":"Yes","bg":"#e8f5e9"},
    {"emoji":"🤰","label":"Safe for pregnancy?","verdict":"Maybe","bg":"#fff3e0"}
  ],
  "alternatives": [
    {"emoji":"🥗","name":"Fresh Salad","score":"95"},
    {"emoji":"🍎","name":"Fresh Fruit","score":"92"},
    {"emoji":"🫧","name":"Water","score":"100"}
  ],
  "fullAnalysis": "Detailed 3-4 sentence health analysis of this product."
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
