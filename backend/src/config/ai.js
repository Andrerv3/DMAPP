// backend/src/config/ai.js
// Gemini 2.0 Flash client wrapper

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-2.0-flash'

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} temperature 0-1
 * @returns {Promise<string>} raw text response
 */
export async function callAI(systemPrompt, userPrompt, temperature = 0.8) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const url = `${GEMINI_BASE_URL}/${MODEL}:generateContent?key=${apiKey}`

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature,
      topP: 0.9,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
