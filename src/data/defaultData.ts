import type {
  Material,
  MaterialCategory,
  MaterialTopic,
  StandardTopic,
  StudyData,
  SubjectMaterialSetting,
  Subtopic,
  Subject,
  TopicMapping,
} from "../types";

const NOW = "2026-05-12T00:00:00.000Z";
const DATA_VERSION = 11;

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
    {
      standardTopicId: standardId("accounting", 6),
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
    {
      standardTopicId: standardId("accounting", 5),
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
      ],
    },
    {
      standardTopicId: standardId("finance", 10),
      titles: [
        "효율적 투자선",
        "자본시장선",
        "증권특성선",
        "증권시장선",
        "베타",
        "시장위험프리미엄",
        "CAPM 한계",
      ],
    },
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
    records: [],
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
