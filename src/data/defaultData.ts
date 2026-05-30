import type {
  Material,
  MaterialCategory,
  MaterialTopic,
  StandardTopic,
  StudyData,
  StudyRecord,
  SubjectMaterialSetting,
  Subtopic,
  Subject,
  TopicMapping,
} from "../types";

const NOW = "2026-05-12T00:00:00.000Z";
const DATA_VERSION = 12;

const subjects: Subject[] = [
  { id: "subject-accounting", name: "중급회계", showOnDashboard: true, isDefault: true },
  { id: "subject-finance", name: "재무관리", showOnDashboard: true, isDefault: true },
  { id: "subject-tax", name: "법인세법", showOnDashboard: false, isDefault: true },
  { id: "subject-management", name: "경영학", showOnDashboard: false, isDefault: true },
  { id: "subject-economics", name: "경제학", showOnDashboard: false, isDefault: true },
  { id: "subject-ncs", name: "NCS", showOnDashboard: false, isDefault: true },
];

const accountingGroups = [
  {
    group: "재무회계 기초",
    titles: ["재무회계 일반과 개념체계", "이익개념과 측정기준", "재무제표 표시와 공시"],
  },
  {
    group: "자산회계",
    titles: [
      "현금 및 현금성자산과 수취채권",
      "재고자산",
      "유형자산과 투자부동산",
      "무형자산과 기타자산",
      "차입원가",
    ],
  },
  {
    group: "부채회계",
    titles: ["금융부채와 사채", "충당부채와 우발부채", "종업원급여"],
  },
  {
    group: "자본회계",
    titles: ["자본", "복합금융상품", "주식기준보상거래"],
  },
  {
    group: "금융상품회계",
    titles: ["금융자산", "파생금융상품"],
  },
  {
    group: "수익·리스·법인세",
    titles: ["고객과의 계약에서 생기는 수익", "리스", "법인세 회계"],
  },
  {
    group: "수정·표시·보고",
    titles: [
      "회계변경과 오류수정",
      "주당이익",
      "현금흐름표",
      "재무회계 기타사항",
      "재무제표 작성 종합문제",
    ],
  },
  {
    group: "고급 재무회계",
    titles: ["환율변동효과", "관계기업과 공동기업투자", "사업결합과 합병회계", "연결회계"],
  },
];

const financeGroups = [
  {
    group: "재무관리 기초",
    titles: ["재무관리의 이해", "화폐의 시간가치", "재무관리의 목표"],
  },
  {
    group: "투자안 평가",
    titles: [
      "경제성 평가",
      "투자안의 평가",
      "현금흐름 추정",
      "NPV·IRR·PI 비교",
      "자본제약과 특수한 투자안",
    ],
  },
  {
    group: "포트폴리오·CAPM",
    titles: ["포트폴리오 이론", "자본자산가격결정모형", "CAPM의 발전과 응용", "APT", "행동재무학"],
  },
  {
    group: "주식·채권 평가",
    titles: ["주식 평가", "채권 평가와 수익률", "듀레이션과 채권투자전략"],
  },
  {
    group: "자본구조·자본거래",
    titles: ["레버리지와 자본구조이론", "자본구조이론 발전과 응용", "자본거래", "배당정책"],
  },
  {
    group: "기업가치·M&A",
    titles: ["인수합병", "인수합병의 경제성 평가"],
  },
  {
    group: "파생상품·국제재무",
    titles: ["파생상품의 이해와 옵션가격결정", "옵션의 활용", "선물", "국제재무관리"],
  },
  {
    group: "기타주제",
    titles: ["재무비율", "피셔의 분리정리", "기타 용어정리"],
  },
];

const taxGroups = [
  {
    group: "법인세법 기초",
    titles: ["법인세법 총설", "손익의 귀속사업연도와 자산·부채의 평가"],
  },
  {
    group: "익금·손금",
    titles: ["익금", "손금"],
  },
  {
    group: "자산·충당금",
    titles: ["유형자산 및 무형자산의 감가상각", "충당금과 준비금"],
  },
  {
    group: "부당행위계산",
    titles: ["부당행위계산의 부인"],
  },
  {
    group: "세액계산·납세절차",
    titles: ["과세표준과 세액의 계산", "법인세의 납세절차"],
  },
  {
    group: "조직재편",
    titles: ["합병 및 분할 등에 대한 과세특례"],
  },
];

const managementGroups = [
  {
    group: "경영학 기초",
    titles: ["경영학 일반", "기업과 경영환경"],
  },
  {
    group: "조직행동",
    titles: ["개인행동", "동기부여", "리더십", "조직구조와 조직문화"],
  },
  {
    group: "인사관리",
    titles: ["직무관리", "확보관리", "개발관리", "평가관리", "보상관리", "노사관계"],
  },
  {
    group: "마케팅",
    titles: ["마케팅 관리", "STP", "마케팅 믹스", "소비자행동"],
  },
  {
    group: "생산·운영관리",
    titles: ["생산시스템", "품질관리", "재고관리", "공급사슬관리"],
  },
  {
    group: "경영전략·국제경영",
    titles: ["경영전략", "국제경영"],
  },
  {
    group: "경영정보",
    titles: ["경영정보시스템", "디지털 경영"],
  },
];

const economicsGroups = [
  {
    group: "경제학 기초",
    titles: ["경제학의 기초", "수요와 공급", "탄력성"],
  },
  {
    group: "미시경제학",
    titles: [
      "소비자이론",
      "생산자이론",
      "시장이론",
      "완전경쟁시장",
      "독점시장",
      "과점시장",
      "생산요소시장",
      "후생경제학",
      "시장실패",
    ],
  },
  {
    group: "거시경제학",
    titles: ["국민소득결정이론", "소비와 투자", "화폐와 금융", "IS-LM", "AD-AS", "실업과 인플레이션", "경제성장론", "경기변동론"],
  },
  {
    group: "국제경제학",
    titles: ["국제무역론", "국제금융론", "환율과 국제수지"],
  },
  {
    group: "경제정책",
    titles: ["재정정책", "통화정책", "공공경제"],
  },
];

const ifrsIntermediateLectureTopics = [
  "OT",
  "재무회계 일반 p.1-17",
  "재무회계 일반 p.1-24",
  "재무제표 표시 p.2-3",
  "재무제표 표시 p.2-16",
  "재무제표 표시 p.2-24",
  "재고자산 p.3-3",
  "재고자산 p.3-17",
  "재고자산 p.3-29",
  "재고자산 p.3-30",
  "재고자산 p.3-51",
  "재고자산 p.3-59",
  "재고자산 p.3-69",
  "재고자산 p.3-12",
  "유형자산과 투자부동산 p.4-3",
  "유형자산과 투자부동산 p.4-16",
  "유형자산과 투자부동산 p.4-29",
  "유형자산과 투자부동산 p.4-43",
  "유형자산과 투자부동산 p.4-82",
  "유형자산과 투자부동산 p.4-56",
  "유형자산과 투자부동산 p.4-67",
  "유형자산과 투자부동산 p.4-100",
  "유형자산과 투자부동산 p.4-128",
  "무형자산 p.5-3",
  "무형자산 p.5-19",
  "차입원가 p.6-3",
  "차입원가 p.6-18",
  "금융부채 p.7-3",
  "금융부채 p.7-9",
  "금융부채 p.7-22",
  "금융부채 p.7-35",
  "금융부채 p.7-44",
  "종업원급여 p.8-3",
  "종업원급여 p.8-17",
  "종업원급여 p.8-32",
  "충당부채 p.9-8",
  "충당부채 p.9-14",
  "충당부채 p.9-24",
  "충당부채 p.9-32",
  "자본 p.10-3",
  "자본 p.10-20",
  "자본 p.10-34",
  "자본 p.10-43",
  "자본 p.10-54",
  "재무회계 일반 p.1-41",
  "재무회계 일반 p.1-57",
  "재무회계 일반 p.1-74",
  "재무회계 일반 p.1-85",
  "재무회계 일반 p.1-98",
  "재무회계 일반 p.1-118",
  "금융자산 p.11-3",
  "금융자산 p.11-23",
  "금융자산 p.11-41",
  "금융자산 p.11-51",
  "금융자산 p.11-59",
  "금융자산 p.11-73",
  "금융자산 p.11-85",
  "금융자산 p.11-106",
  "금융자산 p.11-124",
  "복합금융상품 p.12-3",
  "복합금융상품 p.12-24",
  "복합금융상품 p.12-42",
  "주식기준보상거래 p.13-3",
  "주식기준보상거래 p.13-16",
  "주식기준보상거래 p.13-25",
  "주식기준보상거래 p.13-36",
  "주식기준보상거래 p.13-44",
  "수익 p.14-3",
  "수익 p.14-24",
  "수익 p.14-38",
  "수익 p.14-47",
  "수익 p.14-60",
  "수익 p.14-68",
  "수익 p.14-80",
  "수익 p.14-90",
  "수익 p.14-98",
  "수익 p.14-117",
  "리스 p.15-3",
  "리스 p.15-8",
  "리스 p.15-35",
  "리스 p.15-44",
  "리스 p.15-50",
  "리스 p.15-60",
  "리스 p.15-73",
  "법인세 p.16-3",
  "법인세 p.16-16",
  "법인세 p.16-28",
  "법인세 p.16-34",
  "회계변경과 오류 p.17-3",
  "회계변경과 오류 p.17-10",
  "회계변경과 오류 p.17-20",
  "회계변경과 오류 p.17-35",
  "재무회계 기타 p.20-10",
  "재무회계 기타 p.20-3",
  "주당이익 p.18-3",
  "주당이익 p.18-18",
  "주당이익 p.18-25",
  "주당이익 p.18-36",
  "현금흐름표 p.19-3",
  "현금흐름표 p.19-21",
  "현금흐름표 p.19-35",
  "현금흐름표 p.19-63",
  "현금흐름표 p.19-47",
  "현금흐름표 p.19-66 -끝- 수고하셨습니다.",
];

