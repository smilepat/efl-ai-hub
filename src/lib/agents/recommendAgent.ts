import { genAI as gemini } from '../gemini';

export interface RecommendResult {
  weak_skills: string[];
  recommended_question_types: string[];
  study_tip: string;
  recommended_task_id?: string;
  recommended_task_desc?: string;
}

export async function generateRecommendations(
  skillsData: any[],
  recentWrongs: any[],
  candidateTasks: any[] = []
): Promise<RecommendResult> {
  const model = gemini.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    }
  });

  const skillsText = skillsData.map(s => 
    `- ${s.skill}: 정답률 ${Math.round(s.correct_rate * 100)}% (${s.correct}/${s.total})`
  ).join('\\n');

  const wrongsText = recentWrongs.map(w => 
    `- 문항 유형: ${w.type}\\n  측정 스킬: ${w.skill}\\n  오답 내용: ${w.prompt}`
  ).join('\\n\\n');

  const tasksText = candidateTasks.map(t =>
    `- Task ID: ${t.id}\\n  유형: ${t.type}\\n  내용 요약: ${t.prompt}`
  ).join('\\n\\n');

  const prompt = `
당신은 고등학교 영어교사로서 학생의 진단 결과를 보고 맞춤형 복습 과제를 제안하는 AI 전문가입니다.
아래는 한 학생의 스킬별 정답률과 최근 오답 문항 목록, 그리고 현재 시스템에 준비된 '마이크로 학습 과업(Task)' 목록입니다.

[스킬별 정답률]
${skillsText}

[최근 오답 문항]
${wrongsText}

[학습 과업(Task) 후보군]
${tasksText || '현재 사용 가능한 Task가 없습니다.'}

이 데이터를 바탕으로 학생의 취약점을 파악하고, 구체적인 복습 팁과 학습 방향을 제안하세요.
그리고 만약 후보군 중에 학생의 약점 보완에 도움이 될 만한 마이크로 과업이 있다면 하나 추천해주세요. (약점이 structure라면 logicflow_chunking 추천이 좋습니다)

응답은 반드시 아래 JSON 형식을 엄격히 지켜서 출력하세요.
{
  "weak_skills": ["취약 스킬 ID 1", "취약 스킬 ID 2"],
  "recommended_question_types": ["빈칸추론", "문장삽입"],
  "study_tip": "학생에게 직접 말하는 친절한 어투의 구체적인 학습 조언 (3~4문장)",
  "recommended_task_id": "추천할 Task의 ID (없거나 적절한 것이 없으면 null)",
  "recommended_task_desc": "이 Task를 왜 추천하는지 이유 (1줄, 없으면 null)"
}`;

  const result = await model.generateContent(prompt);

  const responseText = result.response.text();
  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error('Failed to parse recommendation JSON:', responseText);
    return {
      weak_skills: [],
      recommended_question_types: [],
      study_tip: '데이터 분석 중 오류가 발생했습니다. 담당 선생님께 문의하세요.',
    };
  }
}
