/**
 * labelAgent.ts
 * 수능 문항 유형(question_type) → EFL Hub skill + irt_b 규칙 기반 매핑
 * Gemini API 불필요 — csat-graphdb schema.cypher REQUIRES_SKILL 관계 기반
 */

export interface SkillLabel {
  skill: string;        // EFL Hub skill ID (vocabulary/inference/main_idea/cohesion/structure)
  irt_b: number;        // 추정 IRT 난이도 (-2 ~ 2)
  depth: number;        // 문항 심층도 (2 or 3)
  type: string;         // EFL Hub type (vocab/blank/main_idea/order/insert)
}

// ── 수능 문항 유형 → EFL Hub 스킬 규칙 테이블 ─────────────────────────────
// 출처: csat-graphdb/data/schema.cypher (REQUIRES_SKILL 관계)
// irt_b: CSV의 points(2/3) 및 문항 유형 난이도 통계 기반 추정
const TYPE_MAP: Record<string, SkillLabel> = {
  '빈칸추론':    { skill: 'inference',  irt_b: 1.2, depth: 3, type: 'blank'     },
  '순서배열':    { skill: 'structure',  irt_b: 1.0, depth: 3, type: 'order'     },
  '문장삽입':    { skill: 'cohesion',   irt_b: 1.1, depth: 3, type: 'insert'    },
  '무관한문장':  { skill: 'cohesion',   irt_b: 0.9, depth: 2, type: 'insert'    },
  '주제요지':    { skill: 'main_idea',  irt_b: 0.5, depth: 2, type: 'main_idea' },
  '제목추론':    { skill: 'main_idea',  irt_b: 0.8, depth: 2, type: 'main_idea' },
  '함축의미추론':{ skill: 'inference',  irt_b: 1.3, depth: 3, type: 'blank'     },
  '어휘추론':    { skill: 'vocabulary', irt_b: 0.7, depth: 2, type: 'vocab'     },
  '어법판단':    { skill: 'vocabulary', irt_b: 0.8, depth: 3, type: 'vocab'     },
  '심경분위기':  { skill: 'inference',  irt_b: 0.3, depth: 2, type: 'main_idea' },
  '목적파악':    { skill: 'main_idea',  irt_b: 0.2, depth: 2, type: 'main_idea' },
  '내용일치':    { skill: 'inference',  irt_b: 0.1, depth: 2, type: 'main_idea' },
  '지칭추론':    { skill: 'inference',  irt_b: 0.6, depth: 2, type: 'blank'     },
  '실용문이해':  { skill: 'inference',  irt_b: 0.0, depth: 2, type: 'main_idea' },
  '요약완성':    { skill: 'main_idea',  irt_b: 1.0, depth: 2, type: 'blank'     },
};

// 기본값 (알 수 없는 유형)
const DEFAULT_LABEL: SkillLabel = {
  skill: 'inference',
  irt_b: 0.5,
  depth: 2,
  type: 'main_idea',
};

/**
 * 수능 문항 유형 문자열에서 스킬 라벨 반환
 */
export function labelByType(questionType: string | null | undefined): SkillLabel {
  if (!questionType) return DEFAULT_LABEL;
  return TYPE_MAP[questionType.trim()] ?? DEFAULT_LABEL;
}

/**
 * 배점(points)으로 irt_b 보정
 * 3점짜리는 전반적으로 더 어려우므로 +0.3 보정
 */
export function adjustByPoints(label: SkillLabel, points: number): SkillLabel {
  if (points === 3) {
    return { ...label, irt_b: Math.min(label.irt_b + 0.3, 2.0), depth: 3 };
  }
  return label;
}

/**
 * Lexile 지수 → CEFR 레벨 변환
 */
export function lexileToCefr(lexile: number | null): string {
  if (!lexile) return 'B1';
  if (lexile < 500)  return 'A2';
  if (lexile < 700)  return 'B1';
  if (lexile < 900)  return 'B2';
  if (lexile < 1100) return 'C1';
  return 'C1';
}

/**
 * 전체 라벨링 파이프라인
 */
export function labelCsatItem(
  questionType: string | null,
  points: number = 2,
  lexile?: number | null,
) {
  const base  = labelByType(questionType);
  const label = adjustByPoints(base, points);
  const level = lexileToCefr(lexile ?? null);
  return { ...label, level };
}