const ifrsIntermediateLectureStandardOrders: Array<number | null> = [
  null,
  1,
  1,
  3,
  3,
  3,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  6,
  6,
  6,
  6,
  6,
  6,
  6,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  9,
  9,
  9,
  11,
  11,
  11,
  10,
  10,
  10,
  10,
  12,
  12,
  12,
  12,
  12,
  1,
  1,
  1,
  1,
  1,
  1,
  15,
  15,
  15,
  15,
  15,
  15,
  15,
  15,
  15,
  13,
  13,
  13,
  14,
  14,
  14,
  14,
  14,
  17,
  17,
  17,
  17,
  17,
  17,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  23,
  23,
  21,
  21,
  21,
  21,
  22,
  22,
  22,
  22,
  22,
  22,
];

const taxSummaryTopics = [
  "법인세법 총설",
  "손익의 귀속사업연도와 자산·부채의 평가",
  "익금",
  "손금",
  "유형자산 및 무형자산의 감가상각",
  "충당금과 준비금",
  "부당행위계산의 부인",
  "과세표준과 세액의 계산",
  "법인세의 납세절차",
  "합병 및 분할 등에 대한 과세특례",
];

const taxLectureTopics = [
  "법인세법 총설 p.1-134",
  "법인세법 총설 p.1-145",
  "손익의 귀속사업연도와 자산·부채의 평가 p.2-154",
  "손익의 귀속사업연도와 자산·부채의 평가 프린트 p.14",
  "익금 p.3-174",
  "손금 p.4-194",
  "손금 프린트 p.27",
  "부당행위계산의 부인 프린트 p.32",
];

const taxOxTopics = [
  "법인세법 총설",
  "손익의 귀속사업연도와 자산·부채의 평가",
  "익금",
  "손금",
  "유·무형자산의 감가상각",
  "충당금과 준비금",
  "부당행위계산의 부인",
  "과세표준과 세액의 계산",
  "법인세의 납세절차",
  "합병 및 분할 등에 대한 과세특례",
];

const taxSubtopicSeeds: Array<{ standardOrder: number; titles: string[] }> = [
  {
    standardOrder: 1,
    titles: ["법인세의 과세대상과 납세의무자", "사업연도 및 납세지", "세무조정과 소득처분", "법인세 계산구조"],
  },
  {
    standardOrder: 2,
    titles: ["손익의 귀속사업연도", "자산의 취득가액", "자산·부채의 평가기준"],
  },
  {
    standardOrder: 3,
    titles: ["익금과 익금불산입", "임대보증금에 대한 간주임대료", "의제배당", "수입배당금 익금불산입"],
  },
  {
    standardOrder: 4,
    titles: ["손금과 손금불산입", "세금과 공과금", "인건비", "기업업무추진비", "기부금", "지급이자"],
  },
  {
    standardOrder: 5,
    titles: [
      "감가상각 시부인계산의 구조",
      "감가상각자산의 범위",
      "상각범위액의 결정요소",
      "감가상각 시부인",
      "업무용승용차 관련 비용의 손금불산입 특례",
      "감가상각의제 등 기타문제",
    ],
  },
  {
    standardOrder: 6,
    titles: [
      "퇴직급여충당금과 퇴직연금충당금",
      "대손금과 대손충당금",
      "일시상각충당금과 압축기장충당금",
      "준비금",
    ],
  },
  {
    standardOrder: 7,
    titles: ["부당행위계산의 부인", "자산의 고가매입·저가양도", "가지급금인정이자", "불공정자본거래"],
  },
  {
    standardOrder: 8,
    titles: [
      "과세표준의 계산",
      "산출세액의 계산",
      "토지 등 양도소득에 대한 법인세",
      "미환류소득에 대한 법인세",
      "세액감면",
      "세액공제",
      "최저한세",
    ],
  },
  {
    standardOrder: 9,
    titles: [
      "기납부세액",
      "법인세의 신고·납부",
      "결정·경정·징수 및 환급",
      "가산세",
      "청산소득에 대한 법인세",
      "비영리법인의 각사업연도소득에 대한 법인세",
      "각 연결사업연도의 소득에 대한 법인세",
    ],
  },
  {
    standardOrder: 10,
    titles: ["합병에 대한 과세체계", "합병에 대한 과세특례", "분할에 대한 과세체계", "합병 및 분할에 대한 기타문제"],
  },
];

