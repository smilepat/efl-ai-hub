import { geminiModel, parseGeminiJson } from '@/lib/gemini';
import type { PassageAnalysis } from './analyzeAgent';

// ── 타입 정의 ──────────────────────────────────────────────────
export type QuestionType = 'vocab' | 'blank' | 'main_idea' | 'order' | 'insert';

export interface GeneratedQuestion {
  type: QuestionType;
  depth: number;
  prompt: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  answer: 'A' | 'B' | 'C' | 'D';
  skill: string;
  explanation: string;   // 해설 (한국어)
  irt_b: number;         // 추정 난이도 (-2 ~ 2)
}

// ── 유형별 한국어 설명 ──────────────────────────────────────────
const TYPE_LABELS: Record<QuestionType, string> = {
  vocab:      '어휘 문제',
  blank:      '빈칸 완성',
  main_idea:  '주제·요지',
  order:      '글의 순서',
  insert:     '문장 삽입',
};

// ── 문항 생성 에이전트 ──────────────────────────────────────────
export async function generateQuestions(
  passageText: string,
  analysis: PassageAnalysis,
  types: QuestionType[] = ['vocab', 'blank', 'main_idea', 'order', 'insert']
): Promise<GeneratedQuestion[]> {

  const prompt = `
당신은 한국 수능 영어 문제 출제 전문가입니다.
반드시 JSON 배열만 응답하세요. 마크다운 없이 순수 JSON 배열만 출력합니다.

=== 영어 지문 ===
${passageText}
=== 지문 끝 ===

=== 지문 분석 정보 ===
- 주제: ${analysis.topic}
- 요지: ${analysis.main_idea}
- 레벨: ${analysis.level}
- 핵심어휘: ${analysis.key_vocab.map(v => `${v.word}(${v.meaning_kr})`).join(', ')}
=== 분석 끝 ===

아래 문항 유형으로 각 1문항씩 총 ${types.length}문항을 생성하세요: ${types.map(t => TYPE_LABELS[t]).join(', ')}

각 문항의 JSON 형식:
{
  "type": "vocab|blank|main_idea|order|insert",
  "depth": 2 또는 3,
  "prompt": "문항 지문 (한국어 안내문 + 영어 내용)",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "A|B|C|D",
  "skill": "vocabulary|inference|main_idea|cohesion|structure",
  "explanation": "정답 해설 (한국어, 2~3문장)",
  "irt_b": 0.0
}

유형별 출제 규칙:
1. vocab (어휘): 지문 핵심 단어 밑줄 → 문맥상 의미 고르기 (4지선다). depth=2
2. blank (빈칸): 지문에서 핵심 단어/구 삭제 → 적절한 표현 고르기 (4지선다). depth=3
3. main_idea (주제·요지): 지문의 주제 또는 요지로 적절한 것 고르기 (4지선다). depth=3
4. order (글의 순서): 지문을 3단락으로 나누어 순서 배열하기 (A=순서 표기). depth=3
5. insert (문장 삽입): 주어진 문장이 들어갈 적절한 위치 고르기 (4지선다). depth=3

품질 기준:
- 수능 스타일 오답 선택지 (그럴듯하지만 틀린 것)
- 정답은 A~D 중 균등하게 배분
- irt_b: vocab=-0.5~0.5, blank=0~1.0, main_idea=0.5~1.5, order/insert=1.0~2.0
- prompt에 지문 관련 내용 명확히 포함

응답: JSON 배열 [ {...}, {...}, ... ]
`.trim();

  const result = await geminiModel.generateContent(prompt);
  const raw    = result.response.text();

  try {
    return parseGeminiJson<GeneratedQuestion[]>(raw);
  } catch {
    throw new Error(`문항 생성 결과 파싱 실패: ${raw.slice(0, 200)}`);
  }
}
