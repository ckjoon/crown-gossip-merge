// characters.ts — 이야기·손님 캐릭터 목록. portraitKey로 치비 초상화(views/art/portraits)를 그리고, 없으면 face 이모지를 보여 준다

export interface Character {
  id: string;
  name: string;
  role: string;
  face: string;
  portraitKey: string | null;
}

export const CHARACTERS: Record<string, Character> = {
  selene: { id: "selene", name: "대마녀 셀레네", role: "마녀의 성 주인", face: "🧙‍♀️", portraitKey: "selene" },
  quinn: { id: "quinn", name: "조사관 퀸", role: "왕실 조사관", face: "🕵️‍♀️", portraitKey: "quinn" },
  nero: { id: "nero", name: "사역마 네로", role: "셀레네의 고양이 사역마", face: "🐈‍⬛", portraitKey: "nero" },
  quinn_nero: { id: "quinn_nero", name: "조사관 퀸 & 네로", role: "조사관과 사역마", face: "🕵️‍♀️", portraitKey: "quinn_nero" },
  lucian: { id: "lucian", name: "루시안 공작", role: "성의 오랜 후원자", face: "🧛‍♂️", portraitKey: "lucian" },
  olivia: { id: "olivia", name: "올리비아", role: "베이커리 단골 소녀", face: "👧", portraitKey: "olivia" },
  harrison: { id: "harrison", name: "해리슨", role: "별빛로드 상인", face: "🧔‍♂️", portraitKey: "harrison" },
  carmen: { id: "carmen", name: "건축가 카르멘", role: "성 복원 건축가", face: "👩‍🎨", portraitKey: "carmen" },
  marco: { id: "marco", name: "선장 마르코", role: "하버 선장", face: "⚓", portraitKey: "marco" },
  ella: { id: "ella", name: "카페 단골 엘라", role: "오션카페 단골", face: "☕", portraitKey: "ella" },
  pip: { id: "pip", name: "갈매기 우편배달부 핍", role: "갈매기 우편배달부", face: "🐦", portraitKey: "pip" },
  rowan: { id: "rowan", name: "정원사 로완", role: "온실 정원사", face: "🧑‍🌾", portraitKey: "rowan" },
  lily: { id: "lily", name: "꽃의 요정 릴리", role: "꽃의 요정", face: "🧚", portraitKey: "lily" },
  verna: { id: "verna", name: "식물학자 베르나", role: "식물학자", face: "👩‍🔬", portraitKey: "verna" },
  arthur: { id: "arthur", name: "젊은 왕 아서", role: "왕국의 젊은 왕", face: "🤴", portraitKey: "arthur" },
  margaret: { id: "margaret", name: "시녀장 마가렛", role: "궁정 시녀장", face: "👵", portraitKey: "margaret" },
  oberon: { id: "oberon", name: "궁정 마술사 오베론", role: "궁정 마술사", face: "🧙", portraitKey: "oberon" },
};

const NAME_TO_ID: Record<string, string> = {
  "대마녀 셀레네": "selene",
  "조사관 퀸": "quinn",
  "퀸 (Quinn)": "quinn",
  "사역마 네로": "nero",
  "조사관 퀸 & 네로": "quinn_nero",
  "루시안 공작": "lucian",
  "올리비아": "olivia",
  "해리슨": "harrison",
  "건축가 카르멘": "carmen",
  "카르멘": "carmen",
  "선장 마르코": "marco",
  "카페 단골 엘라": "ella",
  "갈매기 우편배달부 핍": "pip",
  "정원사 로완": "rowan",
  "꽃의 요정 릴리": "lily",
  "식물학자 베르나": "verna",
  "젊은 왕 아서": "arthur",
  "시녀장 마가렛": "margaret",
  "궁정 마술사 오베론": "oberon",
};

export function characterIdForName(name: string): string | null {
  return NAME_TO_ID[name] ?? null;
}