const supplementalSubtopicSeeds: Array<{
  prefix: "accounting" | "finance" | "management" | "economics";
  standardOrder: number;
  titles: string[];
}> = [
  { prefix: "accounting", standardOrder: 1, titles: ["재무보고의 목적", "질적 특성", "재무제표 요소", "인식과 제거", "측정기준", "자본과 자본유지"] },
  { prefix: "accounting", standardOrder: 2, titles: ["자본유지접근법", "거래접근법", "포괄손익", "공정가치측정", "현재가치측정"] },
  { prefix: "accounting", standardOrder: 3, titles: ["재무상태표 표시", "포괄손익계산서 표시", "기타포괄손익", "주석 공시", "공정가치 서열체계"] },
  { prefix: "accounting", standardOrder: 4, titles: ["현금및현금성자산", "은행계정조정", "매출채권", "대손충당금", "현재가치평가", "어음할인"] },
  {
    prefix: "accounting",
    standardOrder: 5,
    titles: [
      "취득원가",
      "매입환출·매입할인",
      "재고자산 포함 여부",
      "저가법",
      "순실현가능가치",
      "재고자산감모손실",
      "재고자산평가손실",
      "매출총이익률법",
      "소매재고법",
      "농림어업",
    ],
  },
  {
    prefix: "accounting",
    standardOrder: 6,
    titles: [
      "취득",
      "일괄취득",
      "교환취득",
      "후속원가",
      "감가상각",
      "감가상각방법 변경",
      "재평가모형",
      "손상차손",
      "제거",
      "정부보조금",
      "복구충당부채",
      "토지",
      "건물",
      "기계장치",
      "투자부동산",
      "원가모형과 공정가치모형",
    ],
  },
  { prefix: "accounting", standardOrder: 7, titles: ["무형자산 인식", "연구단계와 개발단계", "상각과 내용연수", "손상검사", "영업권", "기타비유동자산"] },
  { prefix: "accounting", standardOrder: 8, titles: ["적격자산", "자본화기간", "특정차입금", "일반차입금", "일시투자수익", "자본화 종료"] },
  { prefix: "accounting", standardOrder: 9, titles: ["사채 발행", "상각후원가", "유효이자율법", "사채상환", "전환사채 부채요소", "금융부채 제거"] },
  { prefix: "accounting", standardOrder: 10, titles: ["충당부채 인식요건", "우발부채", "우발자산", "제품보증충당부채", "소송충당부채", "구조조정충당부채"] },
  { prefix: "accounting", standardOrder: 11, titles: ["단기종업원급여", "퇴직급여제도", "확정급여채무", "사외적립자산", "보험수리적손익", "과거근무원가"] },
  { prefix: "accounting", standardOrder: 12, titles: ["자본의 분류", "주식발행", "자기주식", "이익잉여금 처분", "자본변동표", "배당"] },
  { prefix: "accounting", standardOrder: 13, titles: ["금융부채와 지분상품 구분", "전환사채", "신주인수권부사채", "상환우선주", "조건부결제조항"] },
  { prefix: "accounting", standardOrder: 14, titles: ["주식결제형", "현금결제형", "가득조건", "공정가치 측정", "조건변경", "취소와 정산"] },
  { prefix: "accounting", standardOrder: 15, titles: ["금융자산 분류", "상각후원가", "FVOCI", "FVTPL", "손상과 기대신용손실", "금융자산 제거"] },
  { prefix: "accounting", standardOrder: 16, titles: ["파생상품 개념", "선도·선물", "옵션", "스왑", "위험회피회계", "내재파생상품"] },
  { prefix: "accounting", standardOrder: 17, titles: ["5단계 수익인식", "수행의무 식별", "거래가격 산정", "거래가격 배분", "기간에 걸친 수익", "계약변경"] },
  { prefix: "accounting", standardOrder: 18, titles: ["리스 식별", "리스이용자 회계", "사용권자산", "리스부채", "리스제공자 회계", "판매후리스"] },
  { prefix: "accounting", standardOrder: 19, titles: ["일시적차이", "이연법인세자산", "이연법인세부채", "법인세비용", "세율변경", "결손금 공제"] },
  { prefix: "accounting", standardOrder: 20, titles: ["회계정책 변경", "회계추정 변경", "오류수정", "소급재작성", "전진적용", "재무제표 재작성"] },
  { prefix: "accounting", standardOrder: 21, titles: ["기본주당이익", "희석주당이익", "잠재적보통주", "전환사채 희석효과", "주식선택권 희석효과"] },
  { prefix: "accounting", standardOrder: 22, titles: ["영업활동 현금흐름", "직접법", "간접법", "투자활동", "재무활동", "비현금거래"] },
  { prefix: "accounting", standardOrder: 23, titles: ["매각예정비유동자산", "중단영업", "정부보조금", "농림어업", "보고기간후사건", "특수관계자 공시"] },
  { prefix: "accounting", standardOrder: 24, titles: ["시산표 정리", "결산수정분개", "재무상태표 작성", "손익계산서 작성", "자본변동표 작성", "현금흐름표 연계"] },
  { prefix: "accounting", standardOrder: 25, titles: ["기능통화", "외화거래", "화폐성항목", "비화폐성항목", "해외사업장 환산", "환산차이"] },
  { prefix: "accounting", standardOrder: 26, titles: ["유의적 영향력", "지분법 회계", "내부거래 제거", "손상", "공동약정", "공동기업"] },
  { prefix: "accounting", standardOrder: 27, titles: ["취득법", "식별가능순자산", "영업권", "염가매수차익", "단계취득", "측정기간 조정"] },
  { prefix: "accounting", standardOrder: 28, titles: ["지배력 판단", "연결범위", "투자자본 상계", "내부거래 제거", "비지배지분", "연결현금흐름표"] },

  { prefix: "finance", standardOrder: 1, titles: ["재무관리 의의", "기업형태와 대리문제", "재무관리 기능", "재무시장과 금융기관"] },
  { prefix: "finance", standardOrder: 2, titles: ["미래가치", "현재가치", "연금", "영구연금", "실효이자율", "대출상환"] },
  { prefix: "finance", standardOrder: 3, titles: ["기업가치 극대화", "주주부 극대화", "대리비용", "시장효율성", "ESG와 이해관계자"] },
  { prefix: "finance", standardOrder: 4, titles: ["순현재가치", "내부수익률", "수익성지수", "회수기간법", "회계적이익률법"] },
  { prefix: "finance", standardOrder: 5, titles: ["상호배타적 투자안", "독립적 투자안", "투자안 순위", "재투자수익률 가정", "증분현금흐름"] },
  { prefix: "finance", standardOrder: 6, titles: ["초기투자액", "영업현금흐름", "감가상각 절세효과", "운전자본", "처분현금흐름", "매몰원가"] },
  { prefix: "finance", standardOrder: 7, titles: ["NPV와 IRR 관계", "복수 IRR", "규모차이", "수명차이", "PI 적용", "MIRR"] },
  { prefix: "finance", standardOrder: 8, titles: ["자본제약", "동등연간비용", "교체투자", "인플레이션 반영", "민감도분석", "시나리오분석"] },
  { prefix: "finance", standardOrder: 9, titles: ["기대수익률", "분산과 표준편차", "공분산과 상관계수", "효율적 투자선", "최적포트폴리오"] },
  {
    prefix: "finance",
    standardOrder: 10,
    titles: ["효율적 투자선", "자본시장선", "증권특성선", "증권시장선", "베타", "시장위험프리미엄", "CAPM 한계"],
  },
  { prefix: "finance", standardOrder: 11, titles: ["무위험차입과 대출", "제로베타 CAPM", "소비 CAPM", "다기간 CAPM", "국제 CAPM"] },
  { prefix: "finance", standardOrder: 12, titles: ["차익거래", "요인모형", "APT 기본식", "요인베타", "CAPM과 APT 비교"] },
  { prefix: "finance", standardOrder: 13, titles: ["전망이론", "과잉확신", "대표성 편향", "손실회피", "시장 이상현상"] },
  { prefix: "finance", standardOrder: 14, titles: ["배당평가모형", "성장기회", "PER", "PBR", "FCF 평가", "잔여이익모형"] },
  { prefix: "finance", standardOrder: 15, titles: ["채권가격", "만기수익률", "현물이자율", "선도이자율", "이표채", "수익률곡선"] },
  { prefix: "finance", standardOrder: 16, titles: ["듀레이션", "수정듀레이션", "볼록성", "면역전략", "소극적 전략", "적극적 전략"] },
  { prefix: "finance", standardOrder: 17, titles: ["영업레버리지", "재무레버리지", "결합레버리지", "MM 무관련이론", "법인세와 부채효과"] },
  { prefix: "finance", standardOrder: 18, titles: ["파산비용", "대리비용", "정보비대칭", "신호이론", "자본조달순위이론"] },
  { prefix: "finance", standardOrder: 19, titles: ["유상증자", "무상증자", "주식분할", "주식병합", "자사주", "권리락"] },
  { prefix: "finance", standardOrder: 20, titles: ["배당무관련이론", "현금배당", "주식배당", "배당안정화", "자사주매입", "배당신호"] },
  { prefix: "finance", standardOrder: 21, titles: ["M&A 유형", "시너지", "인수방식", "방어전략", "LBO", "기업분할"] },
  { prefix: "finance", standardOrder: 22, titles: ["합병 NPV", "교환비율", "현금인수", "주식교환", "인수가격", "합병 후 EPS"] },
  { prefix: "finance", standardOrder: 23, titles: ["옵션 기초", "풋콜패리티", "이항모형", "블랙숄즈모형", "옵션 민감도"] },
  { prefix: "finance", standardOrder: 24, titles: ["보호적 풋", "커버드 콜", "스프레드", "스트래들", "실물옵션", "전환사채 옵션"] },
  { prefix: "finance", standardOrder: 25, titles: ["선물가격", "헤지", "베이시스", "주가지수선물", "금리선물", "스왑"] },
  { prefix: "finance", standardOrder: 26, titles: ["환율표시", "구매력평가", "이자율평가", "환위험", "국제자본예산", "국제자본구조"] },
  { prefix: "finance", standardOrder: 27, titles: ["유동성비율", "레버리지비율", "활동성비율", "수익성비율", "시장가치비율", "듀퐁분석"] },
  { prefix: "finance", standardOrder: 28, titles: ["소비와 투자 분리", "완전자본시장", "생산기회선", "자본시장선", "주주가치 극대화"] },
  { prefix: "finance", standardOrder: 29, titles: ["경제적 부가가치", "가중평균자본비용", "운전자본관리", "현금관리", "신용관리", "리스금융"] },

  { prefix: "management", standardOrder: 1, titles: ["경영의 개념", "경영자 역할", "경영학 발전", "기업 목적", "기업윤리"] },
  { prefix: "management", standardOrder: 2, titles: ["외부환경", "과업환경", "기업의 사회적 책임", "기업지배구조", "이해관계자"] },
  { prefix: "management", standardOrder: 3, titles: ["성격", "가치관", "지각", "태도", "학습", "직무만족"] },
  { prefix: "management", standardOrder: 4, titles: ["내용이론", "과정이론", "목표설정이론", "공정성이론", "기대이론", "강화이론"] },
  { prefix: "management", standardOrder: 5, titles: ["특성이론", "행동이론", "상황이론", "거래적 리더십", "변혁적 리더십", "LMX"] },
  { prefix: "management", standardOrder: 6, titles: ["조직설계", "분업과 조정", "기계적 조직", "유기적 조직", "조직문화", "조직변화"] },
  { prefix: "management", standardOrder: 7, titles: ["직무분석", "직무평가", "직무설계", "직무특성이론", "직무충실화"] },
  { prefix: "management", standardOrder: 8, titles: ["인력계획", "모집", "선발", "면접", "선발도구 타당성"] },
  { prefix: "management", standardOrder: 9, titles: ["교육훈련", "경력개발", "조직사회화", "멘토링", "인재육성"] },
  { prefix: "management", standardOrder: 10, titles: ["성과평가", "평가오류", "다면평가", "MBO", "BSC", "평가 피드백"] },
  { prefix: "management", standardOrder: 11, titles: ["임금수준", "임금체계", "성과급", "복리후생", "스톡옵션", "공정성"] },
  { prefix: "management", standardOrder: 12, titles: ["노동조합", "단체교섭", "쟁의행위", "노사협의", "근로자 참여", "갈등관리"] },
  { prefix: "management", standardOrder: 13, titles: ["마케팅 개념", "마케팅 환경", "마케팅 조사", "수요예측", "고객가치", "CRM"] },
  { prefix: "management", standardOrder: 14, titles: ["시장세분화", "표적시장 선정", "포지셔닝", "차별화", "포지셔닝맵"] },
  { prefix: "management", standardOrder: 15, titles: ["제품관리", "가격관리", "유통관리", "촉진관리", "브랜드", "서비스마케팅"] },
  { prefix: "management", standardOrder: 16, titles: ["소비자 의사결정", "관여도", "태도", "학습", "준거집단", "구매 후 행동"] },
  { prefix: "management", standardOrder: 17, titles: ["생산전략", "공정유형", "설비배치", "입지결정", "생산능력계획", "일정계획"] },
  { prefix: "management", standardOrder: 18, titles: ["품질 개념", "TQM", "식스시그마", "통계적 품질관리", "관리도", "서비스품질"] },
  { prefix: "management", standardOrder: 19, titles: ["재고비용", "EOQ", "안전재고", "재주문점", "ABC 분석", "JIT"] },
  { prefix: "management", standardOrder: 20, titles: ["공급사슬 설계", "채찍효과", "물류관리", "구매관리", "아웃소싱", "SCM 성과"] },
  { prefix: "management", standardOrder: 21, titles: ["전략수립", "외부환경분석", "내부역량분석", "본원적 전략", "다각화", "경쟁우위"] },
  { prefix: "management", standardOrder: 22, titles: ["국제화 동기", "해외시장 진입", "글로벌 전략", "현지화", "국제조직", "환위험"] },
  { prefix: "management", standardOrder: 23, titles: ["정보시스템 유형", "ERP", "CRM", "데이터베이스", "의사결정지원", "정보보안"] },
  { prefix: "management", standardOrder: 24, titles: ["디지털 전환", "플랫폼 비즈니스", "빅데이터", "인공지능", "핀테크", "전자상거래"] },

  { prefix: "economics", standardOrder: 1, titles: ["희소성과 선택", "기회비용", "생산가능곡선", "경제순환", "경제모형"] },
  { prefix: "economics", standardOrder: 2, titles: ["수요곡선", "공급곡선", "시장균형", "균형변화", "가격통제"] },
  { prefix: "economics", standardOrder: 3, titles: ["수요의 가격탄력성", "공급의 가격탄력성", "소득탄력성", "교차탄력성", "탄력성과 총수입"] },
  { prefix: "economics", standardOrder: 4, titles: ["효용극대화", "무차별곡선", "예산선", "소득효과", "대체효과", "보상수요"] },
  { prefix: "economics", standardOrder: 5, titles: ["생산함수", "한계생산", "등량곡선", "비용함수", "규모의 경제", "장기비용"] },
  { prefix: "economics", standardOrder: 6, titles: ["시장구조", "이윤극대화", "단기균형", "장기균형", "효율성 비교"] },
  { prefix: "economics", standardOrder: 7, titles: ["완전경쟁 수요", "공급곡선", "단기균형", "장기균형", "생산자잉여"] },
  { prefix: "economics", standardOrder: 8, titles: ["독점의 가격결정", "가격차별", "자연독점", "독점의 비효율", "규제"] },
  { prefix: "economics", standardOrder: 9, titles: ["꾸르노 모형", "베르뜨랑 모형", "스택켈버그 모형", "담합", "게임이론"] },
  { prefix: "economics", standardOrder: 10, titles: ["노동수요", "노동공급", "임금결정", "자본시장", "경제적 지대"] },
  { prefix: "economics", standardOrder: 11, titles: ["파레토효율", "교환효율", "생산효율", "사회후생함수", "후생경제학 정리"] },
  { prefix: "economics", standardOrder: 12, titles: ["외부효과", "공공재", "정보비대칭", "역선택", "도덕적 해이", "정부실패"] },
  { prefix: "economics", standardOrder: 13, titles: ["GDP", "국민소득 항등식", "케인즈 단순모형", "승수효과", "균형국민소득"] },
  { prefix: "economics", standardOrder: 14, titles: ["소비함수", "항상소득가설", "생애주기가설", "투자함수", "가속도원리", "토빈 q"] },
  { prefix: "economics", standardOrder: 15, titles: ["화폐수요", "화폐공급", "중앙은행", "통화승수", "금융시장", "이자율 결정"] },
  { prefix: "economics", standardOrder: 16, titles: ["IS곡선", "LM곡선", "재정정책 효과", "통화정책 효과", "구축효과", "유동성함정"] },
  { prefix: "economics", standardOrder: 17, titles: ["총수요곡선", "총공급곡선", "단기 AS", "장기 AS", "경제충격", "정책효과"] },
  { prefix: "economics", standardOrder: 18, titles: ["실업의 종류", "자연실업률", "필립스곡선", "인플레이션 비용", "기대인플레이션"] },
  { prefix: "economics", standardOrder: 19, titles: ["솔로우 모형", "자본축적", "기술진보", "황금률", "내생성장이론"] },
  { prefix: "economics", standardOrder: 20, titles: ["경기순환의 국면", "승수-가속도", "실물경기변동", "새케인즈 모형", "안정화정책"] },
  { prefix: "economics", standardOrder: 21, titles: ["비교우위", "리카도 모형", "헥셔-올린", "무역정책", "관세와 쿼터", "무역이익"] },
  { prefix: "economics", standardOrder: 22, titles: ["국제수지", "환율결정", "이자율평가", "구매력평가", "개방경제 IS-LM", "자본이동"] },
  { prefix: "economics", standardOrder: 23, titles: ["명목환율", "실질환율", "경상수지", "자본수지", "환율제도", "외환시장개입"] },
  { prefix: "economics", standardOrder: 24, titles: ["정부지출", "조세", "재정승수", "국가채무", "리카도 동등성", "자동안정화장치"] },
  { prefix: "economics", standardOrder: 25, titles: ["통화정책 목표", "정책수단", "테일러준칙", "인플레이션 타기팅", "양적완화", "금리경로"] },
  { prefix: "economics", standardOrder: 26, titles: ["조세의 효율성", "조세의 귀착", "공공재 공급", "비용편익분석", "소득재분배", "사회보험"] },
];

