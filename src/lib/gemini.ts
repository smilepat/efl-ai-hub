import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[gemini] GEMINI_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요.');
}

export const genAI = new GoogleGenerativeAI(apiKey ?? 'missing-key');

/** 기본 텍스트 생성 모델 */
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.4,
    topP: 0.9,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  },
});

/** JSON 파싱 헬퍼 (마크다운 코드블록 자동 제거) */
export function parseGeminiJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
