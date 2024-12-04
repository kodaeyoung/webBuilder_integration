const axios = require('axios');

async function extractKeywords(text) {
  
  const prompt = `Extract the most relevant English keywords from the following text to use for image search. Respond in the format: keyword: word:
  
  Text:
  ${text}`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 60,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const keywords = response.data.choices[0].message.content.trim();
    return keywords;
  } catch (error) {
    console.error("Error extracting keywords:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error extracting keywords" });
  }
}

module.exports = extractKeywords;