const hwangAccountingTopics = [
  "유형 01 재무보고를 위한 개념체계",
  "유형 02 재무제표 표시",
  "유형 03 공정가치측정",
  "유형 04 재고자산의 취득원가와 원가흐름가정",
  "유형 05 기말재고자산에 포함될 항목",
  "유형 06 재고자산의 감모와 저가평가",
  "유형 07 소매재고법",
  "유형 08 재고자산 증감분석",
  "유형 09 농림어업",
  "유형 10 유형자산의 취득원가와 감가상각",
  "유형 11 토지의 취득과 후속측정",
  "유형 12 교환에 의한 취득",
  "유형 13 정부보조금",
  "유형 14 후속원가와 복구원가",
  "유형 15 유형자산 손상차손",
  "유형 16 재평가모형",
  "유형 17 투자부동산",
  "유형 18 무형자산",
  "유형 19 차입원가자본화",
  "유형 20 금융부채의 분류와 유효이자율법",
  "유형 21 이자지급일 사이의 사채발행과 조기상환",
  "유형 22 금융부채 기타사항",
  "유형 23 자본거래의 회계처리",
  "유형 24 자본거래 기타사항",
  "유형 25 자본총계 증감분석",
  "유형 26 자본변동표와 이익잉여금처분계산서",
  "유형 27 충당부채",
  "유형 28 보고기간후사건",
  "유형 29 투자지분상품",
  "유형 30 투자채무상품",
  "유형 31 금융자산손상차손",
  "유형 32 금융자산 분류변경",
  "유형 33 현금및현금성자산",
  "유형 34 매출채권",
  "유형 35 계약식별과 수행의무식별 및 이행",
  "유형 36 거래가격 산정과 배분",
  "유형 37 사례별 수익인식",
  "유형 38 복합금융상품",
  "유형 39 주식기준보상",
  "유형 40 퇴직급여",
  "유형 41 리스제공자",
  "유형 42 리스이용자",
  "유형 43 리스 기타사항",
  "유형 44 법인세회계",
  "유형 45 회계변경",
  "유형 46 오류수정",
  "유형 47 기본주당이익",
  "유형 48 희석주당이익",
  "유형 49 현금흐름의 분류",
  "유형 50 직접법에 의한 현금흐름표",
  "유형 51 간접법에 의한 현금흐름표",
  "유형 52 원가의 분류와 흐름",
  "유형 53 개별원가계산과 종합원가계산",
  "유형 54 관리회계",
  "유형 55 고급회계",
  "단원별 모의고사 1회",
  "단원별 모의고사 2회",
  "단원별 모의고사 3회",
  "단원별 모의고사 4회",
  "단원별 모의고사 5회",
  "단원별 모의고사 6회",
  "단원별 모의고사 7회",
  "단원별 모의고사 8회",
  "실전 모의고사 1회",
  "실전 모의고사 2회",
  "실전 모의고사 3회",
  "실전 모의고사 4회",
  "실전 모의고사 5회",
  "실전 모의고사 6회",
  "실전 모의고사 7회",
  "실전 모의고사 8회",
  "고난도 모의고사 1회",
  "고난도 모의고사 2회",
  "고난도 모의고사 3회",
  "고난도 모의고사 4회",
  "고난도 모의고사 5회",
  "고난도 모의고사 6회",
];

