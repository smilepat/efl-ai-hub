import { geminiModel, parseGeminiJson } from '@/lib/gemini';

// ── 타입 정의 ──────────────────────────────────────────────────
export interface KeyVocab {
  word: string;
  meaning_kr: string;
  cefr: string;
  pos: string;
  in_vocab_db: boolean;   // vocab-db 9183단어 내 존재 여부
  word_id?: string;        // vocab-db word_id (있을 경우)
}

export interface Connective {
  word: string;
  type: 'contrast' | 'addition' | 'cause' | 'result' | 'sequence' | 'example' | 'other';
  sentence_index: number;
}

export interface SentenceInfo {
  index: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  word_count: number;
  is_long: boolean;        // 단어 25개 이상
}

export interface PassageAnalysis {
  topic: string;
  main_idea: string;
  level: 'A2' | 'B1' | 'B2' | 'C1';
  word_count: number;
  key_vocab: KeyVocab[];
  connectives: Connective[];
  sentences: SentenceInfo[];
  reading_skills: string[];  // 이 지문에서 측정 가능한 독해 스킬
}

// ── 프롬프트 ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `
당신은 한국 고등학교 영어교사를 위한 전문 지문 분석 AI입니다.
한국 수능/내신 영어 문제 출제 방식과 CEFR 기준을 잘 알고 있습니다.
반드시 JSON만 응답하세요. 추가 설명 없이 순수 JSON 객체만 출력합니다.
`.trim();

// ── 분석 에이전트 ──────────────────────────────────────────────
export async function analyzePassage(text: string): Promise<PassageAnalysis> {
  const wordCount = text.trim().split(/\s+/).length;

  const prompt = `${SYSTEM_PROMPT}

다음 영어 지문을 분석하여 아래 JSON 형식으로 정확히 응답하세요.

=== 지문 ===
${text}
=== 지문 끝 ===

응답 JSON 형식:
{
  "topic": "주제 키워드 (영어, 예: psychology, environment, technology)",
  "main_idea": "주제문 또는 요지 (한국어, 1~2문장)",
  "level": "CEFR 레벨 (A2|B1|B2|C1 중 하나)",
  "word_count": ${wordCount},
  "key_vocab": [
    {
      "word": "단어(소문자)",
      "meaning_kr": "한국어 뜻",
      "cefr": "A2|B1|B2|C1",
      "pos": "n|v|adj|adv|prep|conj",
      "in_vocab_db": false,
      "word_id": null
    }
  ],
  "connectives": [
    {
      "word": "연결어",
      "type": "contrast|addition|cause|result|sequence|example|other",
      "sentence_index": 0
    }
  ],
  "sentences": [
    {
      "index": 0,
      "text": "문장 텍스트",
      "difficulty": "easy|medium|hard",
      "word_count": 10,
      "is_long": false
    }
  ],
  "reading_skills": ["vocabulary", "inference", "main_idea", "cohesion", "structure"]
}

규칙:
- key_vocab: 교육적으로 중요한 단어 6~12개 선별 (관사·전치사 제외)
- sentences: 지문의 모든 문장 (문장부호 기준으로 분리)
- is_long: 단어 25개 이상이면 true
- difficulty: easy=단문·기본어휘, medium=복문·B1어휘, hard=복잡구문·B2이상 어휘
- reading_skills: 이 지문으로 측정 가능한 스킬만 포함`;

  const result = await geminiModel.generateContent(prompt);
  const raw    = result.response.text();

  try {
    return parseGeminiJson<PassageAnalysis>(raw);
  } catch {
    throw new Error(`지문 분석 결과 파싱 실패: ${raw.slice(0, 200)}`);
  }
}
