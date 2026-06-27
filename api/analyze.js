export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                text: `Analyze this food product image. Return ONLY a JSON object with no markdown:
{
  "productName": "name",
  "brand": "brand or Unknown",
  "category": "Food/Beverage/Snack",
  "emoji": "🍎",
  "healthScore": 75,
  "rating": "Good",
  "summary": "2 sentence summary.",
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
  "fullAnalysis": "Detailed 3-4 sentence health analysis."
}`
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