const materialSeeds: Array<{
  id: string;
  subjectIds: string[];
  title: string;
  statusLabel: string;
  topics: string[];
  materialType?: Material["materialType"];
  progressMode?: Material["progressMode"];
  category?: MaterialCategory;
}> = [
  {
    id: "material-ifrs-intermediate",
    subjectIds: ["subject-accounting"],
    title: "IFRS 중급회계 상·하",
    statusLabel: "이론서",
    category: "이론",
    topics: [
      "재무회계 일반",
      "재무제표 표시와 공시",
      "재고자산",
      "유형자산과 투자부동산",
      "무형자산",
      "차입원가",
      "금융부채",
      "종업원급여",
      "충당부채",
      "자본",
      "금융자산",
      "복합금융상품",
      "주식기준보상거래",
      "수익",
      "리스",
      "법인세",
      "회계변경과 오류",
      "주당이익",
      "현금흐름표",
      "재무회계 기타",
    ],
  },
  {
    id: "material-ifrs-intermediate-lecture",
    subjectIds: ["subject-accounting"],
    title: "IFRS 중급회계 강의",
    statusLabel: "이론강의",
    materialType: "lecture",
    progressMode: "lecture",
    category: "인강",
    topics: ifrsIntermediateLectureTopics,
  },
  {
    id: "material-best-accounting",
    subjectIds: ["subject-accounting"],
    title: "재무회계 기출베스트",
    statusLabel: "기베",
    category: "문제",
    topics: [
      "재무회계 일반",
      "재고자산",
      "유형·무형자산·투자부동산",
      "차입원가",
      "부채·종업원급여",
      "자본",
      "금융자산",
      "복합금융상품",
      "주식기준보상거래",
      "고객과의 계약에서 생기는 수익",
      "리스",
      "법인세",
      "회계변경과 오류",
      "주당이익",
      "현금흐름표",
      "사업결합",
      "연결회계",
      "지분법",
      "환율변동효과",
      "파생금융상품",
      "재무회계 기타",
      "추가문제",
      "재무제표 작성",
    ],
  },
  {
    id: "material-kim-objective-accounting",
    subjectIds: ["subject-accounting"],
    title: "김기동 IFRS 객관식 재무회계",
    statusLabel: "객잼",
    category: "문제",
    topics: [
      "재무보고를 위한 개념체계",
      "이익개념과 측정기준",
      "재무제표와 공시",
      "수익의 인식",
      "현금 및 현금성자산과 수취채권",
      "재고자산",
      "유형자산과 투자부동산",
      "차입원가의 자본화",
      "무형자산과 기타자산",
      "금융부채와 사채",
      "충당부채와 종업원급여",
      "자본",
      "투자목적 금융자산",
      "복합금융상품",
      "주식기준보상거래",
      "주당이익",
      "리스",
      "법인세 회계",
      "회계변경과 오류수정",
      "현금흐름표",
      "재무회계의 기타사항",
      "환율변동회계와 파생상품",
      "관계기업과 공동기업투자",
      "사업결합과 합병회계",
      "연결회계",
      "모의고사 1회",
      "모의고사 2회",
      "모의고사 3회",
      "모의고사 4회",
      "모의고사 5회",
      "기출문제",
    ],
  },
  {
    id: "material-hwang-public-accounting",
    subjectIds: ["subject-accounting"],
    title: "황윤하 공기업 회계학",
    statusLabel: "황회계",
    materialType: "workbook",
    progressMode: "topic",
    category: "문제",
    topics: hwangAccountingTopics,
  },
  {
    id: "material-ibk-400",
    subjectIds: ["subject-accounting", "subject-finance", "subject-management", "subject-economics"],
    title: "기업은행 경영경제 400제",
    statusLabel: "기은",
    category: "문제",
    topics: [
      "경영 핵심기출",
      "경제 핵심기출",
      "제1회 실전모의고사",
      "제2회 실전모의고사",
      "제3회 실전모의고사",
      "제4회 실전모의고사",
      "제5회 실전모의고사",
      "제6회 실전모의고사",
      "제7회 실전모의고사",
      "제8회 실전모의고사",
      "제9회 실전모의고사",
      "제10회 실전모의고사",
      "정답 및 해설",
    ],
  },
  {
    id: "material-tax-summary",
    subjectIds: ["subject-tax"],
    title: "세법요약서",
    statusLabel: "요약서",
    materialType: "summary",
    category: "이론",
    topics: taxSummaryTopics,
  },
  {
    id: "material-tax-lecture",
    subjectIds: ["subject-tax"],
    title: "1일 1법 1차 세법 이론정리 특강(법인세법)",
    statusLabel: "이론강의",
    materialType: "lecture",
    progressMode: "lecture",
    category: "인강",
    topics: taxLectureTopics,
  },
  {
    id: "material-tax-ox",
    subjectIds: ["subject-tax"],
    title: "세법 말문제 OX",
    statusLabel: "말문제OX",
    materialType: "workbook",
    category: "문제",
    topics: taxOxTopics,
  },
  {
    id: "material-jihan-finance",
    subjectIds: ["subject-finance"],
    title: "지한송 재무관리 제3판",
    statusLabel: "이론서",
    category: "이론",
    topics: [
      "재무관리의 이해",
      "경제성 평가",
      "투자안의 평가",
      "포트폴리오 이론",
      "자본자산가격결정모형",
      "CAPM의 발전과 응용",
      "주식 평가",
      "채권 평가와 수익률",
      "듀레이션과 채권투자전략",
      "레버리지와 자본구조이론",
      "자본구조이론 발전과 응용",
      "자본거래",
      "인수합병",
      "파생상품의 이해와 옵션가격결정",
      "옵션의 활용",
      "선물과 국제재무관리",
      "기타주제",
    ],
  },
  {
    id: "material-jihan-friendly",
    subjectIds: ["subject-finance"],
    title: "지한송 친절한 객관식 재무관리",
    statusLabel: "친객",
    category: "문제",
    topics: [
      "재무관리의 기초",
      "경제성 평가",
      "투자안의 경제성 평가",
      "포트폴리오 이론",
      "자본자산가격결정이론",
      "자본자산가격결정의 발전과 응용",
      "주식 평가",
      "채권 평가와 채권수익률",
      "듀레이션과 채권투자전략",
      "레버리지와 MM자본구조이론",
      "자본구조이론 발전과 응용",
      "자본거래",
      "합병",
      "옵션가격결정",
      "옵션의 활용",
      "선물과 국제재무관리",
      "기타 주제",
    ],
  },
];

const defaultSubjectMaterialOrder: Record<string, string[]> = {
  "subject-accounting": [
    "material-ifrs-intermediate-lecture",
    "material-ifrs-intermediate",
    "material-best-accounting",
    "material-kim-objective-accounting",
    "material-hwang-public-accounting",
    "material-ibk-400",
  ],
  "subject-finance": ["material-jihan-finance", "material-jihan-friendly", "material-ibk-400"],
  "subject-tax": ["material-tax-summary", "material-tax-lecture", "material-tax-ox"],
  "subject-management": ["material-ibk-400"],
  "subject-economics": ["material-ibk-400"],
};

function standardId(prefix: "accounting" | "finance" | "tax" | "management" | "economics", order: number) {
  return `std-${prefix}-${String(order).padStart(2, "0")}`;
}

function materialTopicId(materialId: string, order: number) {
  return `mt-${materialId.replace("material-", "")}-${String(order).padStart(2, "0")}`;
}

function subtopicId(prefix: "accounting" | "finance" | "tax" | "management" | "economics", standardOrder: number, order: number) {
  return `sub-${standardId(prefix, standardOrder)}-${String(order).padStart(2, "0")}`;
}

