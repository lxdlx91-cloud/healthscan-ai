export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
            { text: `Analyze this food product image. Return ONLY valid JSON, no markdown:
{"productName":"name","brand":"brand","category":"Food","emoji":"🍎","healthScore":75,"rating":"Good","summary":"Brief summary.","nutrition":[{"emoji":"🔥","name":"Calories","value":"250 kcal","pct":60,"color":"#ff9800"},{"emoji":"🍬","name":"Sugar","value":"12g","pct":40,"color":"#f44336"},{"emoji":"🧂","name":"Sodium","value":"400mg","pct":35,"color":"#ff5722"},{"emoji":"🫙","name":"Carbs","value":"30g","pct":50,"color":"#ff9800"},{"emoji":"💪","name":"Protein","value":"8g","pct":25,"color":"#4caf50"}],"ingredients":[{"name":"Water","level":"safe"},{"name":"Sugar","level":"caution"}],"allergens":[{"name":"Gluten","present":false},{"name":"Dairy","present":false},{"name":"Nuts","present":false}],"recommendations":[{"emoji":"🛒","label":"Should I buy?","verdict":"Yes","bg":"#e8f5e9"},{"emoji":"👶","label":"Safe for children?","verdict":"Maybe","bg":"#fff3e0"},{"emoji":"🩺","label":"Diabetic-friendly?","verdict":"No","bg":"#ffebee"},{"emoji":"⚖️","label":"Weight loss?","verdict":"Maybe","bg":"#fff3e0"},{"emoji":"❤️","label":"Heart-friendly?","verdict":"Yes","bg":"#e8f5e9"},{"emoji":"🤰","label":"Safe for pregnancy?","verdict":"Maybe","bg":"#fff3e0"}],"alternatives":[{"emoji":"🥗","name":"Fresh Salad","score":"95"},{"emoji":"🍎","name":"Fruit","score":"92"}],"fullAnalysis":"Detailed health analysis here."}` }
          ]
        }]
      })
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ error: 'Gemini API error: ' + JSON.stringify(data) });
    }
    
    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