function buildStandardTopics(): StandardTopic[] {
  const topics: StandardTopic[] = [];
  let accountingOrder = 1;
  for (const group of accountingGroups) {
    for (const title of group.titles) {
      topics.push({
        id: standardId("accounting", accountingOrder),
        subjectId: "subject-accounting",
        group: group.group,
        title,
        order: accountingOrder,
        isDefault: true,
      });
      accountingOrder += 1;
    }
  }

  let financeOrder = 1;
  for (const group of financeGroups) {
    for (const title of group.titles) {
      topics.push({
        id: standardId("finance", financeOrder),
        subjectId: "subject-finance",
        group: group.group,
        title,
        order: financeOrder,
        isDefault: true,
      });
      financeOrder += 1;
    }
  }

  let taxOrder = 1;
  for (const group of taxGroups) {
    for (const title of group.titles) {
      topics.push({
        id: standardId("tax", taxOrder),
        subjectId: "subject-tax",
        group: group.group,
        title,
        order: taxOrder,
        isDefault: true,
      });
      taxOrder += 1;
    }
  }

  let managementOrder = 1;
  for (const group of managementGroups) {
    for (const title of group.titles) {
      topics.push({
        id: standardId("management", managementOrder),
        subjectId: "subject-management",
        group: group.group,
        title,
        order: managementOrder,
        isDefault: true,
      });
      managementOrder += 1;
    }
  }

  let economicsOrder = 1;
  for (const group of economicsGroups) {
    for (const title of group.titles) {
      topics.push({
        id: standardId("economics", economicsOrder),
        subjectId: "subject-economics",
        group: group.group,
        title,
        order: economicsOrder,
        isDefault: true,
      });
      economicsOrder += 1;
    }
  }

  return topics;
}

function buildMaterials(): { materials: Material[]; materialTopics: MaterialTopic[] } {
  const materials: Material[] = [];
  const materialTopics: MaterialTopic[] = [];

  for (const seed of materialSeeds) {
    materials.push({
      id: seed.id,
      subjectIds: seed.subjectIds,
      title: seed.title,
      statusLabel: seed.statusLabel,
      materialType: seed.materialType,
      progressMode: seed.progressMode,
      category: seed.category || "기타",
      showInSubjectView: true,
      isDefault: true,
    });

    seed.topics.forEach((title, index) => {
      materialTopics.push({
        id: materialTopicId(seed.id, index + 1),
        materialId: seed.id,
        title,
        order: index + 1,
        progress: "not-started",
        updatedAt: NOW,
        isDefault: true,
      });
    });
  }

  return { materials, materialTopics };
}

function buildSubjectMaterialSettings(materials: Material[]): SubjectMaterialSetting[] {
  const subjectIds = new Set(materials.flatMap((material) => material.subjectIds));
  return Array.from(subjectIds).flatMap((subjectId) => {
    const preferredOrder = defaultSubjectMaterialOrder[subjectId] || [];
    const rows = materials
      .filter((material) => material.subjectIds.includes(subjectId))
      .sort((a, b) => {
        const aRank = preferredOrder.includes(a.id) ? preferredOrder.indexOf(a.id) : preferredOrder.length + materials.indexOf(a);
        const bRank = preferredOrder.includes(b.id) ? preferredOrder.indexOf(b.id) : preferredOrder.length + materials.indexOf(b);
        return aRank - bRank;
      });

    return rows.map((material, index) => ({
      subjectId,
      materialId: material.id,
      visible: getDefaultSubjectMaterialVisibility(subjectId, material.id),
      order: index + 1,
    }));
  });
}

function getDefaultSubjectMaterialVisibility(subjectId: string, materialId: string) {
  if (materialId === "material-ibk-400") return subjectId === "subject-economics";
  return true;
}

function buildSubtopics(): Subtopic[] {
  const subtopicSeeds: Array<{ standardTopicId: string; titles: string[] }> = [
    ...supplementalSubtopicSeeds.map((seed) => ({
      standardTopicId: standardId(seed.prefix, seed.standardOrder),
      titles: seed.titles,
    })),
    ...taxSubtopicSeeds.map((seed) => ({
      standardTopicId: standardId("tax", seed.standardOrder),
      titles: seed.titles,
    })),
  ];

  return subtopicSeeds.flatMap((seed) =>
    seed.titles.map((title, index) => ({
      id: `sub-${seed.standardTopicId}-${String(index + 1).padStart(2, "0")}`,
      standardTopicId: seed.standardTopicId,
      title,
      order: index + 1,
      isDefault: true,
    })),
  );
}

function buildMappings(): TopicMapping[] {
  const mappings: TopicMapping[] = [];
  const add = (materialId: string, materialOrder: number, standardOrders: number[], prefix: "accounting" | "finance" | "tax") => {
    const mtId = materialTopicId(materialId, materialOrder);
    for (const order of standardOrders) {
      const standardTopicId = standardId(prefix, order);
      mappings.push({
        id: `map-${mtId}-${standardTopicId}`,
        materialTopicId: mtId,
        standardTopicId,
        isDefault: true,
      });
    }
  };

  add("material-ifrs-intermediate", 1, [1], "accounting");
  add("material-ifrs-intermediate", 2, [3], "accounting");
  add("material-ifrs-intermediate", 3, [5], "accounting");
  add("material-ifrs-intermediate", 4, [6], "accounting");
  add("material-ifrs-intermediate", 5, [7], "accounting");
  add("material-ifrs-intermediate", 6, [8], "accounting");
  add("material-ifrs-intermediate", 7, [9], "accounting");
  add("material-ifrs-intermediate", 8, [11], "accounting");
  add("material-ifrs-intermediate", 9, [10], "accounting");
  add("material-ifrs-intermediate", 10, [12], "accounting");
  add("material-ifrs-intermediate", 11, [15], "accounting");
  add("material-ifrs-intermediate", 12, [13], "accounting");
  add("material-ifrs-intermediate", 13, [14], "accounting");
  add("material-ifrs-intermediate", 14, [17], "accounting");
  add("material-ifrs-intermediate", 15, [18], "accounting");
  add("material-ifrs-intermediate", 16, [19], "accounting");
  add("material-ifrs-intermediate", 17, [20], "accounting");
  add("material-ifrs-intermediate", 18, [21], "accounting");
  add("material-ifrs-intermediate", 19, [22], "accounting");
  add("material-ifrs-intermediate", 20, [23], "accounting");

  ifrsIntermediateLectureStandardOrders.forEach((standardOrder, index) => {
    if (standardOrder) add("material-ifrs-intermediate-lecture", index + 1, [standardOrder], "accounting");
  });

  taxSummaryTopics.forEach((_, index) => {
    add("material-tax-summary", index + 1, [index + 1], "tax");
  });

  [1, 1, 2, 2, 3, 4, 4, 7].forEach((standardOrder, index) => {
    add("material-tax-lecture", index + 1, [standardOrder], "tax");
  });

  taxOxTopics.forEach((_, index) => {
    add("material-tax-ox", index + 1, [index + 1], "tax");
  });

  add("material-best-accounting", 1, [1, 3], "accounting");
  add("material-best-accounting", 2, [5], "accounting");
  add("material-best-accounting", 3, [6, 7], "accounting");
  add("material-best-accounting", 4, [8], "accounting");
  add("material-best-accounting", 5, [9, 10, 11], "accounting");
  add("material-best-accounting", 6, [12], "accounting");
  add("material-best-accounting", 7, [15], "accounting");
  add("material-best-accounting", 8, [13], "accounting");
  add("material-best-accounting", 9, [14], "accounting");
  add("material-best-accounting", 10, [17], "accounting");
  add("material-best-accounting", 11, [18], "accounting");
  add("material-best-accounting", 12, [19], "accounting");
  add("material-best-accounting", 13, [20], "accounting");
  add("material-best-accounting", 14, [21], "accounting");
  add("material-best-accounting", 15, [22], "accounting");
  add("material-best-accounting", 16, [27], "accounting");
  add("material-best-accounting", 17, [28], "accounting");
  add("material-best-accounting", 18, [26], "accounting");
  add("material-best-accounting", 19, [25], "accounting");
  add("material-best-accounting", 20, [16], "accounting");
  add("material-best-accounting", 21, [23], "accounting");
  add("material-best-accounting", 22, [23, 24], "accounting");
  add("material-best-accounting", 23, [24], "accounting");

  add("material-kim-objective-accounting", 1, [1], "accounting");
  add("material-kim-objective-accounting", 2, [2], "accounting");
  add("material-kim-objective-accounting", 3, [3], "accounting");
  add("material-kim-objective-accounting", 4, [17], "accounting");
  add("material-kim-objective-accounting", 5, [4], "accounting");
  add("material-kim-objective-accounting", 6, [5], "accounting");
  add("material-kim-objective-accounting", 7, [6], "accounting");
  add("material-kim-objective-accounting", 8, [8], "accounting");
  add("material-kim-objective-accounting", 9, [7], "accounting");
  add("material-kim-objective-accounting", 10, [9], "accounting");
  add("material-kim-objective-accounting", 11, [10, 11], "accounting");
  add("material-kim-objective-accounting", 12, [12], "accounting");
  add("material-kim-objective-accounting", 13, [15], "accounting");
  add("material-kim-objective-accounting", 14, [13], "accounting");
  add("material-kim-objective-accounting", 15, [14], "accounting");
  add("material-kim-objective-accounting", 16, [21], "accounting");
  add("material-kim-objective-accounting", 17, [18], "accounting");
  add("material-kim-objective-accounting", 18, [19], "accounting");
  add("material-kim-objective-accounting", 19, [20], "accounting");
  add("material-kim-objective-accounting", 20, [22], "accounting");
  add("material-kim-objective-accounting", 21, [23], "accounting");
  add("material-kim-objective-accounting", 22, [16, 25], "accounting");
  add("material-kim-objective-accounting", 23, [26], "accounting");
  add("material-kim-objective-accounting", 24, [27], "accounting");
  add("material-kim-objective-accounting", 25, [28], "accounting");
  add("material-kim-objective-accounting", 31, [1, 23, 24], "accounting");

  const hwangAccountingMappings: Array<[number, number[]]> = [
    [1, [1]],
    [2, [3]],
    [3, [2, 23]],
    [4, [5]],
    [5, [5]],
    [6, [5]],
    [7, [5]],
    [8, [5]],
    [9, [23]],
    [10, [6]],
    [11, [6]],
    [12, [6]],
    [13, [6]],
    [14, [6]],
    [15, [6]],
    [16, [6]],
    [17, [6]],
    [18, [7]],
    [19, [8]],
    [20, [9]],
    [21, [9]],
    [22, [9]],
    [23, [12]],
    [24, [12]],
    [25, [12]],
    [26, [12]],
    [27, [10]],
    [28, [23]],
    [29, [15]],
    [30, [15]],
    [31, [15]],
    [32, [15]],
    [33, [4]],
    [34, [4]],
    [35, [17]],
    [36, [17]],
    [37, [17]],
    [38, [13]],
    [39, [14]],
    [40, [11]],
    [41, [18]],
    [42, [18]],
    [43, [18]],
    [44, [19]],
    [45, [20]],
    [46, [20]],
    [47, [21]],
    [48, [21]],
    [49, [22]],
    [50, [22]],
    [51, [22]],
    [55, [27, 28]],
  ];
  hwangAccountingMappings.forEach(([materialOrder, standardOrders]) => {
    add("material-hwang-public-accounting", materialOrder, standardOrders, "accounting");
  });

  add("material-jihan-finance", 1, [1], "finance");
  add("material-jihan-finance", 2, [4], "finance");
  add("material-jihan-finance", 3, [5], "finance");
  add("material-jihan-finance", 4, [9], "finance");
  add("material-jihan-finance", 5, [10], "finance");
  add("material-jihan-finance", 6, [11], "finance");
  add("material-jihan-finance", 7, [14], "finance");
  add("material-jihan-finance", 8, [15], "finance");
  add("material-jihan-finance", 9, [16], "finance");
  add("material-jihan-finance", 10, [17], "finance");
  add("material-jihan-finance", 11, [18], "finance");
  add("material-jihan-finance", 12, [19], "finance");
  add("material-jihan-finance", 13, [21, 22], "finance");
  add("material-jihan-finance", 14, [23], "finance");
  add("material-jihan-finance", 15, [24], "finance");
  add("material-jihan-finance", 16, [25, 26], "finance");
  add("material-jihan-finance", 17, [27, 28, 29], "finance");

  add("material-jihan-friendly", 1, [1], "finance");
  add("material-jihan-friendly", 2, [4], "finance");
  add("material-jihan-friendly", 3, [5], "finance");
  add("material-jihan-friendly", 4, [9], "finance");
  add("material-jihan-friendly", 5, [10], "finance");
  add("material-jihan-friendly", 6, [11], "finance");
  add("material-jihan-friendly", 7, [14], "finance");
  add("material-jihan-friendly", 8, [15], "finance");
  add("material-jihan-friendly", 9, [16], "finance");
  add("material-jihan-friendly", 10, [17], "finance");
  add("material-jihan-friendly", 11, [18], "finance");
  add("material-jihan-friendly", 12, [19], "finance");
  add("material-jihan-friendly", 13, [21, 22], "finance");
  add("material-jihan-friendly", 14, [23], "finance");
  add("material-jihan-friendly", 15, [24], "finance");
  add("material-jihan-friendly", 16, [25, 26], "finance");
  add("material-jihan-friendly", 17, [27, 28, 29], "finance");

  return mappings;
}

const financeFormulaRecordSeeds: Array<{
  id: string;
  title: string;
  standardOrder: number;
  subtopicOrder?: number;
  content: string;
}> = [
  {
    id: "record-default-finance-formula-time-value",
    title: "화폐의 시간가치 공식",
    standardOrder: 2,
    subtopicOrder: 1,
    content: "FV = PV(1+r)^n\nPV = FV/(1+r)^n\n보통연금 PV = C[1 - 1/(1+r)^n]/r\n영구연금 PV = C/r",
  },
  {
    id: "record-default-finance-formula-npv-irr-pi",
    title: "투자안 평가 NPV·IRR·PI",
    standardOrder: 4,
    subtopicOrder: 1,
    content: "NPV = Σ CF_t/(1+k)^t - I_0\nIRR: NPV = 0이 되는 할인율\nPI = 현금유입 현재가치 / 초기투자액\n독립투자안: NPV > 0 채택",
  },
  {
    id: "record-default-finance-formula-ocf",
    title: "영업현금흐름 OCF",
    standardOrder: 6,
    subtopicOrder: 2,
    content: "OCF = EBIT(1-T) + 감가상각비\nOCF = (매출 - 현금영업비용)(1-T) + T×감가상각비\n감가상각 절세효과 = T×감가상각비",
  },
  {
    id: "record-default-finance-formula-portfolio",
    title: "포트폴리오 기대수익률·위험",
    standardOrder: 9,
    subtopicOrder: 1,
    content: "E(R_p) = Σ w_i E(R_i)\nσ_p^2 = ΣΣ w_i w_j Cov(R_i,R_j)\n2자산: σ_p^2 = w_A^2σ_A^2 + w_B^2σ_B^2 + 2w_Aw_Bσ_Aσ_Bρ_AB",
  },
  {
    id: "record-default-finance-formula-capm",
    title: "CAPM·베타",
    standardOrder: 10,
    subtopicOrder: 5,
    content: "E(R_i) = R_f + β_i[E(R_m)-R_f]\nβ_i = Cov(R_i,R_m) / Var(R_m)\n시장위험프리미엄 = E(R_m)-R_f",
  },
  {
    id: "record-default-finance-formula-stock-valuation",
    title: "주식 평가 공식",
    standardOrder: 14,
    subtopicOrder: 1,
    content: "제로성장: P_0 = D/k\n고든모형: P_0 = D_1/(k-g)\n성장률: g = b×ROE\nPER 접근: 주가 = EPS×PER",
  },
  {
    id: "record-default-finance-formula-bond-price",
    title: "채권가격·수익률 공식",
    standardOrder: 15,
    subtopicOrder: 1,
    content: "채권가격 P = Σ C/(1+r)^t + F/(1+r)^n\n할인채 P = F/(1+r)^n\n수익률 상승 → 채권가격 하락",
  },
  {
    id: "record-default-finance-formula-duration",
    title: "듀레이션·수정듀레이션",
    standardOrder: 16,
    subtopicOrder: 1,
    content: "D = Σ t×PV(CF_t)/P\n수정듀레이션 MD = D/(1+y)\n가격변화율 근사: ΔP/P ≈ -MD×Δy\n볼록성 보정: ΔP/P ≈ -MD×Δy + 1/2×Convexity×(Δy)^2",
  },
  {
    id: "record-default-finance-formula-leverage",
    title: "영업·재무·결합레버리지",
    standardOrder: 17,
    subtopicOrder: 1,
    content: "DOL = 공헌이익 / 영업이익 = (S-VC)/(S-VC-F)\nDFL = 영업이익 / 순이익 전 이익 = EBIT/(EBIT-I)\nDCL = DOL×DFL",
  },
  {
    id: "record-default-finance-formula-wacc-mm",
    title: "WACC·MM 법인세 공식",
    standardOrder: 17,
    subtopicOrder: 4,
    content: "WACC = k_d(1-T)D/V + k_eE/V\nMM 법인세: V_L = V_U + T_cD\n부채사용기업 자기자본비용: k_e = k_0 + (k_0-k_d)(1-T)D/E",
  },
  {
    id: "record-default-finance-formula-put-call-parity",
    title: "풋콜패리티",
    standardOrder: 23,
    subtopicOrder: 2,
    content: "C + PV(K) = P + S_0\nC - P = S_0 - PV(K)\n보호적 풋 = 주식 + 풋\n수탁자 포지션 = 콜 + 무위험채권",
  },
  {
    id: "record-default-finance-formula-futures-fx",
    title: "선물가격 공식",
    standardOrder: 25,
    subtopicOrder: 1,
    content: "무배당 투자자산 선물가격: F_0 = S_0(1+r)^T\n보유비용 모형: F_0 = S_0 + 보유비용 현재가치 - 편익 현재가치\n베이시스 = 현물가격 - 선물가격",
  },
  {
    id: "record-default-finance-formula-international-parity",
    title: "국제재무 평가관계",
    standardOrder: 26,
    subtopicOrder: 3,
    content: "이자율평가: F/S = (1+r_d)/(1+r_f)\n구매력평가: 기대환율변화율 ≈ 국내물가상승률 - 해외물가상승률\n국제피셔효과: 기대환율변화율 ≈ 국내이자율 - 해외이자율",
  },
];

function buildDefaultRecords(): StudyRecord[] {
  return financeFormulaRecordSeeds.map((seed, index) => ({
    id: seed.id,
    title: seed.title,
    content: seed.content,
    type: "암기사항",
    subjectId: "subject-finance",
    standardTopicId: standardId("finance", seed.standardOrder),
    subtopicId: seed.subtopicOrder ? subtopicId("finance", seed.standardOrder, seed.subtopicOrder) : undefined,
    tags: ["공식", "재무관리"],
    createdAt: NOW,
    updatedAt: new Date(new Date(NOW).getTime() + index * 1000).toISOString(),
    useReviewCard: true,
    studyState: "모름",
    knownCount: 0,
    unknownCount: 0,
  }));
}

export function createDefaultStudyData(): StudyData {
  const { materials, materialTopics } = buildMaterials();

  return {
    version: DATA_VERSION,
    initializedAt: NOW,
    subjects: [...subjects],
    materials,
    subjectMaterialSettings: buildSubjectMaterialSettings(materials),
    materialTopics,
    standardTopics: buildStandardTopics(),
    subtopics: buildSubtopics(),
    mappings: buildMappings(),
    records: buildDefaultRecords(),
    dDays: [],
    todayCompletions: [],
    settings: {
      reviewGapDays: 14,
    },
  };
}

export function mergeDefaultTemplate(current: StudyData): StudyData {
  const defaults = createDefaultStudyData();
  const mergeById = <T extends { id: string }>(currentRows: T[], defaultRows: T[]) => [
    ...currentRows,
    ...defaultRows.filter((defaultRow) => !currentRows.some((row) => row.id === defaultRow.id)),
  ];
  const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, " ");
  const createMaterialTopicId = (materialId: string, order: number) =>
    `mt-${materialId.replace("material-", "")}-${String(order).padStart(2, "0")}`;
  const createUniqueId = (baseId: string, usedIds: Set<string>) => {
    if (!usedIds.has(baseId)) return baseId;
    let index = 2;
    let nextId = `${baseId}-${index}`;
    while (usedIds.has(nextId)) {
      index += 1;
      nextId = `${baseId}-${index}`;
    }
    return nextId;
  };
  const mergeStandardTopics = (currentRows: StandardTopic[], defaultRows: StandardTopic[]) => {
    const aliases = new Map<string, string>();
    const rows = [...currentRows];
    defaultRows.forEach((defaultRow) => {
      const existing = rows.find(
        (row) =>
          row.id === defaultRow.id ||
          (row.subjectId === defaultRow.subjectId && normalizeLabel(row.title) === normalizeLabel(defaultRow.title)),
      );
      if (existing) {
        aliases.set(defaultRow.id, existing.id);
        return;
      }
      rows.push(defaultRow);
      aliases.set(defaultRow.id, defaultRow.id);
    });
    return { rows, aliases };
  };
  const mergeMaterials = (currentRows: Material[], defaultRows: Material[]) => {
    const aliases = new Map<string, string>();
    const rows = [...currentRows];
    defaultRows.forEach((defaultRow) => {
      const existing = rows.find(
        (row) => row.id === defaultRow.id || normalizeLabel(row.title) === normalizeLabel(defaultRow.title),
      );
      if (existing) {
        aliases.set(defaultRow.id, existing.id);
        const subjectIds = Array.from(new Set([...(existing.subjectIds || []), ...defaultRow.subjectIds]));
        const index = rows.findIndex((row) => row.id === existing.id);
        rows[index] = {
          ...existing,
          subjectIds,
          materialType: existing.materialType ?? defaultRow.materialType,
          progressMode: existing.progressMode ?? defaultRow.progressMode,
          category: existing.category ?? defaultRow.category,
          isDefault: existing.isDefault ?? defaultRow.isDefault,
        };
        return;
      }
      rows.push(defaultRow);
      aliases.set(defaultRow.id, defaultRow.id);
    });
    return { rows, aliases };
  };
  const mergeMaterialTopics = (
    currentRows: MaterialTopic[],
    defaultRows: MaterialTopic[],
    materialAliases: Map<string, string>,
  ) => {
    const aliases = new Map<string, string>();
    const rows = [...currentRows];
    const usedIds = new Set(rows.map((row) => row.id));
    defaultRows.forEach((defaultRow) => {
      const materialId = materialAliases.get(defaultRow.materialId) || defaultRow.materialId;
      const existing = rows.find(
        (row) =>
          row.id === defaultRow.id ||
          (row.materialId === materialId && normalizeLabel(row.title) === normalizeLabel(defaultRow.title)),
      );
      if (existing) {
        aliases.set(defaultRow.id, existing.id);
        return;
      }
      const baseId = materialId === defaultRow.materialId ? defaultRow.id : createMaterialTopicId(materialId, defaultRow.order);
      const id = createUniqueId(baseId, usedIds);
      usedIds.add(id);
      rows.push({ ...defaultRow, id, materialId });
      aliases.set(defaultRow.id, id);
    });
    return { rows, aliases };
  };
  const mergeMappings = (
    currentRows: TopicMapping[],
    defaultRows: TopicMapping[],
    standardAliases: Map<string, string>,
    materialTopicAliases: Map<string, string>,
    materialTopics: MaterialTopic[],
    standardTopics: StandardTopic[],
  ) => {
    const materialTopicIds = new Set(materialTopics.map((topic) => topic.id));
    const standardTopicIds = new Set(standardTopics.map((topic) => topic.id));
    const currentKeys = new Set(currentRows.map((row) => `${row.materialTopicId}:${row.standardTopicId}`));
    const addedRows = defaultRows
      .map((defaultRow) => {
        const materialTopicId = materialTopicAliases.get(defaultRow.materialTopicId) || defaultRow.materialTopicId;
        const standardTopicId = standardAliases.get(defaultRow.standardTopicId) || defaultRow.standardTopicId;
        return {
          ...defaultRow,
          id: `map-${materialTopicId}-${standardTopicId}`,
          materialTopicId,
          standardTopicId,
        };
      })
      .filter(
        (row) =>
          materialTopicIds.has(row.materialTopicId) &&
          standardTopicIds.has(row.standardTopicId) &&
          !currentKeys.has(`${row.materialTopicId}:${row.standardTopicId}`),
      );
    return [...currentRows, ...addedRows];
  };
  const mergeSubtopics = (currentRows: Subtopic[], defaultRows: Subtopic[], standardAliases: Map<string, string>) => {
    const currentKeys = new Set(currentRows.map((row) => `${row.standardTopicId}:${normalizeLabel(row.title)}`));
    const currentIds = new Set(currentRows.map((row) => row.id));
    const addedRows = defaultRows
      .map((defaultRow) => {
        const standardTopicId = standardAliases.get(defaultRow.standardTopicId) || defaultRow.standardTopicId;
        return {
          ...defaultRow,
          id: standardTopicId === defaultRow.standardTopicId ? defaultRow.id : `sub-${standardTopicId}-${String(defaultRow.order).padStart(2, "0")}`,
          standardTopicId,
        };
      })
      .filter((row) => !currentIds.has(row.id) && !currentKeys.has(`${row.standardTopicId}:${normalizeLabel(row.title)}`));
    return [...currentRows, ...addedRows];
  };
  const mergeSubjectMaterialSettings = (
    currentRows: SubjectMaterialSetting[] = [],
    defaultRows: SubjectMaterialSetting[],
    materialAliases: Map<string, string>,
  ) => {
    const currentKeys = new Set(currentRows.map((row) => `${row.subjectId}:${row.materialId}`));
    const addedRows = defaultRows
      .map((defaultRow) => ({
        ...defaultRow,
        materialId: materialAliases.get(defaultRow.materialId) || defaultRow.materialId,
      }))
      .filter((row) => !currentKeys.has(`${row.subjectId}:${row.materialId}`));
    return [
      ...currentRows,
      ...addedRows,
    ];
  };
  const materials = mergeMaterials(current.materials, defaults.materials);
  const materialTopics = mergeMaterialTopics(current.materialTopics, defaults.materialTopics, materials.aliases);
  const standardTopics = mergeStandardTopics(current.standardTopics, defaults.standardTopics);

  return {
    ...current,
    subjects: mergeById(current.subjects, defaults.subjects),
    materials: materials.rows,
    subjectMaterialSettings: mergeSubjectMaterialSettings(
      current.subjectMaterialSettings,
      defaults.subjectMaterialSettings,
      materials.aliases,
    ),
    materialTopics: materialTopics.rows,
    standardTopics: standardTopics.rows,
    subtopics: mergeSubtopics(current.subtopics, defaults.subtopics, standardTopics.aliases),
    mappings: mergeMappings(
      current.mappings,
      defaults.mappings,
      standardTopics.aliases,
      materialTopics.aliases,
      materialTopics.rows,
      standardTopics.rows,
    ),
    settings: {
      ...defaults.settings,
      ...current.settings,
    },
  };
}
