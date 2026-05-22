import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type JSX,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createDefaultStudyData, mergeDefaultTemplate } from "./data/defaultData";
import { CoralCrowLogo } from "./components/CoralCrowLogo";
import { clearAuthSession, loadAuthSession, loadStudyData, saveAuthSession, saveStudyData, type AuthSession } from "./lib/idb";
import { createId, formatOrder, parseOutline } from "./lib/outlineParser";
import {
  isSupabaseConfigured,
  loadCloudStudyData,
  refreshAuthSession,
  saveCloudStudyData,
  signInWithPassword,
  signUpWithPassword,
} from "./lib/supabaseSync";
import {
  MATERIAL_CATEGORIES,
  PROGRESS_STATUSES,
  RECORD_TYPES,
  STUDY_STATES,
  type Material,
  type MaterialCategory,
  type MaterialTopic,
  type DDayEvent,
  type ProgressStatus,
  type RecordType,
  type StandardTopic,
  type StudyData,
  type StudyRecord,
  type StudyState,
  type SubjectMaterialSetting,
  type Subject,
  type Subtopic,
  type TopicMapping,
  type TodayCompletionLog,
} from "./types";

const DEFAULT_DASHBOARD_SUBJECT_IDS = new Set(["subject-accounting", "subject-finance"]);
const CURRENT_DATA_VERSION = 12;
const DEFAULT_SUBJECT_MATERIAL_ORDER: Record<string, string[]> = {
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
const DEFAULT_MATERIAL_CATEGORY_BY_ID: Record<string, MaterialCategory> = {
  "material-ifrs-intermediate-lecture": "인강",
  "material-tax-lecture": "인강",
  "material-ifrs-intermediate": "이론",
  "material-jihan-finance": "이론",
  "material-tax-summary": "이론",
  "material-best-accounting": "문제",
  "material-kim-objective-accounting": "문제",
  "material-jihan-friendly": "문제",
  "material-ibk-400": "문제",
  "material-tax-ox": "문제",
  "material-hwang-public-accounting": "문제",
};
const SESSION_KEYS = {
  lastSubjectId: "geumgong:lastSubjectId",
  lastTopicId: "geumgong:lastTopicId",
  lastMaterialId: "geumgong:lastMaterialId",
  lastMaterialContextSubjectId: "geumgong:lastMaterialContextSubjectId",
  lastMaterialTopicId: "geumgong:lastMaterialTopicId",
  focusMaterialTopicId: "geumgong:focusMaterialTopicId",
  recordFilters: "geumgong:recordFilters",
  recordScrollY: "geumgong:recordScrollY",
  focusRecordId: "geumgong:focusRecordId",
} as const;
const RECORD_DELETE_CONFIRM = "이 기록을 휴지통으로 이동할까요?";
const PERMANENT_DELETE_CONFIRM = "이 기록을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.";
const EMPTY_TRASH_CONFIRM = "휴지통의 기록을 모두 영구 삭제할까요?";
const RECORD_FILTER_MOBILE_QUERY = "(max-width: 680px)";
const MOBILE_ZOOM_LOCK_QUERY = "(max-width: 680px), (pointer: coarse)";
const RICH_MATH_SELECTOR =
  "math, .katex, .MathJax, [data-tex], [data-latex], script[type^='math/tex'], script[type='application/x-tex']";
const DEFAULT_VIEWPORT_CONTENT = "width=device-width, initial-scale=1.0, viewport-fit=cover";
const MOBILE_LOCKED_VIEWPORT_CONTENT = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";
const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_TODO_TARGET_COUNT = 9;
const INVITE_CODE = import.meta.env.VITE_INVITE_CODE?.trim();
const INVITE_SIGNUP_NOTICE =
  "서버 비용 관리 때문에 초대받은 사용자만 가입할 수 있습니다. 제작자 블로그로 문의해주세요. 로그인 없이도 이 브라우저에 저장해 사용할 수 있습니다.";

const DEFAULT_RECORD_TAGS = [
  "계산실수",
  "공식착각",
  "조건누락",
  "개념혼동",
  "암기부족",
  "선지함정",
  "시간부족",
  "자주틀림",
  "말문제",
  "계산문제",
  "재확인",
];

const REVIEW_CARD_DEFAULT_BY_TYPE: Record<RecordType, boolean> = {
  일반메모: false,
  오답: true,
  헷갈림: true,
  회계처리: true,
  암기사항: true,
  GPT링크: false,
  주의사항: true,
  시험팁: true,
};

const RECORD_TEMPLATES: Record<RecordType, string> = {
  오답: "틀린 이유:\n정답 포인트:\n다음에 볼 때 체크할 것:",
  헷갈림: "헷갈린 개념:\n구분 기준:\n예시:\n한 줄 정리:",
  회계처리:
    "거래/상황:\n\n차변                         | 대변\n계정과목 / 금액              | 계정과목 / 금액\n-----------------------------|-----------------------------\n                              |\n                              |\n\n근거:\n주의할 점:",
  암기사항: "외울 내용:\n조건:\n예외:\n한 줄 암기 포인트:",
  GPT링크: "질문한 내용:\n핵심 답변:\n다시 볼 포인트:\n링크:",
  주의사항: "주의할 조건:\n실수하기 쉬운 부분:\n체크포인트:",
  시험팁: "상황:\n풀이 전략:\n시간 단축 포인트:",
  일반메모: "메모:\n연결해서 볼 내용:",
};

type SyncPatch = {
  subjects: Set<string>;
  materials: Set<string>;
  subjectMaterialSettings: Set<string>;
  materialTopics: Set<string>;
  standardTopics: Set<string>;
  subtopics: Set<string>;
  mappings: Set<string>;
  records: Set<string>;
  dDays: Set<string>;
  todayCompletions: Set<string>;
  settings: boolean;
};

type PullRefreshStatus = "idle" | "pulling" | "ready" | "refreshing" | "done" | "error";

const navItems = [
  { path: "dashboard", label: "대시보드" },
  { path: "subjects", label: "과목" },
  { path: "materials", label: "자료" },
  { path: "records", label: "기록함" },
  { path: "settings", label: "설정" },
];

type RecordModalContext =
  | {
      mode: "create";
      subjectId?: string;
      standardTopicId?: string;
      materialId?: string;
      materialTopicId?: string;
      candidateStandardTopicIds?: string[];
    }
  | { mode: "edit"; recordId: string };

type ReviewSession = {
  title: string;
  recordIds: string[];
};

type RecordFilters = {
  subjectIds: string[];
  standardTopicIds: string[];
  subtopicIds: string[];
  materialIds: string[];
  materialTopicIds: string[];
  types: RecordType[];
  studyStates: StudyState[];
  tagNames: string[];
  uncategorizedOnly: boolean;
};

function createEmptyRecordFilters(): RecordFilters {
  return {
    subjectIds: [],
    standardTopicIds: [],
    subtopicIds: [],
    materialIds: [],
    materialTopicIds: [],
    types: [],
    studyStates: [],
    tagNames: [],
    uncategorizedOnly: false,
  };
}

function normalizeRecordFilters(value: Partial<RecordFilters> | null | undefined): RecordFilters {
  const empty = createEmptyRecordFilters();
  return {
    subjectIds: Array.isArray(value?.subjectIds) ? value.subjectIds : empty.subjectIds,
    standardTopicIds: Array.isArray(value?.standardTopicIds) ? value.standardTopicIds : empty.standardTopicIds,
    subtopicIds: Array.isArray(value?.subtopicIds) ? value.subtopicIds : empty.subtopicIds,
    materialIds: Array.isArray(value?.materialIds) ? value.materialIds : empty.materialIds,
    materialTopicIds: Array.isArray(value?.materialTopicIds) ? value.materialTopicIds : empty.materialTopicIds,
    types: Array.isArray(value?.types) ? value.types : empty.types,
    studyStates: Array.isArray(value?.studyStates) ? value.studyStates : empty.studyStates,
    tagNames: Array.isArray(value?.tagNames) ? value.tagNames : empty.tagNames,
    uncategorizedOnly: Boolean(value?.uncategorizedOnly),
  };
}

function isRecordFilterCompactViewport() {
  return typeof window !== "undefined" && window.matchMedia(RECORD_FILTER_MOBILE_QUERY).matches;
}

function getMediaQueryMatches(query: string) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => getMediaQueryMatches(query));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia(query);
    const syncMatches = () => setMatches(media.matches);
    syncMatches();
    media.addEventListener("change", syncMatches);
    return () => media.removeEventListener("change", syncMatches);
  }, [query]);

  return matches;
}

function getHashPath() {
  return window.location.hash.replace(/^#\/?/, "") || "dashboard";
}

function navigate(path: string) {
  window.location.hash = `#/${path}`;
}

function scrollPageToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function isInteractiveElement(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, input, select, textarea, summary, a, [role='button'], .modal-backdrop"));
}

function handleRichMathTextPaste(event: ClipboardEvent<HTMLTextAreaElement>, onChange: (value: string) => void) {
  const text = getRichMathClipboardText(event.clipboardData);
  if (!text) return;

  event.preventDefault();
  const textarea = event.currentTarget;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const nextValue = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;

  onChange(nextValue);
  window.requestAnimationFrame(() => {
    textarea.selectionStart = start + text.length;
    textarea.selectionEnd = start + text.length;
  });
}

function getRichMathClipboardText(clipboardData: DataTransfer) {
  const html = clipboardData.getData("text/html");
  if (!html || typeof DOMParser === "undefined") return "";

  const extracted = extractRichMathText(html);
  if (extracted.formulaCount === 0 || !extracted.text) return "";

  const plainText = clipboardData.getData("text/plain");
  if (!plainText.trim()) return extracted.text;

  return normalizePasteCompareText(plainText) === normalizePasteCompareText(extracted.text) ? "" : extracted.text;
}

function extractRichMathText(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const body = document.body;
  let formulaCount = 0;

  Array.from(body.querySelectorAll(RICH_MATH_SELECTOR))
    .filter((node) => !node.parentElement?.closest(RICH_MATH_SELECTOR))
    .forEach((node) => {
      const formula = extractFormulaText(node);
      if (!formula) return;
      formulaCount += 1;
      node.replaceWith(document.createTextNode(` ${formula} `));
    });

  body.querySelectorAll("script, style, noscript").forEach((node) => node.remove());

  return {
    formulaCount,
    text: normalizePastedMathText(body.textContent || ""),
  };
}

function extractFormulaText(node: Element) {
  const dataFormula = node.getAttribute("data-tex") || node.getAttribute("data-latex");
  if (dataFormula) return normalizeFormulaText(dataFormula);

  if (node.tagName.toLowerCase() === "script") {
    return normalizeFormulaText(node.textContent || "");
  }

  const annotation = Array.from(node.querySelectorAll("annotation")).find((item) => {
    const encoding = item.getAttribute("encoding")?.toLowerCase() || "";
    return encoding.includes("tex") || encoding.includes("latex");
  });
  if (annotation?.textContent) return normalizeFormulaText(annotation.textContent);

  const mathNode = node.matches("math") ? node : node.querySelector("math");
  if (mathNode) {
    const label = mathNode.getAttribute("alttext") || mathNode.getAttribute("aria-label");
    return normalizeFormulaText(label || mathMlToText(mathNode));
  }

  const label = node.getAttribute("aria-label") || node.getAttribute("title");
  return normalizeFormulaText(label || "");
}

function mathMlToText(node: Element): string {
  const name = node.localName.toLowerCase();
  const children = Array.from(node.children).filter((child) => !["annotation", "annotation-xml"].includes(child.localName.toLowerCase()));
  const child = (index: number) => normalizeFormulaText(children[index] ? mathMlToText(children[index]) : "");
  const joinedChildren = () => normalizeFormulaText(children.map(mathMlToText).join(""));

  if (["mi", "mn", "mo", "mtext"].includes(name)) return normalizeFormulaText(node.textContent || "");
  if (name === "semantics") return child(0);
  if (["math", "mrow", "mstyle", "mpadded", "menclose"].includes(name)) return joinedChildren();
  if (name === "mfrac") return `(${child(0)})/(${child(1)})`;
  if (name === "msqrt") return `√(${joinedChildren()})`;
  if (name === "mroot") return `${formatMathScript(child(1))}√(${child(0)})`;
  if (name === "msub") return `${child(0)}_${formatMathScript(child(1))}`;
  if (name === "msup") return `${child(0)}^${formatMathScript(child(1))}`;
  if (name === "msubsup") return `${child(0)}_${formatMathScript(child(1))}^${formatMathScript(child(2))}`;
  if (name === "munder") return `${child(0)}_${formatMathScript(child(1))}`;
  if (name === "mover") return `${child(0)}^${formatMathScript(child(1))}`;
  if (name === "munderover") return `${child(0)}_${formatMathScript(child(1))}^${formatMathScript(child(2))}`;

  return children.length > 0 ? joinedChildren() : normalizeFormulaText(node.textContent || "");
}

function formatMathScript(value: string) {
  if (!value) return "{}";
  return value.length === 1 || (value.startsWith("{") && value.endsWith("}")) ? value : `{${value}}`;
}

function normalizeFormulaText(value: string) {
  return value.replace(/[\u200b-\u200d\ufeff]/g, "").replace(/\u00a0/g, " ").trim();
}

function normalizePastedMathText(value: string) {
  return normalizeFormulaText(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizePasteCompareText(value: string) {
  return normalizeFormulaText(value).replace(/\s+/g, "");
}

function getPullRefreshLabel(status: PullRefreshStatus) {
  if (status === "ready") return "놓으면 동기화";
  if (status === "refreshing") return "동기화 중";
  if (status === "done") return "동기화 완료";
  if (status === "error") return "동기화 실패";
  return "아래로 당겨 동기화";
}

function readSessionValue(key: string) {
  try {
    return window.sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage may be blocked in some browser modes.
  }
}

function removeSessionValues(keys: string[]) {
  try {
    keys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // sessionStorage may be blocked in some browser modes.
  }
}

function readSessionJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionJson(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage may be blocked in some browser modes.
  }
}

function getRememberedSubjectPath(data: StudyData) {
  const subjectId = readSessionValue(SESSION_KEYS.lastSubjectId);
  if (!data.subjects.some((subject) => subject.id === subjectId)) return "subjects";
  const topicId = readSessionValue(SESSION_KEYS.lastTopicId);
  if (data.standardTopics.some((topic) => topic.id === topicId && topic.subjectId === subjectId)) {
    return `subjects/${subjectId}/topics/${topicId}`;
  }
  return `subjects/${subjectId}`;
}

function getRememberedMaterialPath(data: StudyData) {
  const materialId = readSessionValue(SESSION_KEYS.lastMaterialId);
  const material = data.materials.find((item) => item.id === materialId);
  if (!material) return "materials";
  const subjectId = readSessionValue(SESSION_KEYS.lastMaterialContextSubjectId);
  return subjectId && materialHasSubject(material, subjectId) ? `materials/${materialId}/${subjectId}` : `materials/${materialId}`;
}

function getNavPath(path: string, data: StudyData) {
  if (path === "subjects") return getRememberedSubjectPath(data);
  if (path === "materials") return getRememberedMaterialPath(data);
  return path;
}

function useHashPath() {
  const [path, setPath] = useState(getHashPath);

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", handleHashChange);
    if (!window.location.hash) navigate("dashboard");
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return path;
}

function useMobileZoomLock() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const originalViewportContent = viewport?.getAttribute("content") || DEFAULT_VIEWPORT_CONTENT;
    const media = window.matchMedia(MOBILE_ZOOM_LOCK_QUERY);
    const setViewportContent = () => {
      viewport?.setAttribute("content", media.matches ? MOBILE_LOCKED_VIEWPORT_CONTENT : originalViewportContent);
    };
    const preventGestureZoom = (event: Event) => {
      if (!media.matches || !event.cancelable) return;
      event.preventDefault();
    };
    const preventPinchZoom = (event: TouchEvent) => {
      if (!media.matches || event.touches.length < 2 || !event.cancelable) return;
      event.preventDefault();
    };

    setViewportContent();
    media.addEventListener("change", setViewportContent);
    document.addEventListener("gesturestart", preventGestureZoom, { passive: false });
    document.addEventListener("gesturechange", preventGestureZoom, { passive: false });
    document.addEventListener("gestureend", preventGestureZoom, { passive: false });
    document.addEventListener("touchmove", preventPinchZoom, { passive: false });

    return () => {
      media.removeEventListener("change", setViewportContent);
      document.removeEventListener("gesturestart", preventGestureZoom);
      document.removeEventListener("gesturechange", preventGestureZoom);
      document.removeEventListener("gestureend", preventGestureZoom);
      document.removeEventListener("touchmove", preventPinchZoom);
      viewport?.setAttribute("content", originalViewportContent);
    };
  }, []);
}

function App() {
  useMobileZoomLock();

  const [data, setData] = useState<StudyData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [pullRefreshStatus, setPullRefreshStatus] = useState<PullRefreshStatus>("idle");
  const dataRef = useRef<StudyData | null>(null);
  const authSessionRef = useRef<AuthSession | null>(null);
  const cloudSyncRef = useRef<{ inFlight: boolean; pendingData: StudyData | null; pendingPatch: SyncPatch | null }>({
    inFlight: false,
    pendingData: null,
    pendingPatch: null,
  });
  const autoCloudPullRef = useRef({ inFlight: false, lastPulledAt: 0 });
  const pullRefreshRef = useRef({ active: false, ready: false, startY: 0, lastY: 0 });

  function rememberStudyData(next: StudyData | null) {
    dataRef.current = next;
    setData(next);
  }

  function rememberAuthSession(session: AuthSession | null) {
    authSessionRef.current = session;
    setAuthSession(session);
  }

  useEffect(() => {
    let mounted = true;

    Promise.all([loadStudyData(), loadAuthSession()])
      .then(async ([stored, savedSession]) => {
        if (!mounted) return;
        const localData = stored ? normalizeStudyData(stored) : normalizeStudyData(createDefaultStudyData());

        if (savedSession && isSupabaseConfigured) {
          try {
            const session = await refreshAuthSession(savedSession);
            if (!mounted) return;
            rememberAuthSession(session);
            void saveAuthSession(session);
            const cloudRow = await loadCloudStudyData(session);
            if (!mounted) return;
            if (cloudRow) {
              const cloudData = normalizeStudyData(cloudRow.data);
              const mergedData = cloudData;
              rememberStudyData(mergedData);
              void saveStudyData(mergedData);
              setSyncMessage("클라우드 데이터와 연결됨");
              return;
            }
            rememberStudyData(localData);
            void saveStudyData(localData);
            void saveCloudStudyData(session, localData);
            setSyncMessage("이 브라우저 데이터를 클라우드에 올림");
            return;
          } catch (error) {
            console.error("Failed to restore cloud session", error);
            void clearAuthSession();
            setAuthSession(null);
            setSyncMessage("로그인이 만료되어 로컬 데이터로 열림");
          }
        }

        if (stored) {
          rememberStudyData(localData);
          void saveStudyData(localData);
          return;
        }
        rememberStudyData(localData);
        void saveStudyData(localData);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "IndexedDB를 열 수 없습니다.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const queueCloudSync = (next: StudyData, patch: SyncPatch) => {
    if (!authSessionRef.current) return;
    cloudSyncRef.current.pendingData = next;
    cloudSyncRef.current.pendingPatch = mergeSyncPatches(cloudSyncRef.current.pendingPatch, patch);
    void flushCloudSyncQueue();
  };

  const flushCloudSyncQueue = async () => {
    const syncState = cloudSyncRef.current;
    if (syncState.inFlight) return;
    const session = authSessionRef.current;
    const pendingData = syncState.pendingData;
    const pendingPatch = syncState.pendingPatch;
    if (!session || !pendingData || !pendingPatch) return;

    syncState.inFlight = true;
    syncState.pendingData = null;
    syncState.pendingPatch = null;
    try {
      const refreshed = await refreshAuthSession(session);
      if (refreshed.accessToken !== session.accessToken || refreshed.refreshToken !== session.refreshToken) {
        await saveAuthSession(refreshed);
        rememberAuthSession(refreshed);
      }
      const cloudRow = await loadCloudStudyData(refreshed);
      const mergedData = cloudRow ? mergeStudyDataWithPatch(cloudRow.data, pendingData, pendingPatch) : pendingData;
      await saveCloudStudyData(refreshed, mergedData);
      if (!syncState.pendingData) {
        rememberStudyData(mergedData);
        void saveStudyData(mergedData);
      }
    } catch (error) {
      console.error("Failed to sync study data", error);
      setSyncMessage("클라우드 저장 실패");
    } finally {
      syncState.inFlight = false;
      if (syncState.pendingData && syncState.pendingPatch && authSessionRef.current) void flushCloudSyncQueue();
    }
  };

  const getFreshAuthSession = async () => {
    const session = authSessionRef.current;
    if (!session) throw new Error("로그인이 필요합니다.");
    const refreshed = await refreshAuthSession(session);
    if (refreshed.accessToken !== session.accessToken || refreshed.refreshToken !== session.refreshToken) {
      await saveAuthSession(refreshed);
      rememberAuthSession(refreshed);
    }
    return refreshed;
  };

  const updateData = (updater: (current: StudyData) => StudyData) => {
    setData((current) => {
      if (!current) return current;
      const next = normalizeStudyData(updater(current));
      const patch = createSyncPatch(current, next);
      dataRef.current = next;
      void saveStudyData(next).catch((error) => {
        console.error("Failed to save study data", error);
      });
      queueCloudSync(next, patch);
      return next;
    });
  };

  const replaceData = (next: StudyData) => {
    const normalized = normalizeStudyData(next);
    rememberStudyData(normalized);
    void saveStudyData(normalized);
    queueCloudSync(normalized, createFullSyncPatch(normalized));
  };

  const handleSignIn = async (email: string, password: string) => {
    if (!data) throw new Error("학습 데이터가 아직 준비되지 않았습니다.");
    const session = await signInWithPassword(email, password);
    await saveAuthSession(session);
    rememberAuthSession(session);
    const cloudRow = await loadCloudStudyData(session);
    if (cloudRow) {
      const mergedData = normalizeStudyData(cloudRow.data);
      rememberStudyData(mergedData);
      await saveStudyData(mergedData);
      setSyncMessage("클라우드 데이터 불러옴");
      return;
    }
    await saveCloudStudyData(session, data);
    setSyncMessage("현재 브라우저 데이터를 클라우드에 올림");
  };

  const handleSignUp = async (email: string, password: string) => {
    if (!data) throw new Error("학습 데이터가 아직 준비되지 않았습니다.");
    const session = await signUpWithPassword(email, password);
    if (!session) {
      setSyncMessage("가입 확인 메일을 확인해주세요.");
      return;
    }
    await saveAuthSession(session);
    rememberAuthSession(session);
    await saveCloudStudyData(session, data);
    setSyncMessage("가입 후 현재 데이터를 클라우드에 올림");
  };

  const reloadCloudData = async (options: { silent?: boolean; skipIfLocalChange?: boolean } = {}) => {
    const currentData = dataRef.current;
    if (!currentData) throw new Error("학습 데이터가 아직 준비되지 않았습니다.");
    const session = await getFreshAuthSession();
    const cloudRow = await loadCloudStudyData(session);
    if (!cloudRow) {
      if (options.skipIfLocalChange && (cloudSyncRef.current.inFlight || cloudSyncRef.current.pendingData)) return;
      await saveCloudStudyData(session, currentData);
      if (!options.silent) setSyncMessage("클라우드 데이터가 없어 현재 데이터를 저장함");
      return;
    }
    if (options.skipIfLocalChange && (cloudSyncRef.current.inFlight || cloudSyncRef.current.pendingData)) return;
    const cloudData = normalizeStudyData(cloudRow.data);
    rememberStudyData(cloudData);
    await saveStudyData(cloudData);
    if (!options.silent) setSyncMessage("클라우드 데이터 불러옴");
  };

  const handleReloadCloud = async () => {
    await reloadCloudData();
  };

  const handleSaveCloud = async () => {
    const currentData = dataRef.current;
    if (!currentData) throw new Error("학습 데이터가 아직 준비되지 않았습니다.");
    const session = await getFreshAuthSession();
    const normalized = normalizeStudyData(currentData);
    await saveCloudStudyData(session, normalized);
    rememberStudyData(normalized);
    await saveStudyData(normalized);
    setSyncMessage("현재 데이터를 클라우드에 저장함");
  };

  const tryAutoReloadCloud = async () => {
    if (!isSupabaseConfigured || !authSessionRef.current || !dataRef.current) return;
    if (!getMediaQueryMatches(MOBILE_ZOOM_LOCK_QUERY)) return;
    if (cloudSyncRef.current.inFlight || cloudSyncRef.current.pendingData || autoCloudPullRef.current.inFlight) return;
    const now = Date.now();
    if (now - autoCloudPullRef.current.lastPulledAt < 10_000) return;

    autoCloudPullRef.current = { inFlight: true, lastPulledAt: now };
    try {
      await reloadCloudData({ silent: true, skipIfLocalChange: true });
    } catch (error) {
      console.error("Failed to auto reload cloud data", error);
    } finally {
      autoCloudPullRef.current.inFlight = false;
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void tryAutoReloadCloud();
    };
    const handleFocus = () => {
      void tryAutoReloadCloud();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const threshold = 76;
    let resetTimer: number | undefined;

    const canPullRefresh = (event: TouchEvent) =>
      isSupabaseConfigured &&
      getMediaQueryMatches(MOBILE_ZOOM_LOCK_QUERY) &&
      authSessionRef.current &&
      dataRef.current &&
      window.scrollY <= 0 &&
      !cloudSyncRef.current.inFlight &&
      !cloudSyncRef.current.pendingData &&
      !autoCloudPullRef.current.inFlight &&
      !isInteractiveElement(event.target);

    const resetPullRefresh = (delay = 0) => {
      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        setPullRefreshStatus("idle");
      }, delay);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !canPullRefresh(event)) return;
      const y = event.touches[0].clientY;
      pullRefreshRef.current = { active: true, ready: false, startY: y, lastY: y };
      setPullRefreshStatus("idle");
    };

    const handleTouchMove = (event: TouchEvent) => {
      const state = pullRefreshRef.current;
      if (!state.active || event.touches.length !== 1) return;
      const y = event.touches[0].clientY;
      const distance = y - state.startY;
      state.lastY = y;
      if (distance <= 12) {
        setPullRefreshStatus("idle");
        return;
      }
      if (event.cancelable) event.preventDefault();
      const ready = distance >= threshold;
      state.ready = ready;
      setPullRefreshStatus(ready ? "ready" : "pulling");
    };

    const handleTouchEnd = () => {
      const state = pullRefreshRef.current;
      if (!state.active) return;
      pullRefreshRef.current = { active: false, ready: false, startY: 0, lastY: 0 };
      if (!state.ready) {
        resetPullRefresh();
        return;
      }

      setPullRefreshStatus("refreshing");
      reloadCloudData({ silent: true, skipIfLocalChange: true })
        .then(() => {
          setPullRefreshStatus("done");
          resetPullRefresh(850);
        })
        .catch((error) => {
          console.error("Failed to pull refresh cloud data", error);
          setPullRefreshStatus("error");
          resetPullRefresh(1200);
        });
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      if (resetTimer) window.clearTimeout(resetTimer);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const handleSignOut = async () => {
    await clearAuthSession();
    rememberAuthSession(null);
    cloudSyncRef.current.pendingData = null;
    cloudSyncRef.current.pendingPatch = null;
    setSyncMessage("로그아웃됨. 이 브라우저의 로컬 데이터는 유지됩니다. 공용/외부 컴퓨터에서는 전체 초기화까지 실행하는 것이 안전합니다.");
  };

  if (loadError) {
    return (
      <main className="fallback-screen">
        <CoralCrowLogo className="fallback-logo" />
        <h1>금공러</h1>
        <p>브라우저 저장소를 불러오지 못했습니다.</p>
        <code>{loadError}</code>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="fallback-screen">
        <CoralCrowLogo className="fallback-logo" />
        <div className="loader" />
        <p>학습 데이터를 준비하는 중입니다.</p>
      </main>
    );
  }

  return (
    <>
      {pullRefreshStatus !== "idle" && (
        <div className={`pull-refresh-indicator ${pullRefreshStatus}`} aria-live="polite">
          {getPullRefreshLabel(pullRefreshStatus)}
        </div>
      )}
      <HashRouter
        data={data}
        updateData={updateData}
        replaceData={replaceData}
        authSession={authSession}
        syncMessage={syncMessage}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onSignOut={handleSignOut}
        onReloadCloud={handleReloadCloud}
        onSaveCloud={handleSaveCloud}
      />
    </>
  );
}

function HashRouter({
  data,
  updateData,
  replaceData,
  authSession,
  syncMessage,
  onSignIn,
  onSignUp,
  onSignOut,
  onReloadCloud,
  onSaveCloud,
}: {
  data: StudyData;
  updateData: (updater: (current: StudyData) => StudyData) => void;
  replaceData: (next: StudyData) => void;
  authSession: AuthSession | null;
  syncMessage: string;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onReloadCloud: () => Promise<void>;
  onSaveCloud: () => Promise<void>;
}) {
  const path = useHashPath();
  const [recordModal, setRecordModal] = useState<RecordModalContext | null>(null);
  const [mappingTopic, setMappingTopic] = useState<MaterialTopic | null>(null);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [todayCompleteOpen, setTodayCompleteOpen] = useState(false);
  const segments = path.split("/").filter(Boolean);
  const page = segments[0] || "dashboard";

  const startReview = (title: string, records: StudyRecord[]) => {
    const reviewable = records.filter((record) => record.useReviewCard && !isRecordDeleted(record));
    if (reviewable.length === 0) return;
    setReviewSession({ title, recordIds: reviewable.map((record) => record.id) });
  };

  const openQuickRecord = () => {
    setRecordModal(getQuickRecordContext(path, data));
  };
  const todayCompletionTotal = getTodayCompletionSummary(data).total;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  let content: JSX.Element;
  if (reviewSession) {
    content = (
      <ReviewPage
        data={data}
        session={reviewSession}
        onClose={() => setReviewSession(null)}
        updateData={updateData}
      />
    );
  } else if (page === "subjects") {
    content = (
      <SubjectsPage
        data={data}
        selectedSubjectId={segments[1]}
        selectedTopicId={segments[3]}
        updateData={updateData}
        openRecordModal={setRecordModal}
        startReview={startReview}
      />
    );
  } else if (page === "materials") {
    content = (
      <MaterialsPage
        data={data}
        selectedMaterialId={segments[1]}
        contextSubjectId={segments[2]}
        updateData={updateData}
        openRecordModal={setRecordModal}
        openMappingModal={setMappingTopic}
        startReview={startReview}
      />
    );
  } else if (page === "records") {
    content = (
      <RecordsPage
        data={data}
        openRecordModal={setRecordModal}
        startReview={startReview}
        updateData={updateData}
      />
    );
  } else if (page === "settings") {
    content = (
      <SettingsPage
        data={data}
        updateData={updateData}
        replaceData={replaceData}
        authSession={authSession}
        syncMessage={syncMessage}
        onOpenSync={() => setSyncOpen(true)}
      />
    );
  } else {
    content = <Dashboard data={data} startReview={startReview} />;
  }

  const handleNavClick = (targetPath: string) => {
    if (targetPath === "subjects" && page === "subjects") {
      if (segments.length > 1) {
        removeSessionValues([SESSION_KEYS.lastSubjectId, SESSION_KEYS.lastTopicId]);
        navigate("subjects");
        return;
      }
      scrollPageToTop();
      return;
    }
    if (targetPath === "materials" && page === "materials") {
      if (segments.length > 1) {
        removeSessionValues([
          SESSION_KEYS.lastMaterialId,
          SESSION_KEYS.lastMaterialContextSubjectId,
          SESSION_KEYS.lastMaterialTopicId,
        ]);
        navigate("materials");
        return;
      }
      scrollPageToTop();
      return;
    }
    if (targetPath === page) {
      scrollPageToTop();
      return;
    }
    navigate(getNavPath(targetPath, data));
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("dashboard")}>
          <CoralCrowLogo className="brand-logo" />
          <strong>금공러</strong>
        </button>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={page === item.path ? "nav-link active" : "nav-link"}
              onClick={() => handleNavClick(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="secondary-button wide" onClick={() => setSearchOpen(true)}>
          검색
        </button>
      </aside>

      <header className="mobile-header">
        <button className="brand compact-brand" onClick={() => navigate("dashboard")}>
          <CoralCrowLogo className="brand-logo" />
          <strong>금공러</strong>
        </button>
        <div className="mobile-header-actions">
          <button className="mobile-search-button" onClick={() => setSearchOpen(true)} aria-label="검색">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
        </div>
      </header>

      <main className="main-content">{content}</main>

      <nav className="bottom-tabs">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={page === item.path ? "bottom-tab active" : "bottom-tab"}
            onClick={() => handleNavClick(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="quick-action-stack">
        <button className="today-complete-button" onClick={() => setTodayCompleteOpen(true)}>
          완료 {todayCompletionTotal}
        </button>
        <button className="quick-record-button" onClick={openQuickRecord}>
          + 기록
        </button>
      </div>

      {recordModal && (
        <RecordModal
          data={data}
          context={recordModal}
          onClose={() => setRecordModal(null)}
          updateData={updateData}
        />
      )}
      {mappingTopic && (
        <MappingModal
          data={data}
          materialTopic={mappingTopic}
          onClose={() => setMappingTopic(null)}
          updateData={updateData}
        />
      )}
      {todayCompleteOpen && <TodayCompletionModal data={data} onClose={() => setTodayCompleteOpen(false)} />}
      {searchOpen && <SearchModal data={data} onClose={() => setSearchOpen(false)} />}
      {syncOpen && (
        <SyncModal
          authSession={authSession}
          syncMessage={syncMessage}
          onClose={() => setSyncOpen(false)}
          onSignIn={onSignIn}
          onSignUp={onSignUp}
          onSignOut={onSignOut}
          onReloadCloud={onReloadCloud}
          onSaveCloud={onSaveCloud}
        />
      )}
    </div>
  );
}

function Dashboard({
  data,
  startReview,
}: {
  data: StudyData;
  startReview: (title: string, records: StudyRecord[]) => void;
}) {
  const unknownRecords = getUnknownReviewRecords(data);
  const staleRecords = getStaleReviewRecords(data);
  const visibleUnknownRecords = unknownRecords.slice(0, 3);
  const visibleStaleRecords = staleRecords.slice(0, 3);
  const dashboardSubjects = useMemo(() => data.subjects.filter(isSubjectVisibleOnDashboard), [data]);
  const [todoShuffleKey, setTodoShuffleKey] = useState(0);
  const todoItems = useMemo(() => getDashboardTodoItems(data, dashboardSubjects), [data, dashboardSubjects, todoShuffleKey]);
  const isMobileDashboard = useMediaQuery(RECORD_FILTER_MOBILE_QUERY);
  const primaryDDay = isMobileDashboard || dashboardSubjects.length % 2 === 1 ? getPrimaryDDay(data) : undefined;

  return (
    <section className="page-stack">
      <section className="section-block">
        <div className="section-heading">
          <h2>과목</h2>
          <button className="text-button" onClick={() => navigate("subjects")}>
            전체 보기
          </button>
        </div>
        <div className="card-grid dashboard-subject-grid">
          {dashboardSubjects.length === 0 ? (
            <EmptyPanel title="표시할 과목 없음" text="과목 전체 보기에서 대시보드에 표시할 과목을 선택하세요." />
          ) : (
            dashboardSubjects.map((subject) => (
              <SubjectCard key={subject.id} data={data} subject={subject} clickableBackground />
            ))
          )}
          {primaryDDay && <DDayDashboardCard dDay={primaryDDay} />}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="widget dashboard-review-widget">
          <h2>복습</h2>
          <div className="dashboard-review-stack">
            <DashboardReviewBlock
              emptyText="카드 복습에서 모름 처리한 기록이 여기에 표시됩니다."
              records={visibleUnknownRecords}
              getMeta={(record) => getRecordPath(data, record)}
              actionLabel="모르는 기록 복습"
              actionDisabled={unknownRecords.length === 0}
              onAction={() => startReview("모르는 기록", unknownRecords)}
            />
            <DashboardReviewBlock
              emptyText="오래 안 본 복습 카드가 없습니다."
              records={visibleStaleRecords}
              getMeta={(record) => `${formatReviewPause(record)} · ${getRecordPath(data, record)}`}
              actionLabel="오래 안 본 기록 복습"
              actionDisabled={staleRecords.length === 0}
              onAction={() => startReview("오래 안 본 기록", staleRecords)}
            />
          </div>
        </section>

        <Widget title="할 일" onTitleClick={() => setTodoShuffleKey((key) => key + 1)} titleActionLabel="할 일 다시 추천">
          {todoItems.length === 0 ? (
            <EmptyText>완료한 자료목차 다음 항목이 여기에 표시됩니다.</EmptyText>
          ) : (
            <div className="simple-list">
              {todoItems.map((item) => (
                <button
                  key={item.id}
                  className="list-button dashboard-todo-row"
                  onClick={() => {
                    writeSessionValue(SESSION_KEYS.lastMaterialTopicId, item.nextTopic.id);
                    writeSessionValue(SESSION_KEYS.focusMaterialTopicId, item.nextTopic.id);
                    navigate(`materials/${item.material.id}/${item.subject.id}`);
                  }}
                >
                  <strong>{formatOrder(item.nextTopic.order, item.nextTopic.title)}</strong>
                  <span>
                    {item.subject.name} · {item.material.statusLabel || item.material.title} · {formatOrder(item.completedTopic.order, item.completedTopic.title)} 다음
                  </span>
                </button>
              ))}
            </div>
          )}
        </Widget>
      </div>
    </section>
  );
}

function DashboardReviewBlock({
  emptyText,
  records,
  getMeta,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  emptyText: string;
  records: StudyRecord[];
  getMeta: (record: StudyRecord) => string;
  actionLabel: string;
  actionDisabled: boolean;
  onAction: () => void;
}) {
  return (
    <section className="dashboard-review-block">
      {records.length === 0 ? (
        <EmptyText>{emptyText}</EmptyText>
      ) : (
        <div className="simple-list">
          {records.map((record) => (
            <button key={record.id} className="list-button dashboard-review-record" onClick={() => navigateToRecord(record)}>
              <strong>{record.title}</strong>
              <span>{getMeta(record)}</span>
            </button>
          ))}
        </div>
      )}
      <button className="primary-button wide" disabled={actionDisabled} onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  );
}

function DDayDashboardCard({ dDay }: { dDay: DDayEvent }) {
  const status = formatDDayStatus(dDay.date);
  return (
    <article className="entity-card subject-list-card dday-dashboard-card" onClick={() => navigate("settings")}>
      <div className="dday-card-top">
        <span className="dday-chip">대표 디데이</span>
        <strong className="dday-status">{status}</strong>
      </div>
      <div className="dday-card-main">
        <strong>{dDay.title}</strong>
        <span>{formatDateLabel(dDay.date)}</span>
      </div>
      {dDay.description && <p>{dDay.description}</p>}
    </article>
  );
}

function TodayCompletionModal({ data, onClose }: { data: StudyData; onClose: () => void }) {
  const summary = getTodayCompletionSummary(data);
  const visibleRows = summary.rows.filter((row) => row.total > 0);
  const confettiPieces = summary.total > 0 ? Array.from({ length: 34 }, (_, index) => index) : [];
  const timeRange = getTodayCompletionTimeRange(summary.items);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-panel today-completion-modal" onClick={(event) => event.stopPropagation()}>
        {confettiPieces.length > 0 && (
          <div className="completion-confetti" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span key={piece} style={getConfettiStyle(piece)} />
            ))}
          </div>
        )}
        <div className="today-completion-header">
          <div className="today-completion-title-row">
            <CoralCrowLogo
              className="today-completion-title-bird today-completion-title-bird-left"
              title=""
              showBackground={false}
              showNotebook={false}
            />
            <div className="today-completion-title-copy">
              <h2>{formatKoreanMonthDay(getLocalDateKey())}</h2>
              <p>총 {summary.total}개 완료</p>
            </div>
            <CoralCrowLogo
              className="today-completion-title-bird today-completion-title-bird-right"
              title=""
              showBackground={false}
              showNotebook={false}
            />
          </div>
        </div>

        <div className="today-completion-table-wrap">
          <table className={summary.total === 0 ? "today-completion-table empty-completion-table" : "today-completion-table"}>
            <thead>
              <tr>
                <th>
                  <span className="completion-corner-label">자료/과목</span>
                </th>
                {summary.subjects.map((subject) => (
                  <th key={subject.id}>{subject.name}</th>
                ))}
                <th>계</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.category}>
                  <th>{row.category}</th>
                  {summary.subjects.map((subject) => (
                    <td key={subject.id}>{renderCompletionValue(row.bySubject[subject.id] || 0)}</td>
                  ))}
                  <td>{renderCompletionValue(row.total, true)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <th>계</th>
                {summary.subjects.map((subject) => (
                  <td key={subject.id}>{renderCompletionValue(summary.subjectTotals[subject.id] || 0, true)}</td>
                ))}
                <td>{renderCompletionValue(summary.total, true, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {timeRange && <div className="today-completion-time-range">시작 {timeRange.start} · 마무리 {timeRange.end}</div>}

        <details className="today-completion-details">
          <summary className="today-completion-details-toggle" aria-label="완료한 항목 보기">
            <span className="visually-hidden">완료한 항목 보기</span>
          </summary>
          {summary.items.length === 0 ? (
            <EmptyText>오늘 완료한 자료목차가 없습니다.</EmptyText>
          ) : (
            <div className="simple-list">
              {summary.items.map((item) => (
                <button
                  key={item.id}
                  className="list-button"
                  onClick={() => {
                    writeSessionValue(SESSION_KEYS.lastMaterialTopicId, item.topic.id);
                    writeSessionValue(SESSION_KEYS.focusMaterialTopicId, item.topic.id);
                    navigate(`materials/${item.material.id}/${item.subjectId}`);
                    onClose();
                  }}
                >
                  <strong>[{item.subjectName}] {item.material.title}</strong>
                  <span>{formatOrder(item.topic.order, item.topic.title)}</span>
                </button>
              ))}
            </div>
          )}
        </details>
      </div>
    </div>
  );
}

function getConfettiStyle(index: number) {
  const colors = ["#ff746f", "#ffc4bf", "#6f8796", "#a5bdcc", "#f2c14e", "#ffe3e0"];
  const side = index % 2 === 0 ? -1 : 1;
  const spread = 54 + (index % 7) * 18;
  const lift = 260 + (index % 6) * 30;
  const delay = (index % 9) * 0.035;
  const rotation = ((index * 37) % 180) - 90;
  return {
    background: colors[index % colors.length],
    animationDelay: `${delay}s`,
    ["--confetti-x" as string]: `${side * spread}px`,
    ["--confetti-y" as string]: `-${lift}px`,
    ["--confetti-rotate" as string]: `${rotation}deg`,
  };
}

function renderCompletionValue(value: number, emphasized = false, grandTotal = false) {
  if (value === 0) return <span className="completion-zero-mark" aria-label="0" title="0">🐦</span>;
  return <span className={grandTotal ? "completion-value grand-total-value" : emphasized ? "completion-value emphasized-value" : "completion-value"}>{value}</span>;
}

function SubjectCard({
  data,
  subject,
  footer,
  clickableBackground = false,
}: {
  data: StudyData;
  subject: Subject;
  footer?: ReactNode;
  clickableBackground?: boolean;
}) {
  return (
    <article
      className={clickableBackground ? "entity-card subject-list-card clickable-subject-card" : "entity-card subject-list-card"}
      onClick={(event) => {
        if (!clickableBackground || isInteractiveClickTarget(event.target)) return;
        navigate(`subjects/${subject.id}`);
      }}
    >
      <button className="card-link-button subject-card-main" onClick={() => navigate(`subjects/${subject.id}`)}>
        <strong>{subject.name}</strong>
      </button>
      <SubjectMaterialProgressLinks data={data} subjectId={subject.id} />
      {footer}
    </article>
  );
}

function isInteractiveClickTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a, input, select, textarea, label, summary, [role='button']"));
}

function SubjectMaterialProgressLinks({ data, subjectId }: { data: StudyData; subjectId: string }) {
  const items = getSubjectMaterialProgressItems(data, subjectId);
  if (items.length === 0) return <span className="material-progress-empty">표시 자료 없음</span>;

  return (
    <div className="material-progress-list" aria-label="자료 바로가기">
      {items.map((item) => (
        <button
          key={item.material.id}
          className="material-progress-link"
          onClick={() => navigate(`materials/${item.material.id}/${subjectId}`)}
          title={item.material.title}
        >
          <span className="material-progress-label">{item.material.statusLabel || "자료"}</span>
          <span className="material-progress-count">{item.done}/{item.total}</span>
          <span className="material-progress-arrow" aria-hidden="true">›</span>
        </button>
      ))}
    </div>
  );
}

function SubjectMaterialDisplaySettings({
  data,
  subjectId,
  updateData,
}: {
  data: StudyData;
  subjectId: string;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const rows = getSubjectMaterialDisplayRows(data, subjectId);
  const [draggingId, setDraggingId] = useState("");
  const [targetId, setTargetId] = useState("");

  const reorder = (sourceId: string, nextTargetId: string) => {
    if (!sourceId || !nextTargetId || sourceId === nextTargetId) return;
    updateData((current) => reorderSubjectMaterialSettings(current, subjectId, sourceId, nextTargetId));
  };

  if (rows.length === 0) return <EmptyText>이 과목에 연결된 자료가 없습니다.</EmptyText>;

  return (
    <div className="subject-material-settings">
      <p className="muted">표시할 자료를 고르고, 왼쪽 핸들을 드래그해서 이 과목 안에서의 표시 순서를 바꿉니다.</p>
      <div className="material-display-list">
        {rows.map(({ material, visible }) => (
          <div
            key={material.id}
            className={[
              "material-display-row",
              draggingId === material.id ? "drag-source-row" : "",
              targetId === material.id ? "drag-target-row" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onDragOver={(event) => {
              event.preventDefault();
              setTargetId(material.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              reorder(draggingId, material.id);
              setDraggingId("");
              setTargetId("");
            }}
          >
            <span
              className="drag-handle material-display-handle"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", material.id);
                setDraggingId(material.id);
              }}
              onDragEnd={() => {
                setDraggingId("");
                setTargetId("");
              }}
              aria-label="자료 표시 순서 이동"
              title="드래그해서 순서 변경"
            >
              ☰
            </span>
            <label className="material-display-check">
              <input
                type="checkbox"
                checked={visible}
                onChange={(event) =>
                  updateData((current) =>
                    setSubjectMaterialVisibility(current, subjectId, material.id, event.target.checked),
                  )
                }
              />
              <span>
                <strong>{material.title}</strong>
                <small>{material.statusLabel}</small>
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectsPage({
  data,
  selectedSubjectId,
  selectedTopicId,
  updateData,
  openRecordModal,
  startReview,
}: {
  data: StudyData;
  selectedSubjectId?: string;
  selectedTopicId?: string;
  updateData: (updater: (current: StudyData) => StudyData) => void;
  openRecordModal: (context: RecordModalContext) => void;
  startReview: (title: string, records: StudyRecord[]) => void;
}) {
  const subject = data.subjects.find((item) => item.id === selectedSubjectId);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"chips" | "outline" | "manage">("chips");
  const [subjectDetailTab, setSubjectDetailTab] = useState<"topics" | "records">("topics");
  const [draggingSubjectId, setDraggingSubjectId] = useState("");
  const [targetSubjectId, setTargetSubjectId] = useState("");

  useEffect(() => {
    if (!subject) return;
    writeSessionValue(SESSION_KEYS.lastSubjectId, subject.id);
    if (selectedTopicId && data.standardTopics.some((topic) => topic.id === selectedTopicId && topic.subjectId === subject.id)) {
      writeSessionValue(SESSION_KEYS.lastTopicId, selectedTopicId);
    }
  }, [data.standardTopics, selectedTopicId, subject?.id]);

  if (!subject) {
    const addSubject = (event: FormEvent) => {
      event.preventDefault();
      const name = newSubjectName.trim();
      if (!name) return;
      updateData((current) => ({
        ...current,
        subjects: [...current.subjects, { id: createId("subject"), name, showOnDashboard: true }],
      }));
      setNewSubjectName("");
    };

    return (
      <section className="page-stack">
        <form className="inline-form" onSubmit={addSubject}>
          <input value={newSubjectName} onChange={(event) => setNewSubjectName(event.target.value)} placeholder="새 과목명" />
          <button className="primary-button">과목 추가</button>
        </form>
        <p className="muted">왼쪽 핸들을 드래그해서 대시보드에 표시되는 과목 순서를 바꿉니다.</p>
        <div className="card-grid subject-card-grid">
          {data.subjects.map((item) => (
            <div
              key={item.id}
              className={[
                "subject-order-card",
                draggingSubjectId === item.id ? "drag-source-card" : "",
                targetSubjectId === item.id ? "drag-target-card" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDragOver={(event) => {
                event.preventDefault();
                setTargetSubjectId(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                updateData((current) => reorderSubjects(current, draggingSubjectId, item.id));
                setDraggingSubjectId("");
                setTargetSubjectId("");
              }}
            >
              <SubjectCard
                data={data}
                subject={item}
                footer={
                  <div className="subject-card-controls">
                    <span
                      className="drag-handle"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", item.id);
                        setDraggingSubjectId(item.id);
                      }}
                      onDragEnd={() => {
                        setDraggingSubjectId("");
                        setTargetSubjectId("");
                      }}
                      aria-label="과목 표시 순서 이동"
                      title="드래그해서 순서 변경"
                    >
                      ☰
                    </span>
                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        checked={isSubjectVisibleOnDashboard(item)}
                        onChange={(event) =>
                          updateData((current) => ({
                            ...current,
                            subjects: current.subjects.map((subject) =>
                              subject.id === item.id ? { ...subject, showOnDashboard: event.target.checked } : subject,
                            ),
                          }))
                        }
                      />
                      <span>대시보드 표시</span>
                    </label>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const topics = data.standardTopics
    .filter((topic) => topic.subjectId === subject.id)
    .sort((a, b) => a.order - b.order);
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
  const groupedTopics = groupBy(topics, (topic) => topic.group);
  const subjectMaterialCount = data.materials.filter((material) => materialHasSubject(material, subject.id)).length;
  const goToSubjectList = () => {
    removeSessionValues([SESSION_KEYS.lastSubjectId, SESSION_KEYS.lastTopicId]);
    navigate("subjects");
  };

  const deleteSubject = () => {
    if (!window.confirm(`${subject.name} 과목과 연결된 자료, 목차, 기록을 삭제할까요?`)) return;
    updateData((current) => {
      const materialIds = current.materials
        .filter((material) => {
          const subjectIds = getMaterialSubjectIds(material);
          return subjectIds.length === 0 || subjectIds.every((subjectId) => subjectId === subject.id);
        })
        .map((material) => material.id);
      const materialTopicIds = current.materialTopics
        .filter((topic) => materialIds.includes(topic.materialId))
        .map((topic) => topic.id);
      const standardTopicIds = current.standardTopics
        .filter((topic) => topic.subjectId === subject.id)
        .map((topic) => topic.id);

      return {
        ...current,
        subjects: current.subjects.filter((item) => item.id !== subject.id),
        materials: current.materials
          .filter((material) => !materialIds.includes(material.id))
          .map((material) => ({ ...material, subjectIds: getMaterialSubjectIds(material).filter((subjectId) => subjectId !== subject.id) })),
        materialTopics: current.materialTopics.filter((topic) => !materialIds.includes(topic.materialId)),
        standardTopics: current.standardTopics.filter((topic) => topic.subjectId !== subject.id),
        subtopics: current.subtopics.filter((subtopic) => !standardTopicIds.includes(subtopic.standardTopicId)),
        mappings: current.mappings.filter(
          (mapping) =>
            !materialTopicIds.includes(mapping.materialTopicId) && !standardTopicIds.includes(mapping.standardTopicId),
        ),
        records: current.records.map((record) =>
          record.subjectId === subject.id || standardTopicIds.includes(record.standardTopicId || "")
            ? {
                ...record,
                subjectId: undefined,
                standardTopicId: undefined,
                subtopicId: undefined,
                materialId: materialIds.includes(record.materialId || "") ? undefined : record.materialId,
                materialTopicId: materialTopicIds.includes(record.materialTopicId || "") ? undefined : record.materialTopicId,
                updatedAt: new Date().toISOString(),
              }
            : record,
        ),
      };
    });
    navigate("subjects");
  };

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="과목"
        onBreadcrumbClick={goToSubjectList}
        title={subject.name}
        meta={`${topics.length}개 표준목차 · ${subjectMaterialCount}개 연결 자료`}
        action={
          <div className="subject-action-stack">
            <button
              className={settingsOpen ? "secondary-button active-action" : "secondary-button"}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              과목 설정
            </button>
            <button className="danger-button" onClick={deleteSubject}>
              과목 삭제
            </button>
          </div>
        }
      />

      {settingsOpen && (
        <section className="panel subject-settings-panel">
          <div className="section-heading">
            <div>
              <h2>과목 설정</h2>
              <p className="muted">자료 표시, 목차 붙여넣기, 목차 정리를 이 과목 안에서 바로 관리합니다.</p>
            </div>
          </div>

          <div className="tab-row" role="tablist" aria-label="과목 설정">
            <button
              className={settingsTab === "chips" ? "tab-button active" : "tab-button"}
              role="tab"
              aria-selected={settingsTab === "chips"}
              onClick={() => setSettingsTab("chips")}
            >
              자료 표시
            </button>
            <button
              className={settingsTab === "outline" ? "tab-button active" : "tab-button"}
              role="tab"
              aria-selected={settingsTab === "outline"}
              onClick={() => setSettingsTab("outline")}
            >
              목차 붙여넣기
            </button>
            <button
              className={settingsTab === "manage" ? "tab-button active" : "tab-button"}
              role="tab"
              aria-selected={settingsTab === "manage"}
              onClick={() => setSettingsTab("manage")}
            >
              목차 관리
            </button>
          </div>

          {settingsTab === "chips" && (
            <SubjectMaterialDisplaySettings data={data} subjectId={subject.id} updateData={updateData} />
          )}

          {settingsTab === "outline" && (
            <BulkTopicAdder
              title="목차 붙여넣기"
              help="[그룹명] 줄은 그룹으로 인식하고, 제1장·Chapter 01·01. 형태는 자동 정리합니다."
              variant="plain"
              onAdd={(rows) =>
                updateData((current) => {
                  const existing = current.standardTopics.filter((topic) => topic.subjectId === subject.id);
                  let order = existing.reduce((max, topic) => Math.max(max, topic.order), 0);
                  const created = rows.map((row) => ({
                    id: createId("std"),
                    subjectId: subject.id,
                    group: row.group || "사용자 추가",
                    title: row.title,
                    order: (order += 1),
                  }));
                  return { ...current, standardTopics: [...current.standardTopics, ...created] };
                })
              }
            />
          )}

          {settingsTab === "manage" && (
            <OutlineManager data={data} updateData={updateData} fixedSubjectId={subject.id} embedded />
          )}

        </section>
      )}

      <div className="subject-view-tabs" role="tablist" aria-label="과목 목차와 기록">
        <button
          className={subjectDetailTab === "topics" ? "tab-button active" : "tab-button"}
          role="tab"
          aria-selected={subjectDetailTab === "topics"}
          onClick={() => setSubjectDetailTab("topics")}
        >
          목차
        </button>
        <button
          className={subjectDetailTab === "records" ? "tab-button active" : "tab-button"}
          role="tab"
          aria-selected={subjectDetailTab === "records"}
          onClick={() => setSubjectDetailTab("records")}
        >
          기록
        </button>
      </div>

      <div className={`topic-layout subject-topic-layout ${subjectDetailTab === "records" ? "show-records" : "show-topics"}`}>
        <div className="topic-list">
          {Array.from(groupedTopics.entries()).map(([group, groupTopics]) => (
            <section key={group} className="topic-group">
              <h2>{group}</h2>
              {groupTopics.map((topic) => (
                <button
                  key={topic.id}
                  className={selectedTopicId === topic.id ? "topic-row active" : "topic-row"}
                  onClick={() => {
                    navigate(`subjects/${subject.id}/topics/${topic.id}`);
                    if (window.matchMedia("(max-width: 980px), (orientation: portrait)").matches) {
                      setSubjectDetailTab("records");
                    }
                  }}
                >
                  <span className="topic-title">{formatOrder(topic.order, topic.title)}</span>
                  <span className="chip-row">{getStatusChips(data, topic.id).map((chip) => chip)}</span>
                </button>
              ))}
            </section>
          ))}
        </div>

        <aside className="detail-panel">
          {selectedTopic ? (
            <StandardTopicPanel
              data={data}
              topic={selectedTopic}
              updateData={updateData}
              openRecordModal={openRecordModal}
              startReview={startReview}
            />
          ) : (
            <EmptyPanel title="표준목차 선택" text="목차를 선택하면 연결된 자료 기록을 통합 조회합니다." />
          )}
        </aside>
      </div>
    </section>
  );
}

function StandardTopicPanel({
  data,
  topic,
  updateData,
  openRecordModal,
  startReview,
}: {
  data: StudyData;
  topic: StandardTopic;
  updateData: (updater: (current: StudyData) => StudyData) => void;
  openRecordModal: (context: RecordModalContext) => void;
  startReview: (title: string, records: StudyRecord[]) => void;
}) {
  const [materialFilter, setMaterialFilter] = useState("");
  const [subtopicFilter, setSubtopicFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const records = getActiveRecords(data).filter((record) => record.standardTopicId === topic.id);
  const subtopics = data.subtopics.filter((subtopic) => subtopic.standardTopicId === topic.id).sort((a, b) => a.order - b.order);
  const filteredRecords = records.filter((record) => {
    if (materialFilter && record.materialId !== materialFilter) return false;
    if (subtopicFilter && record.subtopicId !== subtopicFilter) return false;
    if (typeFilter && record.type !== typeFilter) return false;
    return true;
  });
  const sortedRecords = sortRecordsBySubtopicOrder(filteredRecords, subtopics);

  return (
    <div className="panel-stack">
      <div>
        <p className="eyebrow">{topic.group}</p>
        <h2>{formatOrder(topic.order, topic.title)}</h2>
      </div>

      <SubtopicAdder data={data} topic={topic} updateData={updateData} />

      <div className="filter-grid compact-filters">
        <Select label="자료" value={materialFilter} onChange={setMaterialFilter}>
          <option value="">전체</option>
          {data.materials
            .filter((material) => materialHasSubject(material, topic.subjectId))
            .map((material) => (
              <option key={material.id} value={material.id}>
                {material.title}
              </option>
            ))}
        </Select>
        <Select label="세부목차" value={subtopicFilter} onChange={setSubtopicFilter}>
          <option value="">전체</option>
          {subtopics.map((subtopic) => (
            <option key={subtopic.id} value={subtopic.id}>
              {subtopic.title}
            </option>
          ))}
        </Select>
        <Select label="기록유형" value={typeFilter} onChange={setTypeFilter}>
          <option value="">전체</option>
          {RECORD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>

      <div className="action-row">
        <button
          className="primary-button"
          onClick={() => openRecordModal({ mode: "create", subjectId: topic.subjectId, standardTopicId: topic.id })}
        >
          기록 추가
        </button>
        <button
          className="secondary-button"
          disabled={sortedRecords.filter((record) => record.useReviewCard).length === 0}
          onClick={() => startReview(topic.title, sortedRecords)}
        >
          카드 복습
        </button>
      </div>

      <RecordList
        data={data}
        records={sortedRecords}
        onEdit={(recordId) => openRecordModal({ mode: "edit", recordId })}
        onDelete={(recordId) => confirmAndDeleteRecord(updateData, recordId)}
      />
    </div>
  );
}

function MaterialsPage({
  data,
  selectedMaterialId,
  contextSubjectId,
  updateData,
  openRecordModal,
  openMappingModal,
  startReview,
}: {
  data: StudyData;
  selectedMaterialId?: string;
  contextSubjectId?: string;
  updateData: (updater: (current: StudyData) => StudyData) => void;
  openRecordModal: (context: RecordModalContext) => void;
  openMappingModal: (topic: MaterialTopic) => void;
  startReview: (title: string, records: StudyRecord[]) => void;
}) {
  const material = data.materials.find((item) => item.id === selectedMaterialId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"subjects" | "outline" | "manage">("subjects");
  const [focusedTopicId, setFocusedTopicId] = useState("");
  const [pendingFocusTopicId, setPendingFocusTopicId] = useState(() => readSessionValue(SESSION_KEYS.focusMaterialTopicId));
  const restoredMaterialTopicRef = useRef("");
  const activeSubjectId = material && contextSubjectId && materialHasSubject(material, contextSubjectId) ? contextSubjectId : "";

  useEffect(() => {
    if (!material) {
      setFocusedTopicId("");
      return;
    }
    writeSessionValue(SESSION_KEYS.lastMaterialId, material.id);
    if (activeSubjectId) writeSessionValue(SESSION_KEYS.lastMaterialContextSubjectId, activeSubjectId);
    const lastTopicId = readSessionValue(SESSION_KEYS.lastMaterialTopicId);
    const storedFocusTopicId = readSessionValue(SESSION_KEYS.focusMaterialTopicId);
    const focusTopicId = pendingFocusTopicId || storedFocusTopicId;
    const hasLastTopic = Boolean(lastTopicId && data.materialTopics.some((topic) => topic.id === lastTopicId && topic.materialId === material.id));
    const hasFocusTopic = Boolean(focusTopicId && data.materialTopics.some((topic) => topic.id === focusTopicId && topic.materialId === material.id));
    const scrollTopicId = hasFocusTopic ? focusTopicId : hasLastTopic ? lastTopicId : "";
    if (storedFocusTopicId || pendingFocusTopicId) {
      removeSessionValues([SESSION_KEYS.focusMaterialTopicId]);
      setPendingFocusTopicId("");
    }
    if (hasFocusTopic) setFocusedTopicId(focusTopicId);
    if (!scrollTopicId) return;
    if (restoredMaterialTopicRef.current === material.id) return;
    restoredMaterialTopicRef.current = material.id;
    window.requestAnimationFrame(() => {
      document.getElementById(`material-topic-${scrollTopicId}`)?.scrollIntoView({ block: "center" });
    });
  }, [activeSubjectId, data.materialTopics, material?.id, pendingFocusTopicId]);

  useEffect(() => {
    if (!material || !focusedTopicId) return undefined;
    const clearOnBackgroundClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const isClearSurface =
        target === document.body ||
        target === document.documentElement ||
        target.classList.contains("app-layout") ||
        target.classList.contains("main-content") ||
        target.classList.contains("page-stack") ||
        target.classList.contains("material-topic-list");
      if (isClearSurface) setFocusedTopicId("");
    };
    document.addEventListener("pointerdown", clearOnBackgroundClick);
    return () => document.removeEventListener("pointerdown", clearOnBackgroundClick);
  }, [focusedTopicId, material]);

  if (!material) {
    return (
      <section className="page-stack">
        <AddMaterialForm data={data} updateData={updateData} />
        <div className="card-grid material-card-grid">
          {data.materials.map((item) => (
            <button key={item.id} className="entity-card material-card" onClick={() => navigate(`materials/${item.id}`)}>
              <strong className="material-card-title">{item.title}</strong>
              <span className="material-card-status">{getMaterialCardMeta(data, item)}</span>
              <ProgressBar topics={data.materialTopics.filter((topic) => topic.materialId === item.id)} />
            </button>
          ))}
        </div>
      </section>
    );
  }

  const topics = data.materialTopics
    .filter((topic) => topic.materialId === material.id)
    .sort((a, b) => a.order - b.order);
  const setMaterialSubjectIds = (subjectIds: string[]) => {
    if (subjectIds.length === 0) return;
    updateData((current) => {
      const materialTopicIds = current.materialTopics
        .filter((topic) => topic.materialId === material.id)
        .map((topic) => topic.id);
      const allowedStandardTopicIds = new Set(
        current.standardTopics.filter((topic) => subjectIds.includes(topic.subjectId)).map((topic) => topic.id),
      );
      return {
        ...current,
        materials: current.materials.map((item) => (item.id === material.id ? { ...item, subjectIds } : item)),
        mappings: current.mappings.filter(
          (mapping) => !materialTopicIds.includes(mapping.materialTopicId) || allowedStandardTopicIds.has(mapping.standardTopicId),
        ),
      };
    });
  };

  const deleteMaterial = () => {
    if (!window.confirm(`${material.title} 자료와 연결된 목차, 기록을 삭제할까요?`)) return;
    updateData((current) => {
      const materialTopicIds = current.materialTopics
        .filter((topic) => topic.materialId === material.id)
        .map((topic) => topic.id);
      return {
        ...current,
        materials: current.materials.filter((item) => item.id !== material.id),
        materialTopics: current.materialTopics.filter((topic) => topic.materialId !== material.id),
        mappings: current.mappings.filter((mapping) => !materialTopicIds.includes(mapping.materialTopicId)),
        records: current.records.map((record) =>
          record.materialId === material.id || materialTopicIds.includes(record.materialTopicId || "")
            ? {
                ...record,
                materialId: undefined,
                materialTopicId: undefined,
                updatedAt: new Date().toISOString(),
              }
            : record,
        ),
      };
    });
    navigate("materials");
  };
  const goToMaterialList = () => {
    removeSessionValues([
      SESSION_KEYS.lastMaterialId,
      SESSION_KEYS.lastMaterialContextSubjectId,
      SESSION_KEYS.lastMaterialTopicId,
      SESSION_KEYS.focusMaterialTopicId,
    ]);
    navigate("materials");
  };

  return (
    <section
      className="page-stack"
      onClick={(event) => {
        if (event.target === event.currentTarget) setFocusedTopicId("");
      }}
    >
      <PageHeader
        eyebrow="자료"
        onBreadcrumbClick={goToMaterialList}
        title={material.title}
        meta={getMaterialDetailMeta(data, material)}
        action={
          <div className="subject-action-stack">
            <button
              className={settingsOpen ? "secondary-button active-action" : "secondary-button"}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              자료 설정
            </button>
            <button className="danger-button" onClick={deleteMaterial}>
              자료 삭제
            </button>
          </div>
        }
      />

      {settingsOpen && (
        <section className="panel subject-settings-panel">
          <div className="section-heading">
            <div>
              <h2>자료 설정</h2>
              <p className="muted">연결 과목, 자료 목차 붙여넣기, 자료 목차 정리를 관리합니다.</p>
            </div>
          </div>

          <label className="field-label compact-select">
            자료유형
            <select
              value={getMaterialCategory(material)}
              onChange={(event) =>
                updateData((current) => ({
                  ...current,
                  materials: current.materials.map((item) =>
                    item.id === material.id ? { ...item, category: event.target.value as MaterialCategory } : item,
                  ),
                }))
              }
            >
              {MATERIAL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <div className="tab-row" role="tablist" aria-label="자료 설정">
            <button
              className={settingsTab === "subjects" ? "tab-button active" : "tab-button"}
              role="tab"
              aria-selected={settingsTab === "subjects"}
              onClick={() => setSettingsTab("subjects")}
            >
              과목 설정
            </button>
            <button
              className={settingsTab === "outline" ? "tab-button active" : "tab-button"}
              role="tab"
              aria-selected={settingsTab === "outline"}
              onClick={() => setSettingsTab("outline")}
            >
              목차 붙여넣기
            </button>
            <button
              className={settingsTab === "manage" ? "tab-button active" : "tab-button"}
              role="tab"
              aria-selected={settingsTab === "manage"}
              onClick={() => setSettingsTab("manage")}
            >
              목차 관리
            </button>
          </div>

          {settingsTab === "subjects" && (
            <div className="checkbox-grid">
              {data.subjects.map((subject) => {
                const subjectIds = getMaterialSubjectIds(material);
                const checked = subjectIds.includes(subject.id);
                return (
                  <label key={subject.id} className="check-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const nextIds = event.target.checked
                          ? [...new Set([...subjectIds, subject.id])]
                          : subjectIds.filter((subjectId) => subjectId !== subject.id);
                        setMaterialSubjectIds(nextIds);
                      }}
                    />
                    <span>{subject.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          {settingsTab === "outline" && (
            <BulkTopicAdder
              title="목차 붙여넣기"
              help="인터넷에서 복사한 목차를 줄 단위로 붙여넣으면 자료 목차로 추가됩니다."
              variant="plain"
              placeholder="제1장 재무회계 일반\nChapter 01 경영 핵심기출\n01. 재고자산"
              example={"예시\n제1장 재무회계 일반\nChapter 01 경영 핵심기출\n01. 재고자산"}
              onAdd={(rows) =>
                updateData((current) => {
                  const existing = current.materialTopics.filter((topic) => topic.materialId === material.id);
                  let order = existing.reduce((max, topic) => Math.max(max, topic.order), 0);
                  const created = rows.map((row) => ({
                    id: createId("mt"),
                    materialId: material.id,
                    title: row.title,
                    order: (order += 1),
                    progress: "not-started" as ProgressStatus,
                    updatedAt: new Date().toISOString(),
                  }));
                  return { ...current, materialTopics: [...current.materialTopics, ...created] };
                })
              }
            />
          )}

          {settingsTab === "manage" && <MaterialTopicManager material={material} topics={topics} updateData={updateData} />}
        </section>
      )}

      <div
        className="material-topic-list"
        onClick={(event) => {
          if (event.target === event.currentTarget) setFocusedTopicId("");
        }}
      >
        {topics.map((topic) => {
          const allMappedTopics = getMappedStandardTopics(data, topic.id);
          const mappedTopics = activeSubjectId
            ? allMappedTopics.filter((mapped) => mapped.subjectId === activeSubjectId)
            : allMappedTopics;
          const topicRecords = getActiveRecords(data).filter(
            (record) => record.materialTopicId === topic.id && (!activeSubjectId || record.subjectId === activeSubjectId),
          );
          return (
            <article
              key={topic.id}
              id={`material-topic-${topic.id}`}
              className={focusedTopicId === topic.id ? "material-topic-row material-topic-row-focused" : "material-topic-row"}
              onClickCapture={() => {
                setFocusedTopicId(topic.id);
                writeSessionValue(SESSION_KEYS.lastMaterialTopicId, topic.id);
              }}
            >
              <div className="topic-main">
                <strong>{formatOrder(topic.order, topic.title)}</strong>
                <span className="mapped-line">
                  {mappedTopics.length === 0
                    ? "연결된 표준목차 없음"
                    : mappedTopics.map((mapped) => `${getSubjectName(data, mapped.subjectId)} > ${mapped.group} > ${mapped.title}`).join(" · ")}
                </span>
              </div>
              <ProgressSelector
                value={topic.progress}
                onChange={(progress) =>
                  updateData((current) => updateMaterialTopicProgress(current, material.id, topic.id, progress, activeSubjectId || undefined))
                }
              />
              <div className="row-actions">
                <button
                  className="secondary-button compact"
                  onClick={() =>
                    openRecordModal({
                      mode: "create",
                      subjectId: activeSubjectId || undefined,
                      materialId: material.id,
                      materialTopicId: topic.id,
                      candidateStandardTopicIds: mappedTopics.map((mapped) => mapped.id),
                    })
                  }
                >
                  기록
                </button>
                <button className="secondary-button compact" onClick={() => openMappingModal(topic)}>
                  연결
                </button>
                <button
                  className="secondary-button compact"
                  disabled={topicRecords.filter((record) => record.useReviewCard).length === 0}
                  onClick={() => startReview(topic.title, topicRecords)}
                >
                  복습
                </button>
              </div>
              {topicRecords.length > 0 && (
                <details className="material-topic-record-list">
                  <summary>기록 {topicRecords.length}개</summary>
                  <RecordList
                    data={data}
                    records={topicRecords}
                    onEdit={(recordId) => openRecordModal({ mode: "edit", recordId })}
                    onDelete={(recordId) => confirmAndDeleteRecord(updateData, recordId)}
                  />
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MaterialTopicManager({
  material,
  topics,
  updateData,
}: {
  material: Material;
  topics: MaterialTopic[];
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const [dragState, setDragState] = useState<{ sourceId: string; targetId?: string; position?: "before" | "after" | "end" } | null>(null);
  const dragTopicId = useRef<string | null>(null);

  const updateOrder = (orderedTopics: MaterialTopic[]) => {
    const updates = new Map(orderedTopics.map((topic, index) => [topic.id, index + 1]));
    updateData((current) => ({
      ...current,
      materialTopics: current.materialTopics.map((topic) => {
        const order = updates.get(topic.id);
        return order ? { ...topic, order } : topic;
      }),
    }));
  };

  const startDrag = (event: DragEvent<HTMLElement>, topic: MaterialTopic) => {
    dragTopicId.current = topic.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", topic.title);
    const ghost = document.createElement("canvas");
    ghost.width = 1;
    ghost.height = 1;
    event.dataTransfer.setDragImage(ghost, 0, 0);
    setDragState({ sourceId: topic.id });
  };

  const getRowDropPosition = (event: DragEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
  };

  const updateDrag = (event: DragEvent<HTMLElement>, targetId?: string) => {
    event.preventDefault();
    if (targetId) event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    const position = targetId ? getRowDropPosition(event) : "end";
    setDragState((current) => (current ? { ...current, targetId, position } : current));
  };

  const clearDrag = () => {
    dragTopicId.current = null;
    setDragState(null);
  };

  const dropTopic = (event: DragEvent<HTMLElement>, target: MaterialTopic) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = dragTopicId.current;
    const position = getRowDropPosition(event);
    clearDrag();
    if (!sourceId || sourceId === target.id) return;
    const source = topics.find((topic) => topic.id === sourceId);
    if (!source) return;
    const withoutSource = topics.filter((topic) => topic.id !== sourceId);
    const targetIndex = withoutSource.findIndex((topic) => topic.id === target.id);
    if (targetIndex < 0) return;
    withoutSource.splice(targetIndex + (position === "after" ? 1 : 0), 0, source);
    updateOrder(withoutSource);
  };

  const dropTopicToEnd = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = dragTopicId.current;
    clearDrag();
    if (!sourceId || topics[topics.length - 1]?.id === sourceId) return;
    const source = topics.find((topic) => topic.id === sourceId);
    if (!source) return;
    const withoutSource = topics.filter((topic) => topic.id !== sourceId);
    withoutSource.push(source);
    updateOrder(withoutSource);
  };

  const renameTopic = (topic: MaterialTopic, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === topic.title) return;
    updateData((current) => ({
      ...current,
      materialTopics: current.materialTopics.map((item) => (item.id === topic.id ? { ...item, title: nextTitle } : item)),
    }));
  };

  const deleteTopic = (topic: MaterialTopic) => {
    if (!window.confirm(`${formatOrder(topic.order, topic.title)} 자료 목차를 삭제할까요?\n연결 기록은 삭제하지 않고 자료 목차 연결만 해제됩니다.`)) return;
    updateData((current) => ({
      ...current,
      materialTopics: current.materialTopics
        .filter((item) => item.id !== topic.id)
        .map((item) => {
          if (item.materialId !== material.id) return item;
          const order =
            current.materialTopics
              .filter((candidate) => candidate.materialId === material.id && candidate.id !== topic.id)
              .sort((a, b) => a.order - b.order)
              .findIndex((candidate) => candidate.id === item.id) + 1;
          return order > 0 ? { ...item, order } : item;
        }),
      mappings: current.mappings.filter((mapping) => mapping.materialTopicId !== topic.id),
      records: current.records.map((record) =>
        record.materialTopicId === topic.id ? { ...record, materialTopicId: undefined, updatedAt: new Date().toISOString() } : record,
      ),
    }));
  };

  return (
    <div className="notion-table-wrap" onDragOver={(event) => updateDrag(event)}>
      <table className="notion-table">
        <thead>
          <tr>
            <th>이동</th>
            <th>목차명</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {topics.length === 0 ? (
            <tr>
              <td colSpan={3}>자료 목차가 없습니다.</td>
            </tr>
          ) : (
            topics.map((topic) => (
              <tr
                key={topic.id}
                className={[
                  dragState?.sourceId === topic.id ? "drag-source-row" : "",
                  dragState?.targetId === topic.id ? "drag-target-row" : "",
                  dragState?.targetId === topic.id && dragState.position === "after" ? "drag-after-row" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={(event) => updateDrag(event, topic.id)}
                onDrop={(event) => dropTopic(event, topic)}
              >
                <td className="handle-cell">
                  <span
                    className="drag-handle"
                    draggable
                    onDragStart={(event) => startDrag(event, topic)}
                    onDragEnd={clearDrag}
                    aria-label={`${topic.title} 순서 이동`}
                  >
                    ☰
                  </span>
                </td>
                <td>
                  <input
                    className="table-input"
                    defaultValue={topic.title}
                    onBlur={(event) => renameTopic(topic, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                  />
                </td>
                <td>
                  <button className="text-button danger-text" onClick={() => deleteTopic(topic)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
          {dragState && topics.length > 0 && (
            <tr
              className={dragState.position === "end" ? "drop-end-row drag-target-row" : "drop-end-row"}
              onDragOver={(event) => updateDrag(event)}
              onDrop={dropTopicToEnd}
            >
              <td colSpan={3}>맨 아래로 이동</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="muted">{material.title}의 원본 목차 순서를 관리합니다.</p>
    </div>
  );
}

function MultiSelectFilter({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: Array<{ value: string; label: string }>;
  onChange: (values: string[]) => void;
}) {
  const selectedOptions = options.filter((option) => values.includes(option.value));
  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return (
    <details className="multi-filter">
      <summary>
        <span>{label}</span>
        <strong>{selectedOptions.length === 0 ? "전체" : `${selectedOptions.length}개`}</strong>
      </summary>
      <div className="multi-filter-menu">
        <label className="check-row">
          <input type="checkbox" checked={selectedOptions.length === 0} onChange={() => onChange([])} />
          <span>전체</span>
        </label>
        {options.map((option) => (
          <label key={option.value} className="check-row">
            <input type="checkbox" checked={values.includes(option.value)} onChange={() => toggle(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {selectedOptions.length > 0 && (
        <div className="selected-filter-row">
          {selectedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="selected-filter-chip"
              onClick={() => toggle(option.value)}
              aria-label={`${option.label} 필터 해제`}
            >
              {option.label} ×
            </button>
          ))}
        </div>
      )}
    </details>
  );
}

function RecordsPage({
  data,
  openRecordModal,
  startReview,
  updateData,
}: {
  data: StudyData;
  openRecordModal: (context: RecordModalContext) => void;
  startReview: (title: string, records: StudyRecord[]) => void;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const [filters, setFilters] = useState<RecordFilters>(() =>
    normalizeRecordFilters(readSessionJson<Partial<RecordFilters>>(SESSION_KEYS.recordFilters, createEmptyRecordFilters())),
  );
  const [view, setView] = useState<"active" | "trash">("active");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(() => !isRecordFilterCompactViewport());
  const filtersPanelTouched = useRef(false);

  useEffect(() => {
    writeSessionJson(SESSION_KEYS.recordFilters, filters);
  }, [filters]);

  useEffect(() => {
    const media = window.matchMedia(RECORD_FILTER_MOBILE_QUERY);
    const syncFilterPanel = () => {
      if (!filtersPanelTouched.current || !media.matches) {
        setFiltersOpen(!media.matches);
      }
    };
    syncFilterPanel();
    media.addEventListener("change", syncFilterPanel);
    return () => media.removeEventListener("change", syncFilterPanel);
  }, []);

  useEffect(() => {
    const savedY = Number(readSessionValue(SESSION_KEYS.recordScrollY));
    if (Number.isFinite(savedY) && savedY > 0) {
      window.requestAnimationFrame(() => window.scrollTo(0, savedY));
    }
    const saveScroll = () => writeSessionValue(SESSION_KEYS.recordScrollY, String(window.scrollY));
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
    };
  }, []);

  useEffect(() => {
    setSelectedRecordIds((current) => current.filter((recordId) => data.records.some((record) => record.id === recordId)));
  }, [data.records]);

  const subjectOptionOrder = filters.subjectIds.length > 0 ? filters.subjectIds : data.subjects.map((subject) => subject.id);
  const standardOptions = data.standardTopics
    .filter((topic) => filters.subjectIds.length === 0 || filters.subjectIds.includes(topic.subjectId))
    .sort((a, b) => {
      const aSubjectIndex = subjectOptionOrder.indexOf(a.subjectId);
      const bSubjectIndex = subjectOptionOrder.indexOf(b.subjectId);
      if (aSubjectIndex !== bSubjectIndex) return aSubjectIndex - bSubjectIndex;
      return a.order - b.order;
    });
  const standardOptionIds = new Set(standardOptions.map((topic) => topic.id));
  const effectiveStandardTopicIds = filters.standardTopicIds.filter((id) => standardOptionIds.has(id));
  const subtopicOptions = data.subtopics.filter((subtopic) => {
    if (effectiveStandardTopicIds.length > 0) return effectiveStandardTopicIds.includes(subtopic.standardTopicId);
    if (filters.subjectIds.length === 0) return true;
    const parent = data.standardTopics.find((topic) => topic.id === subtopic.standardTopicId);
    return parent ? filters.subjectIds.includes(parent.subjectId) : false;
  });
  const subtopicOptionIds = new Set(subtopicOptions.map((subtopic) => subtopic.id));
  const effectiveSubtopicIds = filters.subtopicIds.filter((id) => subtopicOptionIds.has(id));
  const materialOptions = data.materials.filter(
    (material) => filters.subjectIds.length === 0 || filters.subjectIds.some((subjectId) => materialHasSubject(material, subjectId)),
  );
  const materialOptionIds = new Set(materialOptions.map((material) => material.id));
  const effectiveMaterialIds = filters.materialIds.filter((id) => materialOptionIds.has(id));
  const materialTopicOptions = data.materialTopics.filter((topic) => {
    if (effectiveMaterialIds.length > 0) return effectiveMaterialIds.includes(topic.materialId);
    return materialOptionIds.has(topic.materialId);
  });
  const materialTopicOptionIds = new Set(materialTopicOptions.map((topic) => topic.id));
  const effectiveMaterialTopicIds = filters.materialTopicIds.filter((id) => materialTopicOptionIds.has(id));
  const tagOptions = getAllRecordTags(data).map((tag) => ({ value: tag, label: tag }));

  useEffect(() => {
    setFilters((current) => {
      const next = {
        ...current,
        standardTopicIds: current.standardTopicIds.filter((id) => standardOptionIds.has(id)),
        subtopicIds: current.subtopicIds.filter((id) => subtopicOptionIds.has(id)),
        materialIds: current.materialIds.filter((id) => materialOptionIds.has(id)),
        materialTopicIds: current.materialTopicIds.filter((id) => materialTopicOptionIds.has(id)),
      };
      return arraysEqual(current.standardTopicIds, next.standardTopicIds) &&
        arraysEqual(current.subtopicIds, next.subtopicIds) &&
        arraysEqual(current.materialIds, next.materialIds) &&
        arraysEqual(current.materialTopicIds, next.materialTopicIds)
        ? current
        : next;
    });
  }, [
    Array.from(standardOptionIds).join("|"),
    Array.from(subtopicOptionIds).join("|"),
    Array.from(materialOptionIds).join("|"),
    Array.from(materialTopicOptionIds).join("|"),
  ]);

  const filteredRecords = getActiveRecords(data).filter((record) => {
    if (filters.subjectIds.length > 0 && (!record.subjectId || !filters.subjectIds.includes(record.subjectId))) return false;
    if (effectiveStandardTopicIds.length > 0 && (!record.standardTopicId || !effectiveStandardTopicIds.includes(record.standardTopicId))) return false;
    if (effectiveSubtopicIds.length > 0 && (!record.subtopicId || !effectiveSubtopicIds.includes(record.subtopicId))) return false;
    if (effectiveMaterialIds.length > 0 && (!record.materialId || !effectiveMaterialIds.includes(record.materialId))) return false;
    if (effectiveMaterialTopicIds.length > 0 && (!record.materialTopicId || !effectiveMaterialTopicIds.includes(record.materialTopicId))) return false;
    if (filters.types.length > 0 && !filters.types.includes(record.type)) return false;
    if (filters.studyStates.length > 0 && !filters.studyStates.includes(record.studyState)) return false;
    if (filters.tagNames.length > 0 && !filters.tagNames.some((tag) => record.tags?.includes(tag))) return false;
    if (filters.uncategorizedOnly && !isRecordUncategorized(data, record)) return false;
    return true;
  });
  const deletedRecords = data.records
    .filter(isRecordDeleted)
    .sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
  const selectedInView = selectedRecordIds.filter((recordId) => filteredRecords.some((record) => record.id === recordId));
  const selectedCount = selectedInView.length;
  const activeFilterCount =
    filters.subjectIds.length +
    effectiveStandardTopicIds.length +
    effectiveSubtopicIds.length +
    effectiveMaterialIds.length +
    effectiveMaterialTopicIds.length +
    filters.types.length +
    filters.studyStates.length +
    filters.tagNames.length +
    (filters.uncategorizedOnly ? 1 : 0);

  const clearFilters = () =>
    setFilters(createEmptyRecordFilters());

  const toggleFiltersOpen = () => {
    filtersPanelTouched.current = true;
    setFiltersOpen((open) => !open);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((current) => !current);
    setSelectedRecordIds([]);
  };

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecordIds((current) =>
      current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId],
    );
  };

  const applyBulkPatch = (patch: Partial<StudyRecord>) => {
    const selected = new Set(selectedInView);
    const now = new Date().toISOString();
    updateData((current) => ({
      ...current,
      records: current.records.map((record) =>
        selected.has(record.id)
          ? {
              ...record,
              ...patch,
              updatedAt: now,
            }
          : record,
      ),
    }));
  };

  const applyBulkTags = (mode: "add" | "remove", tag: string) => {
    const cleanTag = normalizeTag(tag);
    if (!cleanTag) return;
    const selected = new Set(selectedInView);
    const now = new Date().toISOString();
    updateData((current) => ({
      ...current,
      records: current.records.map((record) => {
        if (!selected.has(record.id)) return record;
        const currentTags = normalizeTags(record.tags);
        const nextTags =
          mode === "add" ? normalizeTags([...currentTags, cleanTag]) : currentTags.filter((item) => item !== cleanTag);
        return { ...record, tags: nextTags, updatedAt: now };
      }),
    }));
  };

  const moveSelectedToTrash = () => {
    if (selectedCount === 0) return;
    if (!window.confirm(`${selectedCount}개 기록을 휴지통으로 이동할까요?`)) return;
    const selected = new Set(selectedInView);
    updateData((current) => moveRecordsToTrash(current, selected));
    setSelectedRecordIds([]);
  };

  const restoreRecord = (recordId: string) => updateData((current) => restoreRecordFromTrash(current, recordId));
  const permanentlyDeleteRecord = (recordId: string) => {
    if (!window.confirm(PERMANENT_DELETE_CONFIRM)) return;
    updateData((current) => permanentlyDeleteRecordById(current, recordId));
  };
  const emptyTrash = () => {
    if (deletedRecords.length === 0) return;
    if (!window.confirm(EMPTY_TRASH_CONFIRM)) return;
    updateData((current) => ({ ...current, records: current.records.filter((record) => !isRecordDeleted(record)) }));
  };

  useEffect(() => {
    const focusId = readSessionValue(SESSION_KEYS.focusRecordId);
    if (!focusId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`record-${focusId}`)?.scrollIntoView({ block: "center" });
      removeSessionValues([SESSION_KEYS.focusRecordId]);
    });
  }, [filteredRecords.length, view]);

  return (
    <section className="page-stack">
      <div className="tab-row" role="tablist" aria-label="기록함 보기">
        <button className={view === "active" ? "tab-button active" : "tab-button"} onClick={() => setView("active")}>
          전체 기록
        </button>
        <button className={view === "trash" ? "tab-button active danger-tab" : "tab-button danger-tab"} onClick={() => setView("trash")}>
          휴지통 {deletedRecords.length > 0 ? deletedRecords.length : ""}
        </button>
      </div>

      {view === "trash" ? (
        <>
          <div className="section-heading">
            <h2>휴지통 {deletedRecords.length}개</h2>
            <button className="danger-button" disabled={deletedRecords.length === 0} onClick={emptyTrash}>
              휴지통 비우기
            </button>
          </div>
          <TrashRecordList
            data={data}
            records={deletedRecords}
            onRestore={restoreRecord}
            onPermanentDelete={permanentlyDeleteRecord}
          />
        </>
      ) : (
        <>
          <section className={filtersOpen ? "record-filter-shell open" : "record-filter-shell collapsed"}>
            <button
              type="button"
              className="record-filter-toggle"
              aria-expanded={filtersOpen}
              aria-controls="record-filter-panel"
              onClick={toggleFiltersOpen}
            >
              <span>
                <strong>필터</strong>
                {activeFilterCount > 0 && <em>{activeFilterCount}개 적용</em>}
              </span>
              <b>{filtersOpen ? "접기" : "열기"}</b>
            </button>
            <div id="record-filter-panel" className="filter-panel" hidden={!filtersOpen}>
              <div className="filter-group-grid">
                <section className="filter-group subject-filter-group" aria-label="과목 필터">
                  <h3>과목</h3>
                  <div className="filter-group-controls">
                    <MultiSelectFilter
                      label="과목"
                      values={filters.subjectIds}
                      options={data.subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
                      onChange={(subjectIds) => setFilters((current) => ({ ...current, subjectIds }))}
                    />
                    <MultiSelectFilter
                      label="표준목차"
                      values={effectiveStandardTopicIds}
                      options={standardOptions.map((topic) => ({ value: topic.id, label: topic.title }))}
                      onChange={(standardTopicIds) => setFilters((current) => ({ ...current, standardTopicIds }))}
                    />
                    <MultiSelectFilter
                      label="세부목차"
                      values={effectiveSubtopicIds}
                      options={subtopicOptions.map((subtopic) => ({ value: subtopic.id, label: subtopic.title }))}
                      onChange={(subtopicIds) => setFilters((current) => ({ ...current, subtopicIds }))}
                    />
                  </div>
                </section>

                <section className="filter-group material-filter-group" aria-label="자료 필터">
                  <h3>자료</h3>
                  <div className="filter-group-controls">
                    <MultiSelectFilter
                      label="자료"
                      values={effectiveMaterialIds}
                      options={materialOptions.map((material) => ({ value: material.id, label: material.title }))}
                      onChange={(materialIds) => setFilters((current) => ({ ...current, materialIds }))}
                    />
                    <MultiSelectFilter
                      label="자료 목차"
                      values={effectiveMaterialTopicIds}
                      options={materialTopicOptions.map((topic) => ({ value: topic.id, label: formatOrder(topic.order, topic.title) }))}
                      onChange={(materialTopicIds) => setFilters((current) => ({ ...current, materialTopicIds }))}
                    />
                  </div>
                </section>

                <section className="filter-group record-filter-group" aria-label="기록 속성 필터">
                  <h3>기록</h3>
                  <div className="filter-group-controls">
                    <MultiSelectFilter
                      label="기록유형"
                      values={filters.types}
                      options={RECORD_TYPES.map((type) => ({ value: type, label: type }))}
                      onChange={(types) => setFilters((current) => ({ ...current, types: types as RecordType[] }))}
                    />
                    <MultiSelectFilter
                      label="학습상태"
                      values={filters.studyStates}
                      options={STUDY_STATES.map((state) => ({ value: state, label: state }))}
                      onChange={(studyStates) => setFilters((current) => ({ ...current, studyStates: studyStates as StudyState[] }))}
                    />
                    <MultiSelectFilter
                      label="태그"
                      values={filters.tagNames}
                      options={tagOptions}
                      onChange={(tagNames) => setFilters((current) => ({ ...current, tagNames }))}
                    />
                  </div>
                </section>
              </div>
              <div className="filter-actions">
                <button
                  className={filters.uncategorizedOnly ? "secondary-button compact active-action" : "secondary-button compact"}
                  onClick={() => setFilters((current) => ({ ...current, uncategorizedOnly: !current.uncategorizedOnly }))}
                >
                  미분류만 보기
                </button>
                <button className="secondary-button compact subtle-reset-button" onClick={clearFilters}>
                  필터 초기화
                </button>
              </div>
            </div>
          </section>

          <div className="section-heading">
            <h2>{filteredRecords.length}개 기록</h2>
            <div className="action-row wrap">
              <button
                className="secondary-button"
                disabled={filteredRecords.filter((record) => record.useReviewCard).length === 0}
                onClick={() => startReview("필터 결과", filteredRecords)}
              >
                필터 결과 카드 복습
              </button>
              <button className={selectionMode ? "secondary-button active-action" : "secondary-button"} onClick={toggleSelectionMode}>
                선택 모드
              </button>
            </div>
          </div>

          {selectionMode && (
            <BulkRecordToolbar
              data={data}
              selectedCount={selectedCount}
              filteredCount={filteredRecords.length}
              selectedRecordIds={selectedInView}
              onSelectAll={() => setSelectedRecordIds(filteredRecords.map((record) => record.id))}
              onClearSelection={() => setSelectedRecordIds([])}
              onPatch={applyBulkPatch}
              onAddTag={(tag) => applyBulkTags("add", tag)}
              onRemoveTag={(tag) => applyBulkTags("remove", tag)}
              onMoveToTrash={moveSelectedToTrash}
            />
          )}

          <div className="records-page-records">
            <RecordList
              data={data}
              records={filteredRecords}
              onEdit={(recordId) => openRecordModal({ mode: "edit", recordId })}
              onDelete={(recordId) => confirmAndDeleteRecord(updateData, recordId)}
              selectionMode={selectionMode}
              selectedRecordIds={selectedInView}
              onToggleSelection={toggleRecordSelection}
            />
          </div>
        </>
      )}
    </section>
  );
}

type OutlineDragPayload =
  | { type: "group"; group: string }
  | { type: "topic"; topicId: string };
type OutlineDragVisual = {
  label: string;
  sourceKey: string;
  targetKey?: string;
  targetPosition?: "before" | "after" | "end";
  x: number;
  y: number;
};
type GroupDeleteState = {
  group: string;
  mode: "delete" | "move";
  targetGroup: string;
};

function OutlineManager({
  data,
  updateData,
  fixedSubjectId,
  embedded = false,
}: {
  data: StudyData;
  updateData: (updater: (current: StudyData) => StudyData) => void;
  fixedSubjectId?: string;
  embedded?: boolean;
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(fixedSubjectId || data.subjects[0]?.id || "");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [groupDelete, setGroupDelete] = useState<GroupDeleteState | null>(null);
  const [dragVisual, setDragVisual] = useState<OutlineDragVisual | null>(null);
  const dragPayload = useRef<OutlineDragPayload | null>(null);
  const activeSubjectId = fixedSubjectId || selectedSubjectId;
  const subject = data.subjects.find((item) => item.id === activeSubjectId) || data.subjects[0];
  const subjectId = subject?.id || "";
  const subjectTopics = data.standardTopics
    .filter((topic) => topic.subjectId === subjectId)
    .sort((a, b) => a.order - b.order);
  const groupedTopics = groupBy(subjectTopics, (topic) => topic.group);
  const groups = Array.from(groupedTopics.keys());
  const topics = groups.flatMap((group) => groupedTopics.get(group) || []);
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) || topics[0];

  useEffect(() => {
    if (fixedSubjectId) {
      setSelectedSubjectId(fixedSubjectId);
      return;
    }
    if (!data.subjects.some((item) => item.id === selectedSubjectId)) {
      setSelectedSubjectId(data.subjects[0]?.id || "");
    }
  }, [data.subjects, fixedSubjectId, selectedSubjectId]);

  useEffect(() => {
    if (!selectedTopicId || !topics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId(topics[0]?.id || "");
    }
  }, [selectedTopicId, topics]);

  const updateTopicOrder = (orderedTopics: StandardTopic[]) => {
    const updates = new Map(
      orderedTopics.map((topic, index) => [topic.id, { group: topic.group, order: index + 1 }]),
    );
    updateData((current) => ({
      ...current,
      standardTopics: current.standardTopics.map((topic) => {
        const update = updates.get(topic.id);
        return update ? { ...topic, ...update } : topic;
      }),
    }));
  };

  const startOutlineDrag = (
    event: DragEvent<HTMLElement>,
    payload: OutlineDragPayload,
    label: string,
    sourceKey: string,
  ) => {
    dragPayload.current = payload;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", label);
    const ghost = document.createElement("canvas");
    ghost.width = 1;
    ghost.height = 1;
    event.dataTransfer.setDragImage(ghost, 0, 0);
    setDragVisual({
      label,
      sourceKey,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const getTableRowDropPosition = (event: DragEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
  };

  const updateDragVisual = (event: DragEvent<HTMLElement>, targetKey?: string) => {
    event.preventDefault();
    if (targetKey) event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    const targetPosition = targetKey?.startsWith("topic:")
      ? targetKey === "topic:end"
        ? "end"
        : getTableRowDropPosition(event)
      : undefined;
    setDragVisual((current) => {
      if (!current) return current;
      return {
        ...current,
        targetKey: targetKey || current.targetKey,
        targetPosition: targetKey ? targetPosition : current.targetPosition,
        x: event.clientX || current.x,
        y: event.clientY || current.y,
      };
    });
  };

  const clearDragVisual = () => {
    dragPayload.current = null;
    setDragVisual(null);
  };

  const getDragRowClass = (key: string, base = "") =>
    [
      base,
      dragVisual?.sourceKey === key ? "drag-source-row" : "",
      dragVisual?.targetKey === key ? "drag-target-row" : "",
      dragVisual?.targetKey === key && dragVisual.targetPosition === "after" ? "drag-after-row" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const renameGroup = (oldName: string, nextName: string) => {
    const name = nextName.trim();
    if (!name || name === oldName) return;
    updateData((current) => ({
      ...current,
      standardTopics: current.standardTopics.map((topic) =>
        topic.subjectId === subjectId && topic.group === oldName ? { ...topic, group: name } : topic,
      ),
    }));
  };

  const dropGroup = (targetGroup: string) => {
    const payload = dragPayload.current;
    dragPayload.current = null;
    setDragVisual(null);
    if (!payload) return;
    if (payload.type === "group") {
      if (payload.group === targetGroup) return;
      const entries = Array.from(groupedTopics.entries());
      const sourceIndex = entries.findIndex(([group]) => group === payload.group);
      const targetIndex = entries.findIndex(([group]) => group === targetGroup);
      if (sourceIndex < 0 || targetIndex < 0) return;
      const nextEntries = [...entries];
      const [moved] = nextEntries.splice(sourceIndex, 1);
      nextEntries.splice(targetIndex, 0, moved);
      updateTopicOrder(nextEntries.flatMap(([, groupTopics]) => groupTopics));
      return;
    }
    if (payload.type === "topic") {
      moveTopicToGroup(payload.topicId, targetGroup);
    }
  };

  const dropTopic = (event: DragEvent<HTMLElement>, targetTopic: StandardTopic) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = dragPayload.current;
    const position = getTableRowDropPosition(event);
    dragPayload.current = null;
    setDragVisual(null);
    if (!payload) return;
    if (payload.type === "group") {
      dragPayload.current = payload;
      dropGroup(targetTopic.group);
      return;
    }
    if (payload.type !== "topic" || payload.topicId === targetTopic.id) return;
    const sourceTopic = topics.find((topic) => topic.id === payload.topicId);
    if (!sourceTopic) return;
    const withoutSource = topics.filter((topic) => topic.id !== payload.topicId);
    const targetIndex = withoutSource.findIndex((topic) => topic.id === targetTopic.id);
    if (targetIndex < 0) return;
    withoutSource.splice(targetIndex + (position === "after" ? 1 : 0), 0, { ...sourceTopic, group: targetTopic.group });
    updateTopicOrder(withoutSource);
  };

  const dropTopicToEnd = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = dragPayload.current;
    dragPayload.current = null;
    setDragVisual(null);
    if (!payload || payload.type !== "topic" || topics[topics.length - 1]?.id === payload.topicId) return;
    const sourceTopic = topics.find((topic) => topic.id === payload.topicId);
    if (!sourceTopic) return;
    const lastGroup = topics[topics.length - 1]?.group || sourceTopic.group;
    const withoutSource = topics.filter((topic) => topic.id !== payload.topicId);
    withoutSource.push({ ...sourceTopic, group: lastGroup });
    updateTopicOrder(withoutSource);
  };

  const moveTopicToGroup = (topicId: string, targetGroup: string) => {
    const topic = topics.find((item) => item.id === topicId);
    if (!topic || topic.group === targetGroup) return;
    if (!groups.includes(targetGroup)) {
      updateTopicOrder(topics.map((item) => (item.id === topic.id ? { ...item, group: targetGroup } : item)));
      return;
    }
    const sourceGroupTopics = topics.filter((item) => item.group === topic.group && item.id !== topic.id);
    const targetGroupTopics = [...topics.filter((item) => item.group === targetGroup), { ...topic, group: targetGroup }];
    const nextTopics = Array.from(groupedTopics.entries()).flatMap(([group, groupTopics]) => {
      if (group === topic.group) return sourceGroupTopics;
      if (group === targetGroup) return targetGroupTopics;
      return groupTopics;
    });
    updateTopicOrder(nextTopics);
  };

  const renameTopic = (topic: StandardTopic, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === topic.title) return;
    updateData((current) => ({
      ...current,
      standardTopics: current.standardTopics.map((item) =>
        item.id === topic.id ? { ...item, title: nextTitle } : item,
      ),
    }));
  };

  const deleteTopic = (topic: StandardTopic) => {
    const mappingCount = data.mappings.filter((mapping) => mapping.standardTopicId === topic.id).length;
    const recordCount = getActiveRecords(data).filter((record) => record.standardTopicId === topic.id).length;
    const subtopicCount = data.subtopics.filter((subtopic) => subtopic.standardTopicId === topic.id).length;
    if (
      !window.confirm(
        `${formatOrder(topic.order, topic.title)} 목차를 삭제할까요?\n자료 매핑 ${mappingCount}개, 세부목차 ${subtopicCount}개, 기록 ${recordCount}개가 연결되어 있습니다.\n기록은 삭제하지 않고 미분류 > 연결 해제로 이동합니다.`,
      )
    ) {
      return;
    }
    updateData((current) => removeStandardTopicsSafely(current, subjectId, new Set([topic.id])));
  };

  const openGroupDelete = (group: string) => {
    const targetGroup = groups.find((item) => item !== group) || "";
    setGroupDelete({ group, mode: targetGroup ? "move" : "delete", targetGroup });
  };

  const addGroup = () => {
    const group = newGroupName.trim();
    if (!group) return;
    if (groups.includes(group)) {
      setNewGroupName("");
      return;
    }
    updateData((current) => {
      const nextOrder =
        current.standardTopics
          .filter((topic) => topic.subjectId === subjectId)
          .reduce((max, topic) => Math.max(max, topic.order), 0) + 1;
      return {
        ...current,
        standardTopics: [
          ...current.standardTopics,
          {
            id: createId("std"),
            subjectId,
            group,
            title: "새 목차",
            order: nextOrder,
          },
        ],
      };
    });
    setNewGroupName("");
  };

  const confirmGroupDelete = () => {
    if (!groupDelete) return;
    const groupTopicIds = topics.filter((topic) => topic.group === groupDelete.group).map((topic) => topic.id);
    if (groupDelete.mode === "move") {
      if (!groupDelete.targetGroup) return;
      updateData((current) => {
        const currentSubjectTopics = current.standardTopics
          .filter((topic) => topic.subjectId === subjectId)
          .sort((a, b) => a.order - b.order);
        const movingTopics = currentSubjectTopics
          .filter((topic) => topic.group === groupDelete.group)
          .map((topic) => ({ ...topic, group: groupDelete.targetGroup }));
        const nextSubjectTopics = currentSubjectTopics.flatMap((topic) => {
          if (topic.group === groupDelete.group) return [];
          if (topic.group === groupDelete.targetGroup) return [topic, ...movingTopics.splice(0)];
          return [topic];
        });
        return replaceSubjectTopics(current, subjectId, nextSubjectTopics);
      });
    } else {
      updateData((current) => removeStandardTopicsSafely(current, subjectId, new Set(groupTopicIds)));
    }
    setGroupDelete(null);
  };

  if (!subject) {
    return (
      <section className={embedded ? "outline-manager-panel embedded" : "panel outline-manager-panel"}>
        <h2>목차 관리</h2>
        <EmptyText>목차를 관리할 과목이 없습니다.</EmptyText>
      </section>
    );
  }

  return (
    <section className={embedded ? "outline-manager-panel embedded" : "panel outline-manager-panel"}>
      <div className="section-heading">
        <div>
          <h2>목차 관리</h2>
          <p className="muted">표준목차 그룹과 목차를 정렬·이동·수정·삭제합니다.</p>
        </div>
        {!fixedSubjectId && (
          <label className="field-label compact-select">
            과목
            <select value={subjectId} onChange={(event) => setSelectedSubjectId(event.target.value)}>
              {data.subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="outline-table-layout">
        <div className="outline-table-main">
          <div className="table-toolbar">
            <div className="inline-form outline-add-form">
              <input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="새 그룹명" />
              <button className="secondary-button" onClick={addGroup}>
                그룹 추가
              </button>
            </div>
          </div>

          <details className="table-tools">
            <summary>그룹 순서 관리</summary>
            <p className="muted">그룹 순서가 표준목차 표의 전체 행 배치에 바로 반영됩니다.</p>
            <div className="notion-table-wrap compact-table">
              <table className="notion-table">
                <thead>
                  <tr>
                    <th>이동</th>
                    <th>그룹명</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr
                      key={group}
                      className={getDragRowClass(`group:${group}`)}
                      onDragOver={(event) => updateDragVisual(event, `group:${group}`)}
                      onDrop={() => dropGroup(group)}
                    >
                      <td className="handle-cell">
                        <span
                          className="drag-handle"
                          draggable
                          onDrag={(event) => updateDragVisual(event)}
                          onDragEnd={clearDragVisual}
                          onDragStart={(event) =>
                            startOutlineDrag(event, { type: "group", group }, `그룹 · ${group}`, `group:${group}`)
                          }
                        >
                          ☰
                        </span>
                      </td>
                      <td>
                        <input
                          className="table-input"
                          defaultValue={group}
                          onBlur={(event) => renameGroup(group, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") event.currentTarget.blur();
                          }}
                        />
                      </td>
                      <td>
                        <button className="text-button danger-text" onClick={() => openGroupDelete(group)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <div className="notion-table-wrap" onDragOver={(event) => updateDragVisual(event)}>
            <table className="notion-table">
              <thead>
                <tr>
                  <th>이동</th>
                  <th>그룹</th>
                  <th>목차명</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {topics.length === 0 ? (
                  <tr>
                    <td colSpan={4}>표준목차가 없습니다.</td>
                  </tr>
                ) : (
                  topics.map((topic) => {
                    return (
                      <tr
                        key={topic.id}
                        className={getDragRowClass(`topic:${topic.id}`, selectedTopic?.id === topic.id ? "selected-row" : "")}
                        onClick={() => setSelectedTopicId(topic.id)}
                        onDragOver={(event) => updateDragVisual(event, `topic:${topic.id}`)}
                        onDrop={(event) => dropTopic(event, topic)}
                      >
                        <td className="handle-cell">
                          <span
                            className="drag-handle"
                            draggable
                            onDrag={(event) => updateDragVisual(event)}
                            onDragEnd={clearDragVisual}
                            onDragStart={(event) =>
                              startOutlineDrag(
                                event,
                                { type: "topic", topicId: topic.id },
                                `${topic.group} · ${topic.title}`,
                                `topic:${topic.id}`,
                              )
                            }
                          >
                            ☰
                          </span>
                        </td>
                        <td>
                          <select
                            className="table-input group-select"
                            value={topic.group}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => moveTopicToGroup(topic.id, event.target.value)}
                          >
                            {groups.map((group) => (
                              <option key={group} value={group}>
                                {group}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="table-input"
                            defaultValue={topic.title}
                            onBlur={(event) => renameTopic(topic, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                            }}
                          />
                        </td>
                        <td>
                          <button className="text-button danger-text" onClick={() => deleteTopic(topic)}>
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {dragPayload.current?.type === "topic" && topics.length > 0 && (
                  <tr
                    className={dragVisual?.targetKey === "topic:end" ? "drop-end-row drag-target-row" : "drop-end-row"}
                    onDragOver={(event) => updateDragVisual(event, "topic:end")}
                    onDrop={dropTopicToEnd}
                  >
                    <td colSpan={4}>맨 아래로 이동</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {dragVisual && (
        <div
          className="drag-preview-row"
          style={{ transform: `translate3d(${dragVisual.x + 14}px, ${dragVisual.y + 14}px, 0)` }}
        >
          <span>☰</span>
          <strong>{dragVisual.label}</strong>
        </div>
      )}

      {groupDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel small-modal">
            <h2>그룹 삭제</h2>
            <p>
              [{groupDelete.group}] 그룹에는 {topics.filter((topic) => topic.group === groupDelete.group).length}개 목차가
              있습니다.
            </p>
            <label className="check-row">
              <input
                type="radio"
                checked={groupDelete.mode === "delete"}
                onChange={() => setGroupDelete((current) => (current ? { ...current, mode: "delete" } : current))}
              />
              <span>목차도 함께 삭제하고 연결 기록은 미분류로 이동</span>
            </label>
            <label className="check-row">
              <input
                type="radio"
                checked={groupDelete.mode === "move"}
                disabled={groups.filter((group) => group !== groupDelete.group).length === 0}
                onChange={() => setGroupDelete((current) => (current ? { ...current, mode: "move" } : current))}
              />
              <span>다른 그룹으로 이동</span>
            </label>
            {groupDelete.mode === "move" && (
              <label className="field-label">
                이동할 그룹
                <select
                  value={groupDelete.targetGroup}
                  onChange={(event) =>
                    setGroupDelete((current) => (current ? { ...current, targetGroup: event.target.value } : current))
                  }
                >
                  {groups
                    .filter((group) => group !== groupDelete.group)
                    .map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setGroupDelete(null)}>
                취소
              </button>
              <button className="danger-button" onClick={confirmGroupDelete}>
                실행
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SettingsPage({
  data,
  updateData,
  replaceData,
  authSession,
  syncMessage,
  onOpenSync,
}: {
  data: StudyData;
  updateData: (updater: (current: StudyData) => StudyData) => void;
  replaceData: (next: StudyData) => void;
  authSession: AuthSession | null;
  syncMessage: string;
  onOpenSync: () => void;
}) {
  const [confirm, setConfirm] = useState<"supplement" | "default-reset" | "blank-reset" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const payload = {
      app: "금공러",
      exportedAt: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `geumgong-study-${new Date().toISOString().slice(0, 10)}.study`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { data?: StudyData } | StudyData;
      const imported = "data" in parsed && parsed.data ? parsed.data : parsed;
      if (!isStudyData(imported)) throw new Error("올바른 공부기록 파일이 아닙니다.");
      replaceData(imported);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "공부기록을 불러오지 못했습니다.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section className="page-stack">
      <PageHeader
        title="설정"
        className="settings-page-header"
      />

      <div className="settings-grid settings-layout">
        <div className="settings-left-column">
          <section className="panel settings-system-panel">
            <h2>시스템</h2>
            <div className="settings-pane">
              <div className="settings-details">
                <h3>클라우드 동기화</h3>
                <div className="settings-action-row">
                  <button className="secondary-button" onClick={onOpenSync}>
                    {authSession ? "동기화 관리" : "로그인 / 회원가입"}
                  </button>
                </div>
              </div>

              <div className="settings-details">
                <h3>백업</h3>
                <div className="settings-action-row">
                  <button className="secondary-button" onClick={exportBackup}>
                    파일 백업
                  </button>
                  <button className="secondary-button" onClick={() => fileInputRef.current?.click()}>
                    파일 불러오기
                  </button>
                  <input ref={fileInputRef} className="hidden-input" type="file" accept=".study" onChange={importBackup} />
                </div>
              </div>

              <div className="settings-details">
                <h3>앱 링크 공유</h3>
                <div className="settings-action-row">
                  <button className="secondary-button" onClick={() => setShareOpen(true)}>
                    앱 링크 공유
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="panel settings-info-panel">
            <h2>앱 정보</h2>
            <dl className="info-list">
              <div>
                <dt>앱 이름</dt>
                <dd>금공러</dd>
              </div>
              <div>
                <dt>설명</dt>
                <dd>금융공부러버의 금공 취준 학습관리</dd>
              </div>
              <div>
                <dt>제작</dt>
                <dd>quemory ♥</dd>
              </div>
              <div>
                <dt>서버</dt>
                <dd>{authSession ? "Supabase 연결됨" : "로컬 저장"}</dd>
              </div>
              <div>
                <dt>저장 방식</dt>
                <dd>{authSession ? "Supabase + 브라우저 IndexedDB" : "브라우저 IndexedDB"}</dd>
              </div>
              <div>
                <dt>동기화</dt>
                <dd>{authSession ? "로그인 계정 자동 동기화" : "자동 동기화 없음"}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="settings-right-column">
          <section className="panel settings-review-panel">
            <h2>기록 복습 주기</h2>
            <p className="muted">이 기간 이상 보지 않은 복습 카드를 대시보드에 표시합니다.</p>
            <label className="field-label">
              일수
              <input
                type="number"
                min={1}
                max={365}
                value={data.settings.reviewGapDays}
                onChange={(event) =>
                  updateData((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      reviewGapDays: Number(event.target.value) || 14,
                    },
                  }))
                }
              />
            </label>
          </section>

          <section className="panel settings-data-panel">
            <h2>데이터 관리</h2>
            <div className="settings-action-row">
              <button className="secondary-button" onClick={() => setConfirm("supplement")}>
                기본 보충
              </button>
              <button className="danger-button" onClick={() => setConfirm("default-reset")}>
                기본 초기화
              </button>
              <button className="danger-button" onClick={() => setConfirm("blank-reset")}>
                전체 초기화
              </button>
            </div>
          </section>

          <section className="panel dday-management-panel settings-dday-column">
            <h2>디데이 관리</h2>
            <DDayManager data={data} updateData={updateData} />
          </section>
        </div>
      </div>

      {confirm === "supplement" && (
        <ConfirmModal
          title="기본 세트 보충"
          text="삭제했거나 빠진 기본 과목, 자료, 목차, 매핑을 현재 데이터에 다시 추가합니다. 기존 기록은 유지됩니다."
          confirmLabel="기본 세트 보충"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            replaceData(mergeDefaultTemplate(data));
            setConfirm(null);
          }}
        />
      )}
      {confirm === "default-reset" && (
        <ConfirmModal
          title="기본 세트로 초기화"
          text="현재 데이터를 지우고 금공러 기본 세트 상태로 다시 시작합니다. 기존 기록은 삭제됩니다."
          confirmLabel="기본 세트로 초기화"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            replaceData(createDefaultStudyData());
            setConfirm(null);
          }}
        />
      )}
      {confirm === "blank-reset" && (
        <ConfirmModal
          title="빈 세트로 초기화"
          text="현재 데이터를 모두 지우고 과목, 자료, 목차가 없는 빈 상태로 시작합니다. 금공 취준 외 다른 공부용으로 앱을 쓰고 싶을 때 사용합니다."
          confirmLabel="빈 세트로 초기화"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            replaceData(createEmptyStudyData(data.settings));
            setConfirm(null);
          }}
        />
      )}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </section>
  );
}

type DDayFormState = {
  title: string;
  date: string;
  description: string;
  isPrimary: boolean;
  hidden: boolean;
  completed: boolean;
};

const emptyDDayForm: DDayFormState = {
  title: "",
  date: "",
  description: "",
  isPrimary: false,
  hidden: false,
  completed: false,
};

function DDayManager({
  data,
  updateData,
}: {
  data: StudyData;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const [form, setForm] = useState<DDayFormState>(emptyDDayForm);
  const [editingId, setEditingId] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const dDays = [...(data.dDays || [])].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.date.localeCompare(b.date);
  });
  const primaryDDay = dDays.find((dDay) => dDay.isPrimary);
  const fullManagerClassName = mobileExpanded ? "dday-full-manager mobile-open" : "dday-full-manager";

  const resetForm = () => {
    setForm(emptyDDayForm);
    setEditingId("");
  };

  const startEdit = (dDay: DDayEvent) => {
    setMobileExpanded(true);
    setEditingId(dDay.id);
    setForm({
      title: dDay.title,
      date: dDay.date,
      description: dDay.description,
      isPrimary: dDay.isPrimary,
      hidden: dDay.hidden,
      completed: dDay.completed,
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title || !form.date) return;
    const now = new Date().toISOString();
    const id = editingId || createId("dday");

    updateData((current) => {
      const existingRows = current.dDays || [];
      const nextRow: DDayEvent = {
        id,
        title,
        date: form.date,
        description,
        isPrimary: form.isPrimary,
        hidden: form.hidden,
        completed: form.completed,
        createdAt: existingRows.find((row) => row.id === id)?.createdAt || now,
        updatedAt: now,
      };
      const nextRows = editingId
        ? existingRows.map((row) => (row.id === editingId ? nextRow : row))
        : [...existingRows, nextRow];
      return {
        ...current,
        dDays: nextRows.map((row) => (form.isPrimary ? { ...row, isPrimary: row.id === id } : row)),
      };
    });
    resetForm();
  };

  const patchDDay = (dDayId: string, patch: Partial<Pick<DDayEvent, "hidden" | "completed" | "isPrimary">>) => {
    updateData((current) => {
      const now = new Date().toISOString();
      return {
        ...current,
        dDays: (current.dDays || []).map((row) => {
          if (patch.isPrimary) return { ...row, isPrimary: row.id === dDayId, updatedAt: row.id === dDayId ? now : row.updatedAt };
          return row.id === dDayId ? { ...row, ...patch, updatedAt: now } : row;
        }),
      };
    });
  };

  const deleteDDay = (dDay: DDayEvent) => {
    if (!window.confirm(`${dDay.title} 디데이를 삭제할까요?`)) return;
    updateData((current) => ({ ...current, dDays: (current.dDays || []).filter((row) => row.id !== dDay.id) }));
    if (editingId === dDay.id) resetForm();
  };

  return (
    <div className="dday-manager">
      <div className="dday-mobile-summary">
        {primaryDDay ? (
          <article className={primaryDDay.hidden || primaryDDay.completed ? "dday-primary-summary inactive-dday-row" : "dday-primary-summary"}>
            <div className="dday-primary-summary-top">
              <span className="dday-mini-chip">대표</span>
              <strong>{formatDDayStatus(primaryDDay.date)}</strong>
            </div>
            <div className="dday-row-main">
              <strong>{primaryDDay.title}</strong>
              <span>{formatDateLabel(primaryDDay.date)}</span>
              {primaryDDay.description && <p>{primaryDDay.description}</p>}
            </div>
          </article>
        ) : (
          <article className="dday-primary-summary empty-summary">
            <strong>대표 디데이 없음</strong>
          </article>
        )}
        <button type="button" className="secondary-button wide" onClick={() => setMobileExpanded((value) => !value)}>
          {mobileExpanded ? "디데이 관리 닫기" : "디데이 추가/전체 보기"}
        </button>
      </div>

      <div className={fullManagerClassName}>
        <form className="dday-form" onSubmit={submit}>
          <div className="form-grid dday-form-grid">
            <label className="field-label">
              제목
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="신용보증기금 필기"
              />
            </label>
            <label className="field-label dday-date-field">
              날짜
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label className="field-label wide-field">
              설명
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={2}
                placeholder="오전 필기시험"
              />
            </label>
          </div>
          <div className="dday-option-row">
            <label className="toggle-row compact-toggle-row">
              <span>대표 디데이</span>
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(event) => setForm((current) => ({ ...current, isPrimary: event.target.checked }))}
              />
            </label>
            <label className="toggle-row compact-toggle-row">
              <span>숨김</span>
              <input
                type="checkbox"
                checked={form.hidden}
                onChange={(event) => setForm((current) => ({ ...current, hidden: event.target.checked }))}
              />
            </label>
            <label className="toggle-row compact-toggle-row">
              <span>완료</span>
              <input
                type="checkbox"
                checked={form.completed}
                onChange={(event) => setForm((current) => ({ ...current, completed: event.target.checked }))}
              />
            </label>
          </div>
          <div className="action-row wrap">
            <button className="primary-button" type="submit">
              {editingId ? "디데이 저장" : "디데이 추가"}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                취소
              </button>
            )}
          </div>
        </form>

        <div className="dday-list">
          {dDays.length === 0 ? (
            <EmptyText>등록된 디데이가 없습니다.</EmptyText>
          ) : (
            dDays.map((dDay) => (
              <article key={dDay.id} className={dDay.hidden || dDay.completed ? "dday-row inactive-dday-row" : "dday-row"}>
                <div className="dday-row-main">
                  <div>
                    <strong>{dDay.title}</strong>
                    <span>
                      {formatDateLabel(dDay.date)} · {formatDDayStatus(dDay.date)}
                    </span>
                  </div>
                  {dDay.description && <p>{dDay.description}</p>}
                </div>
                <div className="dday-row-flags">
                  {dDay.isPrimary && <span className="dday-mini-chip">대표</span>}
                  {dDay.hidden && <span className="dday-mini-chip muted-chip">숨김</span>}
                  {dDay.completed && <span className="dday-mini-chip muted-chip">완료</span>}
                </div>
                <div className="dday-row-actions">
                  <button
                    className={dDay.isPrimary ? "secondary-button compact active-action" : "secondary-button compact"}
                    onClick={() => patchDDay(dDay.id, { isPrimary: !dDay.isPrimary })}
                  >
                    {dDay.isPrimary ? "대표 해제" : "대표"}
                  </button>
                  <button className="secondary-button compact" onClick={() => patchDDay(dDay.id, { hidden: !dDay.hidden })}>
                    {dDay.hidden ? "숨김 해제" : "숨김"}
                  </button>
                  <button className="secondary-button compact" onClick={() => patchDDay(dDay.id, { completed: !dDay.completed })}>
                    {dDay.completed ? "완료 해제" : "완료"}
                  </button>
                  <button className="secondary-button compact" onClick={() => startEdit(dDay)}>
                    수정
                  </button>
                  <button className="danger-button compact" onClick={() => deleteDDay(dDay)}>
                    삭제
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function createEmptyStudyData(settings: StudyData["settings"]): StudyData {
  return {
    version: CURRENT_DATA_VERSION,
    initializedAt: new Date().toISOString(),
    subjects: [],
    materials: [],
    subjectMaterialSettings: [],
    materialTopics: [],
    standardTopics: [],
    subtopics: [],
    mappings: [],
    records: [],
    dDays: [],
    todayCompletions: [],
    settings: { ...settings },
  };
}

function RecordModal({
  data,
  context,
  onClose,
  updateData,
}: {
  data: StudyData;
  context: RecordModalContext;
  onClose: () => void;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const editingRecord = context.mode === "edit" ? data.records.find((record) => record.id === context.recordId) : undefined;
  const initialMaterialTopic =
    context.mode === "create" && context.materialTopicId
      ? data.materialTopics.find((topic) => topic.id === context.materialTopicId)
      : undefined;
  const initialMaterialId =
    editingRecord?.materialId ||
    (context.mode === "create" ? context.materialId : undefined) ||
    initialMaterialTopic?.materialId ||
    "";
  const initialMaterial = data.materials.find((material) => material.id === initialMaterialId);
  const candidateStandardTopicIds =
    context.mode === "create" && context.candidateStandardTopicIds?.length
      ? context.candidateStandardTopicIds
      : context.mode === "create" && context.materialTopicId
        ? data.mappings
            .filter((mapping) => mapping.materialTopicId === context.materialTopicId)
            .map((mapping) => mapping.standardTopicId)
        : [];
  const firstCandidateStandard = data.standardTopics.find((topic) => candidateStandardTopicIds.includes(topic.id));
  const initialSubjectId =
    editingRecord?.subjectId ||
    (context.mode === "create" ? context.subjectId : undefined) ||
    firstCandidateStandard?.subjectId ||
    (initialMaterial ? getMaterialSubjectIds(initialMaterial)[0] : undefined) ||
    "";
  const subjectStandards = data.standardTopics
    .filter((topic) => topic.subjectId === initialSubjectId)
    .sort((a, b) => a.order - b.order);
  const initialStandardId =
    editingRecord?.standardTopicId ||
    (context.mode === "create" ? context.standardTopicId : undefined) ||
    candidateStandardTopicIds[0] ||
    subjectStandards[0]?.id ||
    "";

  const [form, setForm] = useState({
    title: editingRecord?.title || "",
    content: editingRecord?.content || "",
    type: (editingRecord?.type || "일반메모") as RecordType,
    subjectId: initialSubjectId,
    standardTopicId: initialStandardId,
    subtopicId: editingRecord?.subtopicId || "",
    materialId: initialMaterialId,
    materialTopicId:
      editingRecord?.materialTopicId || (context.mode === "create" ? context.materialTopicId || "" : ""),
    link: editingRecord?.link || "",
    tags: editingRecord?.tags || [],
    useReviewCard: editingRecord?.useReviewCard ?? getDefaultReviewCardValue((editingRecord?.type || "일반메모") as RecordType),
    studyState: (editingRecord?.studyState || "미확인") as StudyState,
  });
  const candidateIdsForSubject = candidateStandardTopicIds.filter(
    (standardTopicId) => data.standardTopics.find((topic) => topic.id === standardTopicId)?.subjectId === form.subjectId,
  );
  const standardOptions = data.standardTopics
    .filter((topic) => form.subjectId && topic.subjectId === form.subjectId)
    .filter((topic) => candidateIdsForSubject.length === 0 || candidateIdsForSubject.includes(topic.id))
    .sort((a, b) => a.order - b.order);
  const subtopicOptions = data.subtopics
    .filter((subtopic) => subtopic.standardTopicId === form.standardTopicId)
    .sort((a, b) => a.order - b.order);
  const materialOptions = data.materials.filter((material) => !form.subjectId || materialHasSubject(material, form.subjectId));
  const materialTopicOptions = data.materialTopics
    .filter((topic) => topic.materialId === form.materialId)
    .sort((a, b) => a.order - b.order);
  const selectedFormMaterial = data.materials.find((material) => material.id === form.materialId);
  const subjectOptions = selectedFormMaterial
    ? data.subjects.filter((subject) => getMaterialSubjectIds(selectedFormMaterial).includes(subject.id))
    : data.subjects;

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const now = new Date().toISOString();
    const selectedStandard = data.standardTopics.find((topic) => topic.id === form.standardTopicId);
    const title = form.title.trim() || `${form.type} · ${selectedStandard?.title || "미분류 기록"}`;
    const linkedMaterialTopic = data.materialTopics.find((topic) => topic.id === form.materialTopicId);
    const materialId = linkedMaterialTopic?.materialId || form.materialId || undefined;
    const tags = normalizeTags(form.tags);

    updateData((current) => {
      if (editingRecord) {
        return {
          ...current,
          records: current.records.map((record) =>
            record.id === editingRecord.id
              ? {
                  ...record,
                  ...form,
                  title,
                  subjectId: form.subjectId || undefined,
                  standardTopicId: form.standardTopicId || undefined,
                  materialId,
                  materialTopicId: form.materialTopicId || undefined,
                  subtopicId: form.subtopicId || undefined,
                  link: form.link.trim() || undefined,
                  tags,
                  updatedAt: now,
                }
              : record,
          ),
        };
      }

      const created: StudyRecord = {
        id: createId("record"),
        title,
        content: form.content,
        type: form.type,
        subjectId: form.subjectId || undefined,
        standardTopicId: form.standardTopicId || undefined,
        subtopicId: form.subtopicId || undefined,
        materialId,
        materialTopicId: form.materialTopicId || undefined,
        link: form.link.trim() || undefined,
        tags,
        createdAt: now,
        updatedAt: now,
        useReviewCard: form.useReviewCard,
        studyState: form.studyState,
        knownCount: 0,
        unknownCount: 0,
      };
      return { ...current, records: [created, ...current.records] };
    });
    onClose();
  };

  const insertTemplate = () => {
    const template = RECORD_TEMPLATES[form.type];
    setForm((current) => ({
      ...current,
      content: current.content.trim() ? `${current.content.trimEnd()}\n\n${template}` : template,
    }));
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal-panel record-modal" onSubmit={submit}>
        <div className="modal-header">
          <h2>{editingRecord ? "기록 수정" : "기록 추가"}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="form-grid record-form-grid">
          <label className="field-label wide-field">
            제목
            <input value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="비워두면 자동 생성" />
          </label>
          <select
            value={form.type}
            aria-label="기록 유형"
            onChange={(event) => {
              const nextType = event.target.value as RecordType;
              setForm((current) => ({
                ...current,
                type: nextType,
                useReviewCard: editingRecord ? current.useReviewCard : getDefaultReviewCardValue(nextType),
              }));
            }}
          >
            {RECORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button type="button" className="secondary-button record-template-button" onClick={insertTemplate}>
            템플릿 불러오기
          </button>
          <select
            value={form.studyState}
            aria-label="학습상태"
            onChange={(event) => setField("studyState", event.target.value as StudyState)}
          >
            {STUDY_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            value={form.subjectId}
            aria-label="연결 과목"
            onChange={(event) => {
              const value = event.target.value;
              const nextStandard =
                value
                  ? data.standardTopics
                      .filter((topic) => topic.subjectId === value)
                      .filter((topic) => {
                        const nextCandidateIds = candidateStandardTopicIds.filter(
                          (standardTopicId) => data.standardTopics.find((item) => item.id === standardTopicId)?.subjectId === value,
                        );
                        return nextCandidateIds.length === 0 || nextCandidateIds.includes(topic.id);
                      })[0] || data.standardTopics.find((topic) => topic.subjectId === value)
                  : undefined;
              setForm((current) => {
                const currentMaterial = data.materials.find((material) => material.id === current.materialId);
                const keepMaterial = currentMaterial ? !value || materialHasSubject(currentMaterial, value) : false;
                return {
                  ...current,
                  subjectId: value,
                  standardTopicId: nextStandard?.id || "",
                  subtopicId: "",
                  materialId: keepMaterial ? current.materialId : "",
                  materialTopicId: keepMaterial ? current.materialTopicId : "",
                };
              });
            }}
          >
            <option value="" disabled>
              연결 과목
            </option>
            {subjectOptions.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select
            value={form.standardTopicId}
            aria-label="연결 표준목차"
            onChange={(event) => setForm((current) => ({ ...current, standardTopicId: event.target.value, subtopicId: "" }))}
          >
            <option value="" disabled>
              연결 표준목차
            </option>
            {standardOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {formatOrder(topic.order, topic.title)}
              </option>
            ))}
          </select>
          <select value={form.subtopicId} aria-label="연결 세부목차" onChange={(event) => setField("subtopicId", event.target.value)}>
            <option value="" disabled>
              연결 세부목차
            </option>
            {subtopicOptions.map((subtopic) => (
              <option key={subtopic.id} value={subtopic.id}>
                {subtopic.title}
              </option>
          ))}
          </select>
          <select
            aria-label="출처 자료"
            value={form.materialId}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => {
                const selectedMaterial = data.materials.find((material) => material.id === value);
                const selectedSubjectIds = selectedMaterial ? getMaterialSubjectIds(selectedMaterial) : [];
                const nextSubjectId =
                  selectedMaterial && !selectedSubjectIds.includes(current.subjectId)
                    ? selectedSubjectIds[0] || current.subjectId
                    : current.subjectId;
                const nextStandard =
                  nextSubjectId === current.subjectId
                    ? data.standardTopics.find((topic) => topic.id === current.standardTopicId)
                    : data.standardTopics.find((topic) => topic.subjectId === nextSubjectId);
                return {
                  ...current,
                  subjectId: nextSubjectId,
                  standardTopicId: nextStandard?.id || "",
                  subtopicId: nextSubjectId === current.subjectId ? current.subtopicId : "",
                  materialId: value,
                  materialTopicId: "",
                };
              });
            }}
          >
            <option value="" disabled>
              출처 자료
            </option>
            {materialOptions.map((material) => (
              <option key={material.id} value={material.id}>
                {material.title}
              </option>
            ))}
          </select>
          <select
            value={form.materialTopicId}
            aria-label="출처 자료 목차"
            onChange={(event) => setField("materialTopicId", event.target.value)}
          >
            <option value="" disabled>
              출처 자료 목차
            </option>
            {materialTopicOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {formatOrder(topic.order, topic.title)}
              </option>
            ))}
          </select>
          <input value={form.link} onChange={(event) => setField("link", event.target.value)} placeholder="첨부 링크" aria-label="첨부 링크" />
          <TagSelector
            data={data}
            selected={form.tags}
            onChange={(tags) => setField("tags", tags)}
            onDeleteTag={(tag) => {
              setForm((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
              updateData((current) => removeTagFromAllRecords(current, tag));
            }}
          />
          <label className="field-label wide-field">
            내용
            <textarea
              className={form.type === "회계처리" ? "math-text-input accounting-entry-input" : "math-text-input"}
              value={form.content}
              onChange={(event) => setField("content", event.target.value)}
              onPaste={(event) => handleRichMathTextPaste(event, (value) => setField("content", value))}
              wrap={form.type === "회계처리" ? "off" : undefined}
              rows={7}
            />
          </label>
          <label className="check-row wide-field">
            <input
              type="checkbox"
              checked={form.useReviewCard}
              onChange={(event) => setField("useReviewCard", event.target.checked)}
            />
            <span>복습 카드 사용</span>
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            취소
          </button>
          <button className="primary-button">{editingRecord ? "수정" : "추가"}</button>
        </div>
      </form>
    </div>
  );
}

function MappingModal({
  data,
  materialTopic,
  onClose,
  updateData,
}: {
  data: StudyData;
  materialTopic: MaterialTopic;
  onClose: () => void;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const material = data.materials.find((item) => item.id === materialTopic.materialId);
  const materialSubjectIds = material ? getMaterialSubjectIds(material) : [];
  const standards = data.standardTopics
    .filter((topic) => materialSubjectIds.includes(topic.subjectId))
    .sort((a, b) => a.order - b.order);
  const standardIds = new Set(standards.map((topic) => topic.id));
  const [selected, setSelected] = useState(
    data.mappings
      .filter((mapping) => mapping.materialTopicId === materialTopic.id && standardIds.has(mapping.standardTopicId))
      .map((mapping) => mapping.standardTopicId),
  );

  const toggle = (standardTopicId: string) => {
    setSelected((current) =>
      current.includes(standardTopicId)
        ? current.filter((id) => id !== standardTopicId)
        : [...current, standardTopicId],
    );
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div className="modal-header">
          <h2>표준목차 연결</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <p className="muted">{formatOrder(materialTopic.order, materialTopic.title)}</p>
        <div className="mapping-list">
          {standards.map((topic) => (
            <label key={topic.id} className="check-row">
              <input type="checkbox" checked={selected.includes(topic.id)} onChange={() => toggle(topic.id)} />
              <span>
                {getSubjectName(data, topic.subjectId)} · {topic.group} · {formatOrder(topic.order, topic.title)}
              </span>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            취소
          </button>
          <button
            className="primary-button"
            onClick={() => {
              updateData((current) => ({
                ...current,
                mappings: [
                  ...current.mappings.filter((mapping) => mapping.materialTopicId !== materialTopic.id),
                  ...selected.map((standardTopicId) => ({
                    id: `map-${materialTopic.id}-${standardTopicId}`,
                    materialTopicId: materialTopic.id,
                    standardTopicId,
                  })),
                ],
              }));
              onClose();
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewPage({
  data,
  session,
  onClose,
  updateData,
}: {
  data: StudyData;
  session: ReviewSession;
  onClose: () => void;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const records = session.recordIds
    .map((id) => data.records.find((record) => record.id === id && !isRecordDeleted(record)))
    .filter(Boolean) as StudyRecord[];
  const [index, setIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [history, setHistory] = useState<
    Array<Pick<StudyRecord, "id" | "studyState" | "lastReviewedAt" | "knownCount" | "unknownCount" | "updatedAt">>
  >([]);
  const pointerStart = useRef<number | null>(null);
  const current = records[index];

  const mark = (state: "앎" | "모름") => {
    if (!current) return;
    const now = new Date().toISOString();
    setHistory((items) => [
      ...items,
      {
        id: current.id,
        studyState: current.studyState,
        lastReviewedAt: current.lastReviewedAt,
        knownCount: current.knownCount,
        unknownCount: current.unknownCount,
        updatedAt: current.updatedAt,
      },
    ]);
    updateData((dataBefore) => ({
      ...dataBefore,
      records: dataBefore.records.map((record) =>
        record.id === current.id
          ? {
              ...record,
              studyState: state,
              lastReviewedAt: now,
              updatedAt: now,
              knownCount: state === "앎" ? record.knownCount + 1 : record.knownCount,
              unknownCount: state === "모름" ? record.unknownCount + 1 : record.unknownCount,
            }
          : record,
      ),
    }));
    setShowContent(false);
    setIndex((value) => value + 1);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    updateData((dataBefore) => ({
      ...dataBefore,
      records: dataBefore.records.map((record) =>
        record.id === previous.id
          ? {
              ...record,
              studyState: previous.studyState,
              lastReviewedAt: previous.lastReviewedAt,
              knownCount: previous.knownCount,
              unknownCount: previous.unknownCount,
              updatedAt: previous.updatedAt,
            }
          : record,
      ),
    }));
    setHistory((items) => items.slice(0, -1));
    setIndex((value) => Math.max(0, value - 1));
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") mark("앎");
      if (event.key === "ArrowLeft") mark("모름");
      if (event.key === " ") {
        event.preventDefault();
        setShowContent((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (records.length === 0 || index >= records.length) {
    return (
      <section className="review-screen">
        <div className="review-card done">
          <p className="eyebrow">카드 복습 완료</p>
          <h1>{session.title}</h1>
          <p>{records.length}개 기록을 확인했습니다.</p>
          <div className="action-row center">
            <button className="secondary-button" onClick={undo} disabled={history.length === 0}>
              되돌리기
            </button>
            <button className="primary-button" onClick={onClose}>
              돌아가기
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="review-screen">
      <div className="review-topbar">
        <button className="secondary-button compact" onClick={onClose}>
          종료
        </button>
        <span>
          {index + 1} / {records.length}
        </span>
        <button className="secondary-button compact" onClick={undo} disabled={history.length === 0}>
          되돌리기
        </button>
      </div>
      <article
        className="review-card"
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const distance = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (distance > 80) mark("앎");
          if (distance < -80) mark("모름");
        }}
      >
        <p className="eyebrow">{current.type}</p>
        <h1>{current.title}</h1>
        <RecordMeta data={data} record={current} />
        {showContent ? (
          <p className={current.type === "회계처리" ? "review-content accounting-entry-content" : "review-content"}>
            {current.content || "내용 없음"}
          </p>
        ) : (
          <p className="review-placeholder">스페이스바 또는 내용 보기</p>
        )}
        {current.link && (
          <a className="attached-link" href={current.link} target="_blank" rel="noreferrer">
            <LinkIcon />
            <span>링크</span>
          </a>
        )}
      </article>
      <div className="review-actions">
        <button className="unknown-button" onClick={() => mark("모름")}>
          ← 모름
        </button>
        <button className="secondary-button" onClick={() => setShowContent((value) => !value)}>
          내용 보기
        </button>
        <button className="known-button" onClick={() => mark("앎")}>
          앎 →
        </button>
      </div>
    </section>
  );
}

function AddMaterialForm({
  data,
  updateData,
}: {
  data: StudyData;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const [form, setForm] = useState({
    subjectId: data.subjects[0]?.id || "",
    title: "",
    statusLabel: "",
    category: "기타" as MaterialCategory,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    updateData((current) => ({
      ...current,
      materials: [
        ...current.materials,
        {
          id: createId("material"),
          subjectIds: form.subjectId ? [form.subjectId] : [],
          title: form.title.trim(),
          statusLabel: form.statusLabel.trim() || "자료",
          category: form.category,
          showInSubjectView: true,
        },
      ],
    }));
    setForm((current) => ({ ...current, title: "", statusLabel: "" }));
  };

  return (
    <form className="inline-form material-add-form" onSubmit={submit}>
      <select
        value={form.subjectId}
        aria-label="연결 과목"
        onChange={(event) => setForm((current) => ({ ...current, subjectId: event.target.value }))}
      >
        {data.subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
      <input
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        placeholder="자료명"
      />
      <input
        value={form.statusLabel}
        onChange={(event) => setForm((current) => ({ ...current, statusLabel: event.target.value }))}
        placeholder="상태명"
      />
      <select
        value={form.category}
        aria-label="자료유형"
        onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as MaterialCategory }))}
      >
        {MATERIAL_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <button className="primary-button">자료 추가</button>
    </form>
  );
}

function BulkTopicAdder({
  title,
  help,
  placeholder = "[재무회계 기초]\n제1장 재무회계 일반\nChapter 01 경영 핵심기출",
  example,
  variant = "panel",
  onAdd,
}: {
  title: string;
  help: string;
  placeholder?: string;
  example?: string;
  variant?: "panel" | "plain";
  onAdd: (rows: Array<{ group?: string; title: string }>) => void;
}) {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Array<{ group?: string; title: string }>>([]);

  const parse = () => {
    setRows(parseOutline(input));
  };

  const commit = () => {
    const cleaned = rows.map((row) => ({ ...row, title: row.title.trim() })).filter((row) => row.title);
    if (cleaned.length === 0) return;
    onAdd(cleaned);
    setInput("");
    setRows([]);
  };

  const content = (
    <>
      <p className="muted">{help}</p>
      {example && <pre className="outline-example">{example}</pre>}
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={5}
        placeholder={placeholder}
      />
      <div className="action-row wrap">
        <button type="button" className="secondary-button" onClick={parse}>
          자동 정리
        </button>
        <button type="button" className="primary-button" disabled={rows.length === 0} onClick={commit}>
          정리한 목차 추가
        </button>
      </div>
      {rows.length > 0 && (
        <div className="parsed-list">
          {rows.map((row, index) => (
            <div key={`${row.title}-${index}`} className="parsed-row">
              {row.group !== undefined && (
                <input
                  value={row.group}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, group: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="그룹"
                />
              )}
              <input
                value={row.title}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, title: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (variant === "plain") {
    return (
      <div className="settings-pane">
        <h3>{title}</h3>
        {content}
      </div>
    );
  }

  return (
    <details className="panel">
      <summary>{title}</summary>
      {content}
    </details>
  );
}

function SubtopicAdder({
  data,
  topic,
  updateData,
}: {
  data: StudyData;
  topic: StandardTopic;
  updateData: (updater: (current: StudyData) => StudyData) => void;
}) {
  const [input, setInput] = useState("");
  const [dragState, setDragState] = useState<{ sourceId: string; targetId?: string; position?: "before" | "after" | "end" } | null>(null);
  const dragSubtopicId = useRef<string | null>(null);
  const subtopics = data.subtopics.filter((subtopic) => subtopic.standardTopicId === topic.id).sort((a, b) => a.order - b.order);

  const updateSubtopicOrder = (orderedSubtopics: Subtopic[]) => {
    const updates = new Map(orderedSubtopics.map((subtopic, index) => [subtopic.id, index + 1]));
    updateData((current) => ({
      ...current,
      subtopics: current.subtopics.map((subtopic) => {
        const order = updates.get(subtopic.id);
        return order ? { ...subtopic, order } : subtopic;
      }),
    }));
  };

  const startSubtopicDrag = (event: DragEvent<HTMLElement>, subtopic: Subtopic) => {
    dragSubtopicId.current = subtopic.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", subtopic.title);
    const ghost = document.createElement("canvas");
    ghost.width = 1;
    ghost.height = 1;
    event.dataTransfer.setDragImage(ghost, 0, 0);
    setDragState({ sourceId: subtopic.id });
  };

  const getDropPosition = (event: DragEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX > rect.left + rect.width / 2 ? "after" : "before";
  };

  const updateSubtopicDrag = (event: DragEvent<HTMLElement>, targetId?: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const position = targetId ? getDropPosition(event) : "end";
    setDragState((current) => (current ? { ...current, targetId, position } : current));
  };

  const clearSubtopicDrag = () => {
    dragSubtopicId.current = null;
    setDragState(null);
  };

  const dropSubtopic = (event: DragEvent<HTMLElement>, target: Subtopic) => {
    event.preventDefault();
    const sourceId = dragSubtopicId.current;
    const position = getDropPosition(event);
    clearSubtopicDrag();
    if (!sourceId || sourceId === target.id) return;
    const source = subtopics.find((subtopic) => subtopic.id === sourceId);
    if (!source) return;
    const withoutSource = subtopics.filter((subtopic) => subtopic.id !== sourceId);
    const targetIndex = withoutSource.findIndex((subtopic) => subtopic.id === target.id);
    if (targetIndex < 0) return;
    withoutSource.splice(targetIndex + (position === "after" ? 1 : 0), 0, source);
    updateSubtopicOrder(withoutSource);
  };

  const dropSubtopicToEnd = (event: DragEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    const sourceId = dragSubtopicId.current;
    clearSubtopicDrag();
    if (!sourceId) return;
    const source = subtopics.find((subtopic) => subtopic.id === sourceId);
    if (!source || subtopics[subtopics.length - 1]?.id === sourceId) return;
    const withoutSource = subtopics.filter((subtopic) => subtopic.id !== sourceId);
    withoutSource.push(source);
    updateSubtopicOrder(withoutSource);
  };

  const deleteSubtopic = (subtopic: Subtopic) => {
    const linkedRecordCount = getActiveRecords(data).filter((record) => record.subtopicId === subtopic.id).length;
    const message =
      linkedRecordCount > 0
        ? `${subtopic.title} 세부목차를 삭제할까요? 연결된 기록 ${linkedRecordCount}개의 세부목차 연결도 해제됩니다.`
        : `${subtopic.title} 세부목차를 삭제할까요?`;
    if (!window.confirm(message)) return;

    updateData((current) => ({
      ...current,
      subtopics: current.subtopics.filter((item) => item.id !== subtopic.id),
      records: current.records.map((record) =>
        record.subtopicId === subtopic.id ? { ...record, subtopicId: undefined, updatedAt: new Date().toISOString() } : record,
      ),
    }));
  };

  return (
    <details className="subtopic-box">
      <summary>세부목차</summary>
      <div
        className={dragState?.position === "end" ? "tag-list tag-list-drop-end" : "tag-list"}
        onDragOver={(event) => {
          if (event.target !== event.currentTarget) return;
          updateSubtopicDrag(event);
        }}
        onDrop={dropSubtopicToEnd}
      >
        {subtopics.map((subtopic) => (
          <span
            key={subtopic.id}
            className={[
              "soft-tag removable-tag draggable-tag",
              dragState?.sourceId === subtopic.id ? "tag-drag-source" : "",
              dragState?.targetId === subtopic.id ? "tag-drag-target" : "",
              dragState?.targetId === subtopic.id && dragState.position === "after" ? "tag-drag-after" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onDragOver={(event) => updateSubtopicDrag(event, subtopic.id)}
            onDrop={(event) => dropSubtopic(event, subtopic)}
          >
            <span
              className="tag-drag-handle"
              draggable
              onDragStart={(event) => startSubtopicDrag(event, subtopic)}
              onDragEnd={clearSubtopicDrag}
              aria-label={`${subtopic.title} 순서 이동`}
              role="button"
            >
              ☰
            </span>
            <span>{subtopic.title}</span>
            <button type="button" onClick={() => deleteSubtopic(subtopic)} aria-label={`${subtopic.title} 삭제`}>
              ×
            </button>
          </span>
        ))}
      </div>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder="세부목차를 줄 단위로 추가" />
      <button
        className="secondary-button compact"
        onClick={() => {
          const rows = parseOutline(input);
          if (rows.length === 0) return;
          updateData((current) => {
            let order = current.subtopics
              .filter((subtopic) => subtopic.standardTopicId === topic.id)
              .reduce((max, subtopic) => Math.max(max, subtopic.order), 0);
            const created: Subtopic[] = rows.map((row) => ({
              id: createId("sub"),
              standardTopicId: topic.id,
              title: row.title,
              order: (order += 1),
            }));
            return { ...current, subtopics: [...current.subtopics, ...created] };
          });
          setInput("");
        }}
      >
        세부목차 추가
      </button>
    </details>
  );
}

function ProgressSelector({ value, onChange }: { value: ProgressStatus; onChange: (value: ProgressStatus) => void }) {
  return (
    <div className="progress-selector" aria-label="진도 상태">
      <button className={value === "not-started" ? "status-chip not-started active" : "status-chip not-started"} onClick={() => onChange("not-started")}>
        시작전
      </button>
      <button className={value === "in-progress" ? "status-chip in-progress active" : "status-chip in-progress"} onClick={() => onChange("in-progress")}>
        진행중
      </button>
      <button className={value === "done" ? "status-chip done active" : "status-chip done"} onClick={() => onChange("done")}>
        완료
      </button>
    </div>
  );
}

function ProgressBar({ topics }: { topics: MaterialTopic[] }) {
  const done = topics.filter((topic) => topic.progress === "done").length;
  const percent = topics.length === 0 ? 0 : Math.round((done / topics.length) * 100);
  return (
    <div className="progress-row">
      <div className="tiny-progress" aria-label={`진도 ${done}/${topics.length}`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <span className="progress-count">{done}/{topics.length}</span>
    </div>
  );
}

function TagSelector({
  data,
  selected,
  onChange,
  onDeleteTag,
}: {
  data: StudyData;
  selected: string[];
  onChange: (tags: string[]) => void;
  onDeleteTag?: (tag: string) => void;
}) {
  const [newTag, setNewTag] = useState("");
  const options = Array.from(new Set([...getAllRecordTags(data), ...selected]));
  const customTags = options.filter((tag) => !DEFAULT_RECORD_TAGS.includes(tag));
  const toggle = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter((item) => item !== tag) : normalizeTags([...selected, tag]));
  };
  const addTag = () => {
    const tag = normalizeTag(newTag);
    if (!tag) return;
    onChange(normalizeTags([...selected, tag]));
    setNewTag("");
  };
  const deleteTag = (tag: string) => {
    if (!window.confirm(`${tag} 태그를 모든 기록에서 삭제할까요?`)) return;
    onDeleteTag?.(tag);
  };

  return (
    <details className="tag-editor-details wide-field">
      <summary>
        <span>태그</span>
        <span className="tag-summary-text">{selected.length === 0 ? "없음" : selected.join(", ")}</span>
      </summary>
      {selected.length > 0 && (
        <div className="tag-chip-row selected-tag-row">
          {selected.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip removable-tag-chip"
              onClick={() => toggle(tag)}
              aria-label={`${tag} 태그 해제`}
            >
              {tag} ×
            </button>
          ))}
        </div>
      )}
      <div className="tag-picker">
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            className={selected.includes(tag) ? "tag-choice active" : "tag-choice"}
            onClick={() => toggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="inline-form tag-add-form">
        <input
          value={newTag}
          onChange={(event) => setNewTag(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder="새 태그"
        />
        <button type="button" className="secondary-button" onClick={addTag}>
          태그 추가
        </button>
      </div>
      {customTags.length > 0 && onDeleteTag && (
        <details className="tag-delete-details">
          <summary>사용자 태그 삭제</summary>
          <div className="tag-picker">
            {customTags.map((tag) => (
              <button key={tag} type="button" className="tag-choice danger-tag-choice" onClick={() => deleteTag(tag)}>
                {tag} 삭제
              </button>
            ))}
          </div>
        </details>
      )}
    </details>
  );
}

function TagChipRow({ tags }: { tags: string[] }) {
  return (
    <div className="tag-chip-row">
      {tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
        </span>
      ))}
    </div>
  );
}

function BulkRecordToolbar({
  data,
  selectedCount,
  filteredCount,
  selectedRecordIds,
  onSelectAll,
  onClearSelection,
  onPatch,
  onAddTag,
  onRemoveTag,
  onMoveToTrash,
}: {
  data: StudyData;
  selectedCount: number;
  filteredCount: number;
  selectedRecordIds: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onPatch: (patch: Partial<StudyRecord>) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onMoveToTrash: () => void;
}) {
  const [studyState, setStudyState] = useState<StudyState>("미확인");
  const [recordType, setRecordType] = useState<RecordType>("일반메모");
  const [tag, setTag] = useState(DEFAULT_RECORD_TAGS[0]);
  const [subjectId, setSubjectId] = useState("");
  const [standardTopicId, setStandardTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [materialTopicId, setMaterialTopicId] = useState("");
  const tagOptions = getAllRecordTags(data);
  const standardOptions = data.standardTopics.filter((topic) => !subjectId || topic.subjectId === subjectId);
  const subtopicOptions = data.subtopics.filter((subtopic) => !standardTopicId || subtopic.standardTopicId === standardTopicId);
  const materialOptions = data.materials.filter((material) => !subjectId || materialHasSubject(material, subjectId));
  const materialTopicOptions = data.materialTopics.filter((topic) => !materialId || topic.materialId === materialId);
  const disabled = selectedCount === 0;

  const patchLocation = () => {
    onPatch({
      subjectId: subjectId || undefined,
      standardTopicId: standardTopicId || undefined,
      subtopicId: subtopicId || undefined,
      materialId: materialId || undefined,
      materialTopicId: materialTopicId || undefined,
    });
  };

  return (
    <section className="panel bulk-toolbar">
      <div className="section-heading">
        <h2>일괄 작업 · {selectedCount}개 선택</h2>
        <div className="action-row wrap">
          <button className="secondary-button compact" disabled={filteredCount === 0} onClick={onSelectAll}>
            필터 결과 전체 선택
          </button>
          <button className="secondary-button compact" disabled={selectedRecordIds.length === 0} onClick={onClearSelection}>
            선택 해제
          </button>
        </div>
      </div>

      <div className="bulk-grid">
        <label className="field-label">
          학습상태
          <select value={studyState} onChange={(event) => setStudyState(event.target.value as StudyState)}>
            {STUDY_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary-button" disabled={disabled} onClick={() => onPatch({ studyState })}>
          학습상태 변경
        </button>
        <label className="field-label">
          기록유형
          <select value={recordType} onChange={(event) => setRecordType(event.target.value as RecordType)}>
            {RECORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary-button" disabled={disabled} onClick={() => onPatch({ type: recordType })}>
          유형 변경
        </button>
        <label className="field-label">
          태그
          <input value={tag} onChange={(event) => setTag(event.target.value)} list="bulk-tag-list" />
          <datalist id="bulk-tag-list">
            {tagOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
        <div className="action-row wrap">
          <button className="secondary-button" disabled={disabled} onClick={() => onAddTag(tag)}>
            태그 추가
          </button>
          <button className="secondary-button" disabled={disabled} onClick={() => onRemoveTag(tag)}>
            태그 제거
          </button>
        </div>
      </div>

      <details className="settings-details">
        <summary>연결 정보 일괄 변경</summary>
        <div className="bulk-grid">
          <Select
            label="과목"
            value={subjectId}
            onChange={(value) => {
              setSubjectId(value);
              setStandardTopicId("");
              setSubtopicId("");
              setMaterialId("");
              setMaterialTopicId("");
            }}
          >
            <option value="">선택 안 함</option>
            {data.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
          <Select
            label="표준목차"
            value={standardTopicId}
            onChange={(value) => {
              setStandardTopicId(value);
              setSubtopicId("");
            }}
          >
            <option value="">선택 안 함</option>
            {standardOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.group} · {formatOrder(topic.order, topic.title)}
              </option>
            ))}
          </Select>
          <Select label="세부목차" value={subtopicId} onChange={setSubtopicId}>
            <option value="">선택 안 함</option>
            {subtopicOptions.map((subtopic) => (
              <option key={subtopic.id} value={subtopic.id}>
                {subtopic.title}
              </option>
            ))}
          </Select>
          <Select
            label="자료"
            value={materialId}
            onChange={(value) => {
              setMaterialId(value);
              setMaterialTopicId("");
            }}
          >
            <option value="">선택 안 함</option>
            {materialOptions.map((material) => (
              <option key={material.id} value={material.id}>
                {material.title}
              </option>
            ))}
          </Select>
          <Select label="자료 목차" value={materialTopicId} onChange={setMaterialTopicId}>
            <option value="">선택 안 함</option>
            {materialTopicOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {formatOrder(topic.order, topic.title)}
              </option>
            ))}
          </Select>
          <button className="secondary-button" disabled={disabled} onClick={patchLocation}>
            연결 변경
          </button>
        </div>
      </details>

      <div className="action-row wrap">
        <button className="secondary-button" disabled={disabled} onClick={() => onPatch({ useReviewCard: true })}>
          복습 카드 ON
        </button>
        <button className="secondary-button" disabled={disabled} onClick={() => onPatch({ useReviewCard: false })}>
          복습 카드 OFF
        </button>
        <button className="danger-button" disabled={disabled} onClick={onMoveToTrash}>
          휴지통으로 이동
        </button>
      </div>
    </section>
  );
}

function TrashRecordList({
  data,
  records,
  onRestore,
  onPermanentDelete,
}: {
  data: StudyData;
  records: StudyRecord[];
  onRestore: (recordId: string) => void;
  onPermanentDelete: (recordId: string) => void;
}) {
  if (records.length === 0) return <EmptyPanel title="휴지통 비어 있음" text="삭제된 기록이 없습니다." />;

  return (
    <div className="record-list">
      {records.map((record) => (
        <article key={record.id} id={`record-${record.id}`} className="record-card trash-record-card">
          <div className="record-card-top">
            <div className="record-chip-row">
              <span className="record-chip type-pill">{record.type}</span>
              <span className="record-chip state-pill">{record.studyState}</span>
              <span className="record-chip state-pill">삭제됨</span>
            </div>
            <div className="action-row wrap">
              <button className="secondary-button compact" onClick={() => onRestore(record.id)}>
                복원
              </button>
              <button className="danger-button compact" onClick={() => onPermanentDelete(record.id)}>
                영구 삭제
              </button>
            </div>
          </div>
          <h3>{record.title}</h3>
          <RecordContentPreview content={record.content} type={record.type} />
          {record.tags && record.tags.length > 0 && <TagChipRow tags={record.tags} />}
          <RecordMeta data={data} record={record} />
          {record.deletedAt && <p className="muted">삭제일 {new Date(record.deletedAt).toLocaleString()}</p>}
        </article>
      ))}
    </div>
  );
}

function RecordList({
  data,
  records,
  onEdit,
  onDelete,
  selectionMode = false,
  selectedRecordIds = [],
  onToggleSelection,
}: {
  data: StudyData;
  records: StudyRecord[];
  onEdit: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
  selectionMode?: boolean;
  selectedRecordIds?: string[];
  onToggleSelection?: (recordId: string) => void;
}) {
  if (records.length === 0) return <EmptyPanel title="기록 없음" text="조건에 맞는 기록이 없습니다." />;

  return (
    <div className="record-list">
      {records.map((record) => (
        <article key={record.id} id={`record-${record.id}`} className="record-card">
          <div className="record-card-top">
            {selectionMode && (
              <label className="record-select-check" aria-label={`${record.title} 선택`}>
                <input
                  type="checkbox"
                  checked={selectedRecordIds.includes(record.id)}
                  onChange={() => onToggleSelection?.(record.id)}
                />
              </label>
            )}
            <div className="record-chip-row">
              <span className="record-chip type-pill">{record.type}</span>
              <span className="record-chip state-pill">{record.studyState}</span>
              {isRecordUncategorized(data, record) && <span className="record-chip state-pill">미분류</span>}
              {record.link && (
                <a className="record-chip link-pill" href={record.link} target="_blank" rel="noreferrer">
                  <LinkIcon />
                  <span>링크</span>
                </a>
              )}
            </div>
            <div className="record-icon-actions">
              <button className="record-icon-button" onClick={() => onEdit(record.id)} aria-label="기록 수정">
                <EditIcon />
              </button>
              {onDelete && (
                <button className="record-icon-button danger-icon-button" onClick={() => onDelete(record.id)} aria-label="기록 삭제">
                  <DeleteIcon />
                </button>
              )}
            </div>
          </div>
          <h3>{record.title}</h3>
          <RecordContentPreview content={record.content} type={record.type} />
          {record.tags && record.tags.length > 0 && <TagChipRow tags={record.tags} />}
          <RecordMeta data={data} record={record} />
        </article>
      ))}
    </div>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4.2 13.9 4 16l2.1-.2 8.6-8.6-1.9-1.9-8.6 8.6Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m11.7 4.2 1-1c.7-.7 1.7-.7 2.4 0l1.7 1.7c.7.7.7 1.7 0 2.4l-1 1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4.5 6h11" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M8 6V4.7c0-.7.5-1.2 1.2-1.2h1.6c.7 0 1.2.5 1.2 1.2V6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m6 6 .7 9.1c.1.8.7 1.4 1.5 1.4h3.6c.8 0 1.5-.6 1.5-1.4L14 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M8.8 9v4.4M11.2 9v4.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M8.4 11.6a3 3 0 0 0 4.2 0l2.2-2.2a3 3 0 0 0-4.2-4.2l-1 1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M11.6 8.4a3 3 0 0 0-4.2 0l-2.2 2.2a3 3 0 0 0 4.2 4.2l1-1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function RecordContentPreview({ content, type }: { content: string; type: RecordType }) {
  const [expanded, setExpanded] = useState(false);
  const normalizedContent = content || "내용 없음";
  const lineCount = normalizedContent.split(/\r\n|\r|\n/).length;
  const hasMore = content.length > 220 || lineCount > 4;
  const contentClassName = [
    expanded || !hasMore ? "record-content expanded" : "record-content preview",
    type === "회계처리" ? "accounting-entry-content" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <p className={contentClassName}>{normalizedContent}</p>
      {hasMore && (
        <button
          type="button"
          className="text-button compact record-expand-button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}

function RecordMiniList({ data, records }: { data: StudyData; records: StudyRecord[] }) {
  return (
    <div className="simple-list">
      {records.map((record) => (
        <button key={record.id} className="list-button" onClick={() => navigateToRecord(record)}>
          <strong>{record.title}</strong>
          <span>{getRecordPath(data, record)}</span>
        </button>
      ))}
    </div>
  );
}

function RecordMeta({ data, record }: { data: StudyData; record: StudyRecord }) {
  return <div className="record-meta">{getRecordPath(data, record)}</div>;
}

function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  action,
  brandIcon = false,
  onBreadcrumbClick,
  compact = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  action?: JSX.Element;
  brandIcon?: boolean;
  onBreadcrumbClick?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const headerClassName = ["page-header", compact ? "compact-page-header" : "", className || ""]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      <div>
        {eyebrow && onBreadcrumbClick ? (
          <button className="breadcrumb-button" onClick={onBreadcrumbClick}>
            {eyebrow}
          </button>
        ) : eyebrow ? (
          <p className="eyebrow">{eyebrow}</p>
        ) : null}
        <div className="page-title-row">
          {brandIcon && <CoralCrowLogo className="page-title-logo" />}
          <h1>{title}</h1>
        </div>
        {meta && <p className="page-meta">{meta}</p>}
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </header>
  );
}

function Widget({
  title,
  children,
  onTitleClick,
  titleActionLabel,
}: {
  title: string;
  children: ReactNode;
  onTitleClick?: () => void;
  titleActionLabel?: string;
}) {
  return (
    <section className="widget">
      <h2>
        {onTitleClick ? (
          <button type="button" className="widget-title-button" onClick={onTitleClick} aria-label={titleActionLabel || title}>
            {title}
          </button>
        ) : (
          title
        )}
      </h2>
      {children}
    </section>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="empty-text">{children}</p>;
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-panel">
      <CoralCrowLogo className="empty-mascot" />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="field-label">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function ConfirmModal({
  title,
  text,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel small-modal">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>
            취소
          </button>
          <button className={danger ? "danger-button" : "primary-button"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SyncModal({
  authSession,
  syncMessage,
  onClose,
  onSignIn,
  onSignUp,
  onSignOut,
  onReloadCloud,
  onSaveCloud,
}: {
  authSession: AuthSession | null;
  syncMessage: string;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onReloadCloud: () => Promise<void>;
  onSaveCloud: () => Promise<void>;
}) {
  const [email, setEmail] = useState(authSession?.user.email || "");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (mode: "signin" | "signup") => {
    if (!email.trim() || !password) {
      setStatus("이메일과 비밀번호를 입력하세요.");
      return;
    }
    if (mode === "signup") {
      if (!INVITE_CODE) {
        setStatus(`초대코드 설정이 아직 완료되지 않았습니다. ${INVITE_SIGNUP_NOTICE}`);
        return;
      }
      if (normalizeInviteCode(inviteCode) !== normalizeInviteCode(INVITE_CODE)) {
        setStatus(`초대코드를 확인해주세요. ${INVITE_SIGNUP_NOTICE}`);
        return;
      }
    }
    setSubmitting(true);
    setStatus("");
    try {
      if (mode === "signin") {
        await onSignIn(email.trim(), password);
        setStatus("로그인했습니다.");
      } else {
        await onSignUp(email.trim(), password);
        setStatus("회원가입을 처리했습니다.");
      }
      setPassword("");
      setInviteCode("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "동기화 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    setSubmitting(true);
    setStatus("");
    try {
      await onSignOut();
      setStatus("로그아웃했습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "로그아웃에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const reloadCloud = async () => {
    setSubmitting(true);
    setStatus("");
    try {
      await onReloadCloud();
      setStatus("클라우드 데이터를 다시 불러왔습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "클라우드 데이터를 불러오지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveCloud = async () => {
    setSubmitting(true);
    setStatus("");
    try {
      await onSaveCloud();
      setStatus("현재 데이터를 클라우드에 저장했습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "클라우드에 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel small-modal">
        <div className="modal-header">
          <h2>클라우드 동기화</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <p className="soft-notice">Supabase 환경변수를 설정하면 로그인 동기화를 사용할 수 있습니다.</p>
        ) : authSession ? (
          <>
            <p>{authSession.user.email || "로그인 계정"}으로 연결되어 있습니다.</p>
            {syncMessage && <p className="muted">{syncMessage}</p>}
            {status && <p className="muted">{status}</p>}
            <div className="modal-actions sync-modal-actions">
              <button className="secondary-button" onClick={reloadCloud} disabled={submitting}>
                클라우드 불러오기
              </button>
              <button className="primary-button" onClick={saveCloud} disabled={submitting}>
                현재 데이터 저장
              </button>
              <button className="danger-button sync-modal-logout-button" onClick={signOut} disabled={submitting}>
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="sync-modal-description">
              동일한 계정으로 로그인하면 PC와 모바일에서 학습 데이터를 동기화해 관리할 수 있습니다.
            </p>
            <label className="field-label sync-modal-field">
              <span>
                이메일 <span className="required-mark" aria-hidden="true">*</span>
              </span>
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="field-label sync-modal-field">
              <span>
                비밀번호 <span className="required-mark" aria-hidden="true">*</span>
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="field-label sync-modal-field">
              초대코드
              <input
                type="text"
                autoComplete="off"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </label>
            {syncMessage && <p className="muted">{syncMessage}</p>}
            {status && <p className="muted">{status}</p>}
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => submit("signup")} disabled={submitting}>
                회원가입
              </button>
              <button className="primary-button" onClick={() => submit("signin")} disabled={submitting}>
                로그인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState("");
  const shareUrl = `${window.location.origin}${window.location.pathname}#/dashboard`;

  const shareLink = async () => {
    const payload = {
      title: "금공러",
      text: "금공러 학습관리 앱 링크",
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setStatus("링크를 복사했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("자동 공유가 안 되면 아래 링크를 복사해서 전달하세요.");
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel small-modal">
        <div className="modal-header">
          <h2>앱 링크 공유</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <p>
          현재 앱 링크를 공유합니다. 로그인 동기화를 켜면 같은 계정으로 컴퓨터와 휴대폰에서 같은 데이터를 사용할 수
          있습니다. 로그인을 쓰지 않을 때는 백업 파일로 데이터를 옮기세요.
        </p>
        <label className="field-label">
          공유 링크
          <input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} />
        </label>
        {status && <p className="muted">{status}</p>}
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            확인
          </button>
          <button className="primary-button" onClick={shareLink}>
            앱 링크 공유
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}

type SearchResult = {
  id: string;
  type: "과목" | "목차" | "세부목차" | "자료" | "자료목차" | "기록";
  title: string;
  subtitle: string;
  onOpen: () => void;
};

function SearchModal({ data, onClose }: { data: StudyData; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = buildSearchResults(data, query).slice(0, 80);

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus({ preventScroll: true });
    window.requestAnimationFrame(focusInput);
    window.setTimeout(focusInput, 80);
  }, []);

  const openResult = (result: SearchResult) => {
    result.onOpen();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-panel search-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>전체 검색</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <input
          ref={inputRef}
          autoFocus
          type="search"
          inputMode="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="과목, 목차, 자료, 기록, 태그 검색"
        />
        <div className="search-result-list">
          {normalizeSearchText(query) && results.length === 0 ? (
            <EmptyText>검색 결과가 없습니다.</EmptyText>
          ) : !normalizeSearchText(query) ? (
            <EmptyText>검색어를 입력하세요. Ctrl+K 또는 Cmd+K로 다시 열 수 있습니다.</EmptyText>
          ) : (
            results.map((result) => (
              <button key={result.id} className="search-result-row" onClick={() => openResult(result)}>
                <span className="record-chip type-pill">{result.type}</span>
                <strong>{result.title}</strong>
                <small>{result.subtitle}</small>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultReviewCardValue(type: RecordType) {
  return REVIEW_CARD_DEFAULT_BY_TYPE[type] ?? false;
}

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ");
}

function normalizeTags(tags: string[] | undefined) {
  return Array.from(new Set((tags || []).map(normalizeTag).filter(Boolean)));
}

function getAllRecordTags(data: StudyData) {
  return Array.from(new Set([...DEFAULT_RECORD_TAGS, ...data.records.flatMap((record) => normalizeTags(record.tags))]));
}

function removeTagFromAllRecords(data: StudyData, tag: string) {
  const normalizedTag = normalizeTag(tag);
  const now = new Date().toISOString();
  return {
    ...data,
    records: data.records.map((record) => {
      const nextTags = normalizeTags(record.tags).filter((item) => item !== normalizedTag);
      if (arraysEqual(nextTags, normalizeTags(record.tags))) return record;
      return { ...record, tags: nextTags, updatedAt: now };
    }),
  };
}

function isRecordDeleted(record: StudyRecord) {
  return Boolean(record.deletedAt);
}

function getActiveRecords(data: StudyData) {
  return data.records.filter((record) => !isRecordDeleted(record));
}

function sortRecordsBySubtopicOrder(records: StudyRecord[], subtopics: Subtopic[]) {
  const subtopicOrder = new Map(subtopics.map((subtopic, index) => [subtopic.id, { order: subtopic.order, index }]));

  return records
    .map((record, index) => ({ record, index }))
    .sort((a, b) => {
      const aOrder = a.record.subtopicId ? subtopicOrder.get(a.record.subtopicId) : undefined;
      const bOrder = b.record.subtopicId ? subtopicOrder.get(b.record.subtopicId) : undefined;

      if (aOrder && bOrder) {
        if (aOrder.order !== bOrder.order) return aOrder.order - bOrder.order;
        if (aOrder.index !== bOrder.index) return aOrder.index - bOrder.index;
        return a.index - b.index;
      }
      if (aOrder) return -1;
      if (bOrder) return 1;
      return a.index - b.index;
    })
    .map((item) => item.record);
}

function isRecordUncategorized(data: StudyData, record: StudyRecord) {
  const hasSubject = Boolean(record.subjectId && data.subjects.some((subject) => subject.id === record.subjectId));
  const hasStandard = Boolean(record.standardTopicId && data.standardTopics.some((topic) => topic.id === record.standardTopicId));
  const hasMaterial = Boolean(record.materialId && data.materials.some((material) => material.id === record.materialId));
  const hasSubtopic = !record.subtopicId || data.subtopics.some((subtopic) => subtopic.id === record.subtopicId);
  const hasMaterialTopic =
    !record.materialTopicId || data.materialTopics.some((topic) => topic.id === record.materialTopicId);
  return !hasSubject || !hasStandard || !hasMaterial || !hasSubtopic || !hasMaterialTopic;
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, "").toLocaleLowerCase();
}

function includesSearch(haystack: Array<string | undefined>, needle: string) {
  const normalized = normalizeSearchText(haystack.filter(Boolean).join(" "));
  return normalized.includes(needle);
}

function navigateToRecord(record: StudyRecord) {
  writeSessionJson(SESSION_KEYS.recordFilters, createEmptyRecordFilters());
  writeSessionValue(SESSION_KEYS.focusRecordId, record.id);
  navigate("records");
}

function buildSearchResults(data: StudyData, query: string): SearchResult[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [];
  const results: SearchResult[] = [];

  data.subjects.forEach((subject) => {
    if (!includesSearch([subject.name], needle)) return;
    results.push({
      id: `subject-${subject.id}`,
      type: "과목",
      title: subject.name,
      subtitle: "과목",
      onOpen: () => navigate(`subjects/${subject.id}`),
    });
  });

  data.standardTopics.forEach((topic) => {
    const subject = data.subjects.find((item) => item.id === topic.subjectId);
    if (!includesSearch([subject?.name, topic.group, topic.title], needle)) return;
    results.push({
      id: `standard-${topic.id}`,
      type: "목차",
      title: formatOrder(topic.order, topic.title),
      subtitle: [subject?.name, topic.group].filter(Boolean).join(" > "),
      onOpen: () => navigate(`subjects/${topic.subjectId}/topics/${topic.id}`),
    });
  });

  data.subtopics.forEach((subtopic) => {
    const standard = data.standardTopics.find((topic) => topic.id === subtopic.standardTopicId);
    const subject = standard ? data.subjects.find((item) => item.id === standard.subjectId) : undefined;
    if (!includesSearch([subject?.name, standard?.group, standard?.title, subtopic.title], needle)) return;
    results.push({
      id: `subtopic-${subtopic.id}`,
      type: "세부목차",
      title: subtopic.title,
      subtitle: [subject?.name, standard?.group, standard?.title].filter(Boolean).join(" > "),
      onOpen: () => {
        if (standard) navigate(`subjects/${standard.subjectId}/topics/${standard.id}`);
      },
    });
  });

  data.materials.forEach((material) => {
    const subjectNames = getMaterialSubjectIds(material).map((subjectId) => getSubjectName(data, subjectId));
    if (!includesSearch([material.title, material.statusLabel, ...subjectNames], needle)) return;
    results.push({
      id: `material-${material.id}`,
      type: "자료",
      title: material.title,
      subtitle: [material.statusLabel, subjectNames.join(", ")].filter(Boolean).join(" · "),
      onOpen: () => navigate(`materials/${material.id}`),
    });
  });

  data.materialTopics.forEach((topic) => {
    const material = data.materials.find((item) => item.id === topic.materialId);
    if (!includesSearch([material?.title, topic.title], needle)) return;
    results.push({
      id: `material-topic-${topic.id}`,
      type: "자료목차",
      title: formatOrder(topic.order, topic.title),
      subtitle: material?.title || "자료",
      onOpen: () => {
        writeSessionValue(SESSION_KEYS.lastMaterialTopicId, topic.id);
        writeSessionValue(SESSION_KEYS.focusMaterialTopicId, topic.id);
        navigate(`materials/${topic.materialId}`);
      },
    });
  });

  getActiveRecords(data).forEach((record) => {
    if (!includesSearch([record.title, record.content, record.link, getRecordPath(data, record), ...(record.tags || [])], needle)) {
      return;
    }
    results.push({
      id: `record-${record.id}`,
      type: "기록",
      title: record.title,
      subtitle: getRecordPath(data, record),
      onOpen: () => navigateToRecord(record),
    });
  });

  return results;
}

function getQuickRecordContext(path: string, data: StudyData): RecordModalContext {
  const segments = path.split("/").filter(Boolean);
  const page = segments[0] || "dashboard";
  if (page === "subjects" && segments[1]) {
    return {
      mode: "create",
      subjectId: data.subjects.some((subject) => subject.id === segments[1]) ? segments[1] : undefined,
      standardTopicId: data.standardTopics.some((topic) => topic.id === segments[3]) ? segments[3] : undefined,
    };
  }
  if (page === "materials" && segments[1]) {
    const material = data.materials.find((item) => item.id === segments[1]);
    const topicId = readSessionValue(SESSION_KEYS.lastMaterialTopicId);
    const materialTopic = data.materialTopics.find((topic) => topic.id === topicId && topic.materialId === material?.id);
    const contextSubjectId = segments[2] && material && materialHasSubject(material, segments[2]) ? segments[2] : undefined;
    return {
      mode: "create",
      subjectId: contextSubjectId,
      materialId: material?.id,
      materialTopicId: materialTopic?.id,
      candidateStandardTopicIds: materialTopic
        ? data.mappings.filter((mapping) => mapping.materialTopicId === materialTopic.id).map((mapping) => mapping.standardTopicId)
        : undefined,
    };
  }
  if (page === "records") {
    const filters = normalizeRecordFilters(readSessionJson<Partial<RecordFilters>>(SESSION_KEYS.recordFilters, createEmptyRecordFilters()));
    return {
      mode: "create",
      subjectId: filters.subjectIds.length === 1 ? filters.subjectIds[0] : undefined,
      standardTopicId: filters.standardTopicIds.length === 1 ? filters.standardTopicIds[0] : undefined,
      materialId: filters.materialIds.length === 1 ? filters.materialIds[0] : undefined,
      materialTopicId: filters.materialTopicIds.length === 1 ? filters.materialTopicIds[0] : undefined,
    };
  }
  return { mode: "create" };
}

function isSubjectVisibleOnDashboard(subject: Subject) {
  return subject.showOnDashboard ?? DEFAULT_DASHBOARD_SUBJECT_IDS.has(subject.id);
}

function unclassifiedTopicId(subjectId: string) {
  return `std-unclassified-${subjectId}`;
}

function replaceSubjectTopics(data: StudyData, subjectId: string, orderedTopics: StandardTopic[]): StudyData {
  const updates = new Map(
    orderedTopics.map((topic, index) => [
      topic.id,
      {
        group: topic.group,
        order: index + 1,
      },
    ]),
  );

  return {
    ...data,
    standardTopics: data.standardTopics.map((topic) => {
      if (topic.subjectId !== subjectId) return topic;
      const update = updates.get(topic.id);
      return update ? { ...topic, ...update } : topic;
    }),
  };
}

function removeStandardTopicsSafely(data: StudyData, subjectId: string, deleteIds: Set<string>): StudyData {
  const now = new Date().toISOString();
  const fallbackId = unclassifiedTopicId(subjectId);
  const deletedSubtopicIds = new Set(
    data.subtopics.filter((subtopic) => deleteIds.has(subtopic.standardTopicId)).map((subtopic) => subtopic.id),
  );
  const remainingSubjectTopics = data.standardTopics
    .filter((topic) => topic.subjectId === subjectId && !deleteIds.has(topic.id))
    .sort((a, b) => a.order - b.order);
  const needsFallback = !remainingSubjectTopics.some((topic) => topic.id === fallbackId);
  const fallbackTopic: StandardTopic = {
    id: fallbackId,
    subjectId,
    group: "미분류",
    title: "연결 해제",
    order: remainingSubjectTopics.length + 1,
  };
  const nextSubjectTopics = needsFallback ? [...remainingSubjectTopics, fallbackTopic] : remainingSubjectTopics;
  const orderedUpdates = new Map(
    nextSubjectTopics.map((topic, index) => [
      topic.id,
      {
        group: topic.group,
        order: index + 1,
      },
    ]),
  );

  const nextStandardTopics = [
    ...data.standardTopics.filter((topic) => topic.subjectId !== subjectId),
    ...nextSubjectTopics.map((topic) => {
      const update = orderedUpdates.get(topic.id);
      return update ? { ...topic, ...update } : topic;
    }),
  ];

  return {
    ...data,
    standardTopics: nextStandardTopics,
    subtopics: data.subtopics.filter((subtopic) => !deleteIds.has(subtopic.standardTopicId)),
    mappings: data.mappings.filter((mapping) => !deleteIds.has(mapping.standardTopicId)),
    records: data.records.map((record) => {
      if (record.standardTopicId && deleteIds.has(record.standardTopicId)) {
        return {
          ...record,
          standardTopicId: fallbackId,
          subtopicId: undefined,
          updatedAt: now,
        };
      }
      if (record.subtopicId && deletedSubtopicIds.has(record.subtopicId)) {
        return {
          ...record,
          subtopicId: undefined,
          updatedAt: now,
        };
      }
      return record;
    }),
  };
}

function moveRecordToTrash(data: StudyData, recordId: string) {
  return moveRecordsToTrash(data, new Set([recordId]));
}

function moveRecordsToTrash(data: StudyData, recordIds: Set<string>) {
  const now = new Date().toISOString();
  return {
    ...data,
    records: data.records.map((record) =>
      recordIds.has(record.id) ? { ...record, deletedAt: record.deletedAt || now, updatedAt: now } : record,
    ),
  };
}

function restoreRecordFromTrash(data: StudyData, recordId: string) {
  return {
    ...data,
    records: data.records.map((record) =>
      record.id === recordId ? { ...record, deletedAt: undefined, updatedAt: new Date().toISOString() } : record,
    ),
  };
}

function permanentlyDeleteRecordById(data: StudyData, recordId: string) {
  return {
    ...data,
    records: data.records.filter((record) => record.id !== recordId),
  };
}

function confirmAndDeleteRecord(updateData: (updater: (current: StudyData) => StudyData) => void, recordId: string) {
  if (!window.confirm(RECORD_DELETE_CONFIRM)) return;
  updateData((current) => moveRecordToTrash(current, recordId));
}

function updateMaterialTopicProgress(
  data: StudyData,
  materialId: string,
  materialTopicId: string,
  nextProgress: ProgressStatus,
  contextSubjectId?: string,
) {
  const topic = data.materialTopics.find((item) => item.id === materialTopicId && item.materialId === materialId);
  const material = data.materials.find((item) => item.id === materialId);
  if (!topic || !material) return data;
  const now = new Date().toISOString();
  const date = getLocalDateKey();
  const wasDone = topic.progress === "done";
  const willBeDone = nextProgress === "done";
  const subjectIds = getMaterialSubjectIds(material);
  const subjectId = contextSubjectId && subjectIds.includes(contextSubjectId) ? contextSubjectId : subjectIds[0];
  const completionKey = (row: TodayCompletionLog) => row.date === date && row.resourceChapterId === materialTopicId;
  const materialTopics = data.materialTopics.map((item) => {
    if (item.id !== materialTopicId) return item;
    const completedAt = willBeDone ? item.completedAt || now : undefined;
    return { ...item, progress: nextProgress, updatedAt: now, completedAt };
  });
  let todayCompletions = data.todayCompletions || [];

  if (!wasDone && willBeDone && !todayCompletions.some(completionKey)) {
    todayCompletions = [
      ...todayCompletions,
      {
        id: createId("complete"),
        date,
        subjectId,
        resourceId: material.id,
        resourceChapterId: topic.id,
        resourceTypeCategory: getMaterialCategory(material),
        completedAt: now,
      },
    ];
  }

  if (wasDone && !willBeDone) {
    todayCompletions = todayCompletions.filter((row) => !completionKey(row));
  }

  return {
    ...data,
    materialTopics,
    todayCompletions: pruneTodayCompletionLogs(todayCompletions),
  };
}

function getSubjectName(data: StudyData, subjectId: string) {
  return data.subjects.find((subject) => subject.id === subjectId)?.name || "알 수 없는 과목";
}

function getMaterialSubjectIds(material: Material) {
  return material.subjectIds?.length ? material.subjectIds : material.subjectId ? [material.subjectId] : [];
}

function materialHasSubject(material: Material, subjectId: string) {
  return getMaterialSubjectIds(material).includes(subjectId);
}

function getMaterialCategory(material: Pick<Material, "id" | "category" | "materialType">): MaterialCategory {
  return normalizeMaterialCategory(material.category, material.materialType, material.id);
}

function normalizeMaterialCategory(value: unknown, materialType?: Material["materialType"], materialId?: string): MaterialCategory {
  if (MATERIAL_CATEGORIES.includes(value as MaterialCategory)) return value as MaterialCategory;
  if (materialId && DEFAULT_MATERIAL_CATEGORY_BY_ID[materialId]) return DEFAULT_MATERIAL_CATEGORY_BY_ID[materialId];
  if (materialType === "lecture") return "인강";
  if (materialType === "summary" || materialType === "book") return "이론";
  if (materialType === "workbook") return "문제";
  return "기타";
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pruneTodayCompletionLogs(logs: TodayCompletionLog[]) {
  const today = parseDateOnly(getLocalDateKey());
  if (!today) return logs;
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 6);
  return logs.filter((log) => {
    const date = parseDateOnly(log.date);
    return date ? date >= cutoff && date <= today : false;
  });
}

function getDefaultSubjectMaterialRank(subjectId: string, materialId: string, fallbackIndex: number) {
  const preferredOrder = DEFAULT_SUBJECT_MATERIAL_ORDER[subjectId] || [];
  const preferredIndex = preferredOrder.indexOf(materialId);
  return preferredIndex >= 0 ? preferredIndex + 1 : preferredOrder.length + fallbackIndex + 1;
}

function getSubjectMaterialDisplayRows(data: StudyData, subjectId: string) {
  const settings = data.subjectMaterialSettings || [];
  return data.materials
    .filter((material) => materialHasSubject(material, subjectId))
    .map((material, index) => {
      const setting = settings.find((row) => row.subjectId === subjectId && row.materialId === material.id);
      return {
        material,
        visible: setting?.visible ?? material.showInSubjectView ?? true,
        order: setting?.order ?? getDefaultSubjectMaterialRank(subjectId, material.id, index),
      };
    })
    .sort((a, b) => a.order - b.order || data.materials.indexOf(a.material) - data.materials.indexOf(b.material));
}

function isMaterialVisibleForSubject(data: StudyData, subjectId: string, materialId: string) {
  const row = getSubjectMaterialDisplayRows(data, subjectId).find((item) => item.material.id === materialId);
  return row?.visible ?? false;
}

function upsertSubjectMaterialSetting(
  data: StudyData,
  subjectId: string,
  materialId: string,
  patch: Partial<Pick<SubjectMaterialSetting, "visible" | "order">>,
) {
  const settings = data.subjectMaterialSettings || [];
  const existing = settings.find((setting) => setting.subjectId === subjectId && setting.materialId === materialId);
  const fallbackOrder =
    existing?.order ??
    getSubjectMaterialDisplayRows(data, subjectId).find((row) => row.material.id === materialId)?.order ??
    settings.filter((setting) => setting.subjectId === subjectId).length + 1;
  const nextSetting: SubjectMaterialSetting = {
    subjectId,
    materialId,
    visible: patch.visible ?? existing?.visible ?? true,
    order: patch.order ?? fallbackOrder,
  };

  return {
    ...data,
    subjectMaterialSettings: [
      ...settings.filter((setting) => !(setting.subjectId === subjectId && setting.materialId === materialId)),
      nextSetting,
    ],
  };
}

function setSubjectMaterialVisibility(data: StudyData, subjectId: string, materialId: string, visible: boolean) {
  return upsertSubjectMaterialSetting(data, subjectId, materialId, { visible });
}

function reorderSubjectMaterialSettings(data: StudyData, subjectId: string, sourceMaterialId: string, targetMaterialId: string) {
  const rows = getSubjectMaterialDisplayRows(data, subjectId);
  const sourceIndex = rows.findIndex((row) => row.material.id === sourceMaterialId);
  const targetIndex = rows.findIndex((row) => row.material.id === targetMaterialId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return data;

  const nextRows = [...rows];
  const [moved] = nextRows.splice(sourceIndex, 1);
  nextRows.splice(targetIndex, 0, moved);

  const nextSubjectSettings = nextRows.map((row, index) => ({
    subjectId,
    materialId: row.material.id,
    visible: row.visible,
    order: index + 1,
  }));

  return {
    ...data,
    subjectMaterialSettings: [
      ...(data.subjectMaterialSettings || []).filter((setting) => setting.subjectId !== subjectId),
      ...nextSubjectSettings,
    ],
  };
}

function reorderSubjects(data: StudyData, sourceSubjectId: string, targetSubjectId: string) {
  const sourceIndex = data.subjects.findIndex((subject) => subject.id === sourceSubjectId);
  const targetIndex = data.subjects.findIndex((subject) => subject.id === targetSubjectId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return data;

  const subjects = [...data.subjects];
  const [moved] = subjects.splice(sourceIndex, 1);
  subjects.splice(targetIndex, 0, moved);
  return { ...data, subjects };
}

function getMaterialSubjectSummary(data: StudyData, material: Material) {
  const names = getMaterialSubjectIds(material)
    .map((subjectId) => getSubjectName(data, subjectId))
    .filter(Boolean);
  if (names.length === 0) return "연결 과목 없음";
  return names.length === 1 ? names[0] : `${names[0]} 외 ${names.length - 1}개`;
}

function getMaterialCardMeta(data: StudyData, material: Material) {
  const subjectIds = getMaterialSubjectIds(material);
  const subjectMeta =
    subjectIds.length === 0
      ? ""
      : subjectIds.length === 1
        ? getSubjectName(data, subjectIds[0])
        : `${getSubjectName(data, subjectIds[0])} 외 ${subjectIds.length - 1}개`;
  return [subjectMeta, material.statusLabel].filter(Boolean).join(" · ");
}

function getMaterialDetailMeta(data: StudyData, material: Material) {
  const names = getMaterialSubjectIds(material)
    .map((subjectId) => getSubjectName(data, subjectId))
    .filter(Boolean);
  return [material.statusLabel, ...names].filter(Boolean).join(" · ");
}

function getSubjectMaterialProgressSummary(data: StudyData, subjectId: string) {
  const items = getSubjectMaterialProgressItems(data, subjectId);
  if (items.length === 0) return "표시 자료 없음";
  return items.map((item) => `${item.material.statusLabel || "자료"} ${item.done}/${item.total}`).join(" · ");
}

function getSubjectMaterialProgressItems(data: StudyData, subjectId: string) {
  return getSubjectMaterialDisplayRows(data, subjectId)
    .filter((row) => row.visible)
    .map(({ material }) => {
      const topics = data.materialTopics.filter((topic) => topic.materialId === material.id);
      return {
        material,
        done: topics.filter((topic) => topic.progress === "done").length,
        total: topics.length,
      };
    });
}

function getMaterialName(data: StudyData, materialId?: string) {
  if (!materialId) return "";
  return data.materials.find((material) => material.id === materialId)?.title || "";
}

function getMaterialTopicName(data: StudyData, materialTopicId?: string) {
  if (!materialTopicId) return "";
  const topic = data.materialTopics.find((item) => item.id === materialTopicId);
  return topic ? formatOrder(topic.order, topic.title) : "";
}

function getStandardTopic(data: StudyData, standardTopicId: string) {
  return data.standardTopics.find((topic) => topic.id === standardTopicId);
}

function getSubtopicName(data: StudyData, subtopicId?: string) {
  if (!subtopicId) return "";
  return data.subtopics.find((subtopic) => subtopic.id === subtopicId)?.title || "";
}

function getRecordPath(data: StudyData, record: StudyRecord) {
  const standard = record.standardTopicId ? getStandardTopic(data, record.standardTopicId) : undefined;
  const parts = [
    record.subjectId ? getSubjectName(data, record.subjectId) : "",
    standard ? `${standard.group} > ${standard.title}` : "",
    getSubtopicName(data, record.subtopicId),
    getMaterialName(data, record.materialId),
    getMaterialTopicName(data, record.materialTopicId),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "미분류";
}

function getMappedStandardTopics(data: StudyData, materialTopicId: string) {
  const mappedIds = data.mappings
    .filter((mapping) => mapping.materialTopicId === materialTopicId)
    .map((mapping) => mapping.standardTopicId);
  return data.standardTopics
    .filter((topic) => mappedIds.includes(topic.id))
    .sort((a, b) => a.order - b.order);
}

function getStatusChips(data: StudyData, standardTopicId: string) {
  const standardTopic = data.standardTopics.find((topic) => topic.id === standardTopicId);
  if (!standardTopic) return [];

  const mappedMaterialTopicIds = new Set(
    data.mappings
      .filter((mapping) => mapping.standardTopicId === standardTopicId)
      .map((mapping) => mapping.materialTopicId),
  );
  const groupedByMaterial = new Map<string, { material: Material; topics: MaterialTopic[] }>();

  data.materialTopics
    .filter((topic) => mappedMaterialTopicIds.has(topic.id))
    .forEach((topic) => {
      const material = data.materials.find((item) => item.id === topic.materialId);
      if (!material) return;
      if (!materialHasSubject(material, standardTopic.subjectId)) return;
      if (!isMaterialVisibleForSubject(data, standardTopic.subjectId, material.id)) return;
      const current = groupedByMaterial.get(material.id);
      if (current) {
        current.topics.push(topic);
        return;
      }
      groupedByMaterial.set(material.id, { material, topics: [topic] });
    });

  const rows = Array.from(groupedByMaterial.values())
    .map(({ material, topics }) => {
      const uniqueTopics = Array.from(new Map(topics.map((topic) => [topic.id, topic])).values());
      const total = uniqueTopics.length;
      const done = uniqueTopics.filter((topic) => topic.progress === "done").length;
      const hasStarted = uniqueTopics.some((topic) => topic.progress === "done" || topic.progress === "in-progress");
      if (total === 0 || !hasStarted) return null;
      return {
        material,
        done,
        total,
        status: done === total ? "done" : "in-progress",
      };
    })
    .filter(Boolean) as Array<{ material: Material; done: number; total: number; status: "done" | "in-progress" }>;

  return rows
    .sort((a, b) => {
      const displayRows = getSubjectMaterialDisplayRows(data, standardTopic.subjectId);
      const aOrder = displayRows.findIndex((row) => row.material.id === a.material.id);
      const bOrder = displayRows.findIndex((row) => row.material.id === b.material.id);
      if (aOrder !== bOrder) {
        return (aOrder < 0 ? Number.MAX_SAFE_INTEGER : aOrder) - (bOrder < 0 ? Number.MAX_SAFE_INTEGER : bOrder);
      }
      if (a.status !== b.status) return a.status === "done" ? -1 : 1;
      return a.material.statusLabel.localeCompare(b.material.statusLabel);
    })
    .map(({ material, done, total, status }) => (
      <span
        key={`${standardTopicId}-${material.id}`}
        className={status === "done" ? "status-chip done" : "status-chip in-progress"}
        title={`${material.title} · ${status === "done" ? "완료" : "진행중"} ${done}/${total}`}
      >
        <span className="status-chip-label">{material.statusLabel || "자료"}</span>
        <span className="status-chip-count">{done}/{total}</span>
      </span>
    ));
}

function getUnknownReviewRecords(data: StudyData) {
  return getActiveRecords(data)
    .filter((record) => record.useReviewCard && record.studyState === "모름")
    .sort((a, b) => getReviewSortTime(b) - getReviewSortTime(a));
}

function getStaleReviewRecords(data: StudyData) {
  const now = Date.now();
  const threshold = data.settings.reviewGapDays * DAY_MS;
  return getActiveRecords(data)
    .filter((record) => {
      if (!record.useReviewCard || record.studyState === "모름" || !record.lastReviewedAt) return false;
      const reviewedAt = new Date(record.lastReviewedAt).getTime();
      return Number.isFinite(reviewedAt) && now - reviewedAt >= threshold;
    })
    .sort((a, b) => getReviewSortTime(a) - getReviewSortTime(b));
}

function getReviewSortTime(record: StudyRecord) {
  const time = new Date(record.lastReviewedAt || record.updatedAt || record.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatReviewPause(record: StudyRecord) {
  if (!record.lastReviewedAt) return "복습 기록 없음";
  const reviewedAt = new Date(record.lastReviewedAt).getTime();
  if (!Number.isFinite(reviewedAt)) return "복습일 확인 필요";
  const days = Math.floor((Date.now() - reviewedAt) / DAY_MS);
  if (days <= 0) return "오늘 복습";
  return `${days}일 전 복습`;
}

type DashboardTodoItem = {
  id: string;
  subject: Subject;
  material: Material;
  completedTopic: MaterialTopic;
  nextTopic: MaterialTopic;
  completedAt: string;
};

function getDashboardTodoItems(data: StudyData, dashboardSubjects: Subject[]) {
  if (dashboardSubjects.length === 0) return [];
  const topicsByMaterial = new Map<string, MaterialTopic[]>();
  data.materialTopics.forEach((topic) => {
    const rows = topicsByMaterial.get(topic.materialId) || [];
    rows.push(topic);
    topicsByMaterial.set(topic.materialId, rows);
  });
  topicsByMaterial.forEach((topics) => topics.sort((a, b) => a.order - b.order));

  const subjectGroups = shuffleItems(dashboardSubjects).map((subject) => {
    const subjectCandidates: DashboardTodoItem[] = [];
    const seenNextTopicIds = new Set<string>();
    const visibleMaterials = getSubjectMaterialDisplayRows(data, subject.id)
      .filter((row) => row.visible)
      .map((row) => row.material);
    const completedTopics = visibleMaterials
      .flatMap((material) =>
        (topicsByMaterial.get(material.id) || [])
          .filter((topic) => topic.progress === "done" && topic.completedAt)
          .map((topic) => ({ material, topic })),
      )
      .sort((a, b) => (b.topic.completedAt || "").localeCompare(a.topic.completedAt || ""));

    for (const { material, topic: completedTopic } of completedTopics) {
      const topics = topicsByMaterial.get(material.id) || [];
      const nextTopic = topics.find((topic) => topic.order > completedTopic.order && topic.progress !== "done");
      if (!nextTopic || seenNextTopicIds.has(nextTopic.id)) continue;
      seenNextTopicIds.add(nextTopic.id);
      subjectCandidates.push({
        id: `${subject.id}:${completedTopic.id}:${nextTopic.id}`,
        subject,
        material,
        completedTopic,
        nextTopic,
        completedAt: completedTopic.completedAt || "",
      });
    }

    return {
      subjectId: subject.id,
      candidates: shuffleItems(subjectCandidates),
    };
  });

  const items: DashboardTodoItem[] = [];
  while (items.length < DASHBOARD_TODO_TARGET_COUNT && subjectGroups.some((group) => group.candidates.length > 0)) {
    for (const group of shuffleItems(subjectGroups)) {
      const item = group.candidates.shift();
      if (!item) continue;
      items.push(item);
      if (items.length >= DASHBOARD_TODO_TARGET_COUNT) break;
    }
  }

  return groupTodoItemsByRandomSubjectOrder(items).slice(0, DASHBOARD_TODO_TARGET_COUNT);
}

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function groupTodoItemsByRandomSubjectOrder(items: DashboardTodoItem[]) {
  const subjectOrder = shuffleItems(Array.from(new Set(items.map((item) => item.subject.id))));
  return subjectOrder.flatMap((subjectId) => items.filter((item) => item.subject.id === subjectId));
}

function getReviewGapTopics(data: StudyData) {
  const now = Date.now();
  const threshold = data.settings.reviewGapDays * DAY_MS;
  return data.standardTopics
    .map((topic) => {
      const topicRecords = getActiveRecords(data).filter((record) => record.standardTopicId === topic.id);
      const latest = topicRecords
        .map((record) => new Date(record.updatedAt || record.createdAt).getTime())
        .sort((a, b) => b - a)[0];
      if (!latest) return { topic, age: Number.POSITIVE_INFINITY, message: "아직 기록 없음" };
      const age = now - latest;
      return { topic, age, message: `${Math.floor(age / DAY_MS)}일 공백` };
    })
    .filter((item) => item.age === Number.POSITIVE_INFINITY || item.age >= threshold)
    .sort((a, b) => b.age - a.age);
}

function getPrimaryDDay(data: StudyData) {
  return (data.dDays || []).find((dDay) => dDay.isPrimary && !dDay.hidden && !dDay.completed);
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDDayDiff(value: string) {
  const target = parseDateOnly(value);
  if (!target) return 0;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDDayStatus(value: string) {
  const diff = getDDayDiff(value);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-day";
  return `D+${Math.abs(diff)}`;
}

function formatDateLabel(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

function formatKoreanMonthDay(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatCompletionTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

type TodayCompletionSummaryItem = TodayCompletionLog & {
  subjectId: string;
  subjectName: string;
  material: Material;
  topic: MaterialTopic;
  category: MaterialCategory;
};

function getTodayCompletionSummary(data: StudyData) {
  const today = getLocalDateKey();
  const byTopic = new Map<string, TodayCompletionSummaryItem>();

  (data.todayCompletions || [])
    .filter((log) => log.date === today)
    .forEach((log) => {
      const material = data.materials.find((item) => item.id === log.resourceId);
      const topic = data.materialTopics.find((item) => item.id === log.resourceChapterId && item.materialId === log.resourceId);
      if (!material || !topic || topic.progress !== "done") return;
      const materialSubjectIds = getMaterialSubjectIds(material);
      const subjectId = log.subjectId && materialSubjectIds.includes(log.subjectId) ? log.subjectId : materialSubjectIds[0];
      const subject = data.subjects.find((item) => item.id === subjectId);
      if (!subjectId || !subject) return;
      if (byTopic.has(topic.id)) return;
      byTopic.set(topic.id, {
        ...log,
        subjectId,
        subjectName: subject.name,
        material,
        topic,
        category: getMaterialCategory(material),
      });
    });

  const items = Array.from(byTopic.values()).sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const subjectIds = Array.from(new Set(items.map((item) => item.subjectId)));
  const subjects = data.subjects.filter((subject) => subjectIds.includes(subject.id));
  const subjectTotals: Record<string, number> = Object.fromEntries(subjects.map((subject) => [subject.id, 0]));
  const rows = MATERIAL_CATEGORIES.map((category) => {
    const bySubject: Record<string, number> = Object.fromEntries(subjects.map((subject) => [subject.id, 0]));
    let total = 0;
    items
      .filter((item) => item.category === category)
      .forEach((item) => {
        bySubject[item.subjectId] = (bySubject[item.subjectId] || 0) + 1;
        subjectTotals[item.subjectId] = (subjectTotals[item.subjectId] || 0) + 1;
        total += 1;
      });
    return { category, bySubject, total };
  });

  return {
    total: items.length,
    subjects,
    rows,
    subjectTotals,
    items,
  };
}

function getTodayCompletionTimeRange(items: TodayCompletionSummaryItem[]) {
  const times = items
    .map((item) => ({ raw: item.completedAt, time: Date.parse(item.completedAt) }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => a.time - b.time);
  if (times.length === 0) return null;
  return {
    start: formatCompletionTime(times[0].raw),
    end: formatCompletionTime(times[times.length - 1].raw),
  };
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const result = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    result.set(key, [...(result.get(key) || []), item]);
  }
  return result;
}

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function getTimestamp(value?: string) {
  const time = value ? Date.parse(value) : 0;
  return Number.isFinite(time) ? time : 0;
}

function createEmptySyncPatch(): SyncPatch {
  return {
    subjects: new Set(),
    materials: new Set(),
    subjectMaterialSettings: new Set(),
    materialTopics: new Set(),
    standardTopics: new Set(),
    subtopics: new Set(),
    mappings: new Set(),
    records: new Set(),
    dDays: new Set(),
    todayCompletions: new Set(),
    settings: false,
  };
}

function mergeSyncPatches(current: SyncPatch | null, next: SyncPatch) {
  if (!current) return next;
  const merged = createEmptySyncPatch();
  (Object.keys(merged) as Array<keyof SyncPatch>).forEach((key) => {
    if (key === "settings") {
      merged.settings = current.settings || next.settings;
      return;
    }
    current[key].forEach((value) => merged[key].add(value));
    next[key].forEach((value) => merged[key].add(value));
  });
  return merged;
}

function changedRowKeys<T>(beforeRows: T[], afterRows: T[], getKey: (row: T) => string) {
  const before = new Map(beforeRows.map((row) => [getKey(row), JSON.stringify(row)]));
  const after = new Map(afterRows.map((row) => [getKey(row), JSON.stringify(row)]));
  const keys = new Set([...before.keys(), ...after.keys()]);
  const changed = new Set<string>();
  keys.forEach((key) => {
    if (before.get(key) !== after.get(key)) changed.add(key);
  });
  return changed;
}

function subjectMaterialSettingKey(row: SubjectMaterialSetting) {
  return `${row.subjectId}:${row.materialId}`;
}

function todayCompletionKey(row: TodayCompletionLog) {
  return `${row.date}:${row.resourceChapterId}`;
}

function createSyncPatch(beforeValue: StudyData, afterValue: StudyData) {
  const before = normalizeStudyData(beforeValue);
  const after = normalizeStudyData(afterValue);
  return {
    subjects: changedRowKeys(before.subjects, after.subjects, (row) => row.id),
    materials: changedRowKeys(before.materials, after.materials, (row) => row.id),
    subjectMaterialSettings: changedRowKeys(before.subjectMaterialSettings, after.subjectMaterialSettings, subjectMaterialSettingKey),
    materialTopics: changedRowKeys(before.materialTopics, after.materialTopics, (row) => row.id),
    standardTopics: changedRowKeys(before.standardTopics, after.standardTopics, (row) => row.id),
    subtopics: changedRowKeys(before.subtopics, after.subtopics, (row) => row.id),
    mappings: changedRowKeys(before.mappings, after.mappings, (row) => row.id),
    records: changedRowKeys(before.records, after.records, (row) => row.id),
    dDays: changedRowKeys(before.dDays, after.dDays, (row) => row.id),
    todayCompletions: changedRowKeys(before.todayCompletions, after.todayCompletions, todayCompletionKey),
    settings: JSON.stringify(before.settings) !== JSON.stringify(after.settings),
  };
}

function createFullSyncPatch(data: StudyData) {
  const normalized = normalizeStudyData(data);
  return {
    subjects: new Set(normalized.subjects.map((row) => row.id)),
    materials: new Set(normalized.materials.map((row) => row.id)),
    subjectMaterialSettings: new Set(normalized.subjectMaterialSettings.map(subjectMaterialSettingKey)),
    materialTopics: new Set(normalized.materialTopics.map((row) => row.id)),
    standardTopics: new Set(normalized.standardTopics.map((row) => row.id)),
    subtopics: new Set(normalized.subtopics.map((row) => row.id)),
    mappings: new Set(normalized.mappings.map((row) => row.id)),
    records: new Set(normalized.records.map((row) => row.id)),
    dDays: new Set(normalized.dDays.map((row) => row.id)),
    todayCompletions: new Set(normalized.todayCompletions.map(todayCompletionKey)),
    settings: true,
  };
}

function applyPatchedRows<T>(cloudRows: T[], localRows: T[], changedKeys: Set<string>, getKey: (row: T) => string) {
  const rows = new Map(cloudRows.map((row) => [getKey(row), row]));
  const local = new Map(localRows.map((row) => [getKey(row), row]));
  changedKeys.forEach((key) => {
    const localRow = local.get(key);
    if (localRow) {
      rows.set(key, localRow);
    } else {
      rows.delete(key);
    }
  });
  return Array.from(rows.values());
}

function normalizeMergedDDayPrimary(rows: DDayEvent[]) {
  const primary = rows
    .filter((row) => row.isPrimary)
    .sort((a, b) => getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt))[0];
  return rows.map((row) => ({ ...row, isPrimary: primary ? row.id === primary.id : false }));
}

function mergeStudyDataWithPatch(cloudValue: StudyData, localValue: StudyData, patch: SyncPatch) {
  const cloud = normalizeStudyData(cloudValue);
  const local = normalizeStudyData(localValue);
  const materialTopics = applyPatchedRows(cloud.materialTopics, local.materialTopics, patch.materialTopics, (row) => row.id);

  return normalizeStudyData({
    ...cloud,
    version: Math.max(cloud.version || 1, local.version || 1),
    initializedAt: cloud.initializedAt || local.initializedAt,
    subjects: applyPatchedRows(cloud.subjects, local.subjects, patch.subjects, (row) => row.id),
    materials: applyPatchedRows(cloud.materials, local.materials, patch.materials, (row) => row.id),
    subjectMaterialSettings: applyPatchedRows(
      cloud.subjectMaterialSettings,
      local.subjectMaterialSettings,
      patch.subjectMaterialSettings,
      subjectMaterialSettingKey,
    ),
    materialTopics,
    standardTopics: applyPatchedRows(cloud.standardTopics, local.standardTopics, patch.standardTopics, (row) => row.id),
    subtopics: applyPatchedRows(cloud.subtopics, local.subtopics, patch.subtopics, (row) => row.id),
    mappings: applyPatchedRows(cloud.mappings, local.mappings, patch.mappings, (row) => row.id),
    records: applyPatchedRows(cloud.records, local.records, patch.records, (row) => row.id),
    dDays: normalizeMergedDDayPrimary(applyPatchedRows(cloud.dDays, local.dDays, patch.dDays, (row) => row.id)),
    todayCompletions: applyPatchedRows(cloud.todayCompletions, local.todayCompletions, patch.todayCompletions, todayCompletionKey),
    settings: patch.settings ? local.settings : cloud.settings,
  });
}

function isStudyData(value: unknown): value is StudyData {
  if (!value || typeof value !== "object") return false;
  const data = value as StudyData;
  return (
    Array.isArray(data.subjects) &&
    Array.isArray(data.materials) &&
    Array.isArray(data.materialTopics) &&
    Array.isArray(data.standardTopics) &&
    Array.isArray(data.subtopics) &&
    Array.isArray(data.mappings) &&
    Array.isArray(data.records)
  );
}

function normalizeMaterialTopics(value: unknown, validMaterialIds: Set<string>): MaterialTopic[] {
  if (!Array.isArray(value)) return [];
  const now = new Date().toISOString();
  const seen = new Set<string>();
  return value
    .filter((item): item is Partial<MaterialTopic> => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const progress = PROGRESS_STATUSES.includes(item.progress as ProgressStatus) ? (item.progress as ProgressStatus) : "not-started";
      const updatedAt = typeof item.updatedAt === "string" ? item.updatedAt : now;
      const completedAt =
        progress === "done"
          ? typeof item.completedAt === "string"
            ? item.completedAt
            : updatedAt
          : undefined;
      return {
        id: typeof item.id === "string" ? item.id : createId("material-topic"),
        materialId: typeof item.materialId === "string" ? item.materialId : "",
        title: typeof item.title === "string" ? item.title : "",
        order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
        progress,
        updatedAt,
        completedAt,
        isDefault: Boolean(item.isDefault),
      };
    })
    .filter((item) => item.id && item.materialId && item.title && validMaterialIds.has(item.materialId))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

function normalizeDDays(value: unknown): DDayEvent[] {
  if (!Array.isArray(value)) return [];
  let primarySeen = false;
  return value
    .filter((item): item is Partial<DDayEvent> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const now = new Date().toISOString();
      const isPrimary = Boolean(item.isPrimary) && !primarySeen;
      if (isPrimary) primarySeen = true;
      return {
        id: typeof item.id === "string" && item.id ? item.id : createId("dday"),
        title: typeof item.title === "string" ? item.title : "",
        date: typeof item.date === "string" ? item.date : "",
        description: typeof item.description === "string" ? item.description : "",
        isPrimary,
        hidden: Boolean(item.hidden),
        completed: Boolean(item.completed),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : now,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : now,
      };
    })
    .filter((item) => item.title && item.date);
}

function normalizeTodayCompletionLogs(value: unknown): TodayCompletionLog[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const rows = value
    .filter((item): item is Partial<TodayCompletionLog> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const now = new Date().toISOString();
      return {
        id: typeof item.id === "string" && item.id ? item.id : createId("complete"),
        date: typeof item.date === "string" ? item.date : getLocalDateKey(),
        subjectId: typeof item.subjectId === "string" ? item.subjectId : undefined,
        resourceId: typeof item.resourceId === "string" ? item.resourceId : "",
        resourceChapterId: typeof item.resourceChapterId === "string" ? item.resourceChapterId : "",
        resourceTypeCategory: normalizeMaterialCategory(item.resourceTypeCategory),
        completedAt: typeof item.completedAt === "string" ? item.completedAt : now,
      };
    })
    .filter((item) => item.resourceId && item.resourceChapterId && item.date)
    .filter((item) => {
      const key = `${item.date}:${item.resourceChapterId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return pruneTodayCompletionLogs(rows);
}

function normalizeSubjectMaterialSettings(data: StudyData, materials: Material[]) {
  const validSubjectIds = new Set(data.subjects.map((subject) => subject.id));
  const validMaterialIds = new Set(materials.map((material) => material.id));
  const existingSettings = Array.isArray(data.subjectMaterialSettings) ? data.subjectMaterialSettings : [];
  const existingByKey = new Map(
    existingSettings
      .filter((setting) => validSubjectIds.has(setting.subjectId) && validMaterialIds.has(setting.materialId))
      .map((setting) => [`${setting.subjectId}:${setting.materialId}`, setting]),
  );
  const rows: SubjectMaterialSetting[] = [];

  data.subjects.forEach((subject) => {
    const linkedMaterials = materials.filter((material) => materialHasSubject(material, subject.id));
    const subjectRows = linkedMaterials
      .map((material, index) => {
        const existing = existingByKey.get(`${subject.id}:${material.id}`);
        const defaultVisible = getDefaultSubjectMaterialVisibility(subject.id, material.id, material.showInSubjectView ?? true);
        return {
          subjectId: subject.id,
          materialId: material.id,
          visible: existing?.visible ?? defaultVisible,
          order: existing?.order ?? getDefaultSubjectMaterialRank(subject.id, material.id, index),
        };
      })
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        const aIndex = linkedMaterials.findIndex((material) => material.id === a.materialId);
        const bIndex = linkedMaterials.findIndex((material) => material.id === b.materialId);
        return getDefaultSubjectMaterialRank(subject.id, a.materialId, aIndex) - getDefaultSubjectMaterialRank(subject.id, b.materialId, bIndex);
      });

    rows.push(...subjectRows.map((row, index) => ({ ...row, order: index + 1 })));
  });

  return rows;
}

function isIbkMaterial(materialId: string) {
  return materialId === "material-ibk-400";
}

function getDefaultSubjectMaterialVisibility(subjectId: string, materialId: string, fallback = true) {
  if (isIbkMaterial(materialId)) return subjectId === "subject-economics";
  return fallback;
}

function normalizeStudyData(data: StudyData): StudyData {
  let nextData = data;
  const shouldApplyVersion6Defaults = (nextData.version || 1) < 6;
  const shouldApplyVersion7Defaults = (nextData.version || 1) < 7;
  const shouldApplyVersion8Defaults = (nextData.version || 1) < 8;
  const shouldApplyVersion12Defaults = (nextData.version || 1) < 12;
  if ((nextData.version || 1) < 3) {
    nextData = addDefaultMaterial(nextData, "material-ifrs-intermediate-lecture");
  }
  if ((nextData.version || 1) < 4) {
    nextData = addDefaultSubjectBundle(nextData, "subject-tax");
  }
  if ((nextData.version || 1) < 5) {
    nextData = addDefaultSubjectBundle(addDefaultSubjectBundle(nextData, "subject-management"), "subject-economics");
  }
  if (shouldApplyVersion7Defaults) {
    nextData = addDefaultMaterial(nextData, "material-hwang-public-accounting");
  }
  if (shouldApplyVersion12Defaults) {
    nextData = addDefaultSubtopics(nextData);
  }

  const subjects = nextData.subjects.map((subject) =>
    shouldApplyVersion6Defaults && subject.id === "subject-tax" ? { ...subject, showOnDashboard: false } : subject,
  );
  const validSubjectIds = new Set(subjects.map((subject) => subject.id));
  const materials = nextData.materials.map((material) => {
    const legacySubjectId = material.subjectId;
    const subjectIds = material.subjectIds?.length ? material.subjectIds : legacySubjectId ? [legacySubjectId] : [];
    const normalizedSubjectIds =
      shouldApplyVersion8Defaults && isIbkMaterial(material.id)
        ? [
            ...new Set([
              ...subjectIds,
              "subject-accounting",
              "subject-finance",
              "subject-management",
              "subject-economics",
            ]),
          ]
        : shouldApplyVersion7Defaults && isIbkMaterial(material.id)
          ? [...new Set([...subjectIds, "subject-accounting", "subject-economics"])]
        : shouldApplyVersion6Defaults && isIbkMaterial(material.id)
          ? ["subject-economics"]
          : subjectIds;
    return {
      ...material,
      subjectIds: normalizedSubjectIds.filter((subjectId) => validSubjectIds.has(subjectId)),
      subjectId: undefined,
      category: normalizeMaterialCategory(material.category, material.materialType, material.id),
    };
  });
  const validMaterialIds = new Set(materials.map((material) => material.id));
  const materialTopics = normalizeMaterialTopics(nextData.materialTopics, validMaterialIds);
  const validStandardIds = new Set(nextData.standardTopics.map((topic) => topic.id));
  const validSubtopicIds = new Set(nextData.subtopics.map((subtopic) => subtopic.id));
  const validMaterialTopicIds = new Set(materialTopics.map((topic) => topic.id));
  const materialTopicMaterial = new Map(materialTopics.map((topic) => [topic.id, topic.materialId]));
  const records = nextData.records.map((record) => {
    const materialTopicId =
      record.materialTopicId && validMaterialTopicIds.has(record.materialTopicId) ? record.materialTopicId : undefined;
    const linkedMaterialId = materialTopicId ? materialTopicMaterial.get(materialTopicId) : undefined;
    const materialId =
      linkedMaterialId || (record.materialId && validMaterialIds.has(record.materialId) ? record.materialId : undefined);
    const type = RECORD_TYPES.includes(record.type) ? record.type : "일반메모";
    return {
      ...record,
      type,
      subjectId: record.subjectId && validSubjectIds.has(record.subjectId) ? record.subjectId : undefined,
      standardTopicId:
        record.standardTopicId && validStandardIds.has(record.standardTopicId) ? record.standardTopicId : undefined,
      subtopicId: record.subtopicId && validSubtopicIds.has(record.subtopicId) ? record.subtopicId : undefined,
      materialId,
      materialTopicId,
      tags: normalizeTags(record.tags),
      deletedAt: record.deletedAt || undefined,
      useReviewCard: typeof record.useReviewCard === "boolean" ? record.useReviewCard : getDefaultReviewCardValue(type),
      studyState: STUDY_STATES.includes(record.studyState) ? record.studyState : "미확인",
      knownCount: Number.isFinite(record.knownCount) ? record.knownCount : 0,
      unknownCount: Number.isFinite(record.unknownCount) ? record.unknownCount : 0,
    };
  });

  const subjectMaterialSettings = normalizeSubjectMaterialSettings({ ...nextData, subjects }, materials).map((setting) =>
    shouldApplyVersion8Defaults && isIbkMaterial(setting.materialId)
      ? { ...setting, visible: setting.subjectId === "subject-economics" }
      : setting,
  );

  return {
    ...nextData,
    version: CURRENT_DATA_VERSION,
    subjects,
    materials,
    materialTopics,
    records,
    dDays: normalizeDDays(nextData.dDays),
    todayCompletions: normalizeTodayCompletionLogs(nextData.todayCompletions),
    subjectMaterialSettings,
  };
}

function addDefaultMaterial(data: StudyData, materialId: string): StudyData {
  const defaults = createDefaultStudyData();
  const defaultMaterial = defaults.materials.find((material) => material.id === materialId);
  if (!defaultMaterial) return data;
  const defaultSubjectIds = defaultMaterial.subjectIds.filter((subjectId) =>
    data.subjects.some((subject) => subject.id === subjectId),
  );
  if (defaultSubjectIds.length === 0) return data;

  const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, " ");
  const createMaterialTopicId = (targetMaterialId: string, order: number) =>
    `mt-${targetMaterialId.replace("material-", "")}-${String(order).padStart(2, "0")}`;
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
  const hasId = <T extends { id: string }>(rows: T[], id: string) => rows.some((row) => row.id === id);
  const existingMaterial = data.materials.find(
    (material) => material.id === materialId || normalizeLabel(material.title) === normalizeLabel(defaultMaterial.title),
  );
  const targetMaterialId = existingMaterial?.id || materialId;
  const defaultTopics = defaults.materialTopics.filter((topic) => topic.materialId === materialId);
  const topicAliases = new Map<string, string>();
  const usedTopicIds = new Set(data.materialTopics.map((topic) => topic.id));
  const nextMaterialTopics = [...data.materialTopics];
  defaultTopics.forEach((defaultTopic) => {
    const existingTopic = nextMaterialTopics.find(
      (topic) =>
        topic.id === defaultTopic.id ||
        (topic.materialId === targetMaterialId && normalizeLabel(topic.title) === normalizeLabel(defaultTopic.title)),
    );
    if (existingTopic) {
      topicAliases.set(defaultTopic.id, existingTopic.id);
      return;
    }
    const baseId = targetMaterialId === materialId ? defaultTopic.id : createMaterialTopicId(targetMaterialId, defaultTopic.order);
    const id = createUniqueId(baseId, usedTopicIds);
    usedTopicIds.add(id);
    nextMaterialTopics.push({ ...defaultTopic, id, materialId: targetMaterialId });
    topicAliases.set(defaultTopic.id, id);
  });
  const defaultSettings = defaults.subjectMaterialSettings
    .filter((setting) => setting.materialId === materialId)
    .map((setting) => ({ ...setting, materialId: targetMaterialId }));
  const existingSettingKeys = new Set(
    (data.subjectMaterialSettings || []).map((setting) => `${setting.subjectId}:${setting.materialId}`),
  );
  const defaultTopicIds = new Set(defaultTopics.map((topic) => topic.id));
  const existingMappingKeys = new Set(data.mappings.map((mapping) => `${mapping.materialTopicId}:${mapping.standardTopicId}`));
  const usedMappingIds = new Set(data.mappings.map((mapping) => mapping.id));
  const addedMappings: TopicMapping[] = [];
  defaults.mappings
    .filter((mapping) => defaultTopicIds.has(mapping.materialTopicId))
    .forEach((mapping) => {
      const materialTopicId = topicAliases.get(mapping.materialTopicId) || mapping.materialTopicId;
      const key = `${materialTopicId}:${mapping.standardTopicId}`;
      if (existingMappingKeys.has(key)) return;
      const id = createUniqueId(`map-${materialTopicId}-${mapping.standardTopicId}`, usedMappingIds);
      usedMappingIds.add(id);
      existingMappingKeys.add(key);
      addedMappings.push({ ...mapping, id, materialTopicId });
    });

  return {
    ...data,
    materials: existingMaterial
      ? data.materials.map((material) =>
          material.id === existingMaterial.id
            ? {
                ...material,
                subjectIds: Array.from(new Set([...(material.subjectIds || []), ...defaultSubjectIds])),
                materialType: material.materialType ?? defaultMaterial.materialType,
                progressMode: material.progressMode ?? defaultMaterial.progressMode,
                category: material.category ?? defaultMaterial.category,
                isDefault: material.isDefault ?? defaultMaterial.isDefault,
              }
            : material,
        )
      : [...data.materials, { ...defaultMaterial, subjectIds: defaultSubjectIds }],
    subjectMaterialSettings: [
      ...(data.subjectMaterialSettings || []),
      ...defaultSettings.filter((setting) => !existingSettingKeys.has(`${setting.subjectId}:${setting.materialId}`)),
    ],
    materialTopics: nextMaterialTopics,
    mappings: [...data.mappings, ...addedMappings.filter((mapping) => !hasId(data.mappings, mapping.id))],
  };
}

function addDefaultSubtopics(data: StudyData): StudyData {
  const defaults = createDefaultStudyData();
  const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, " ");
  const validStandardIds = new Set(data.standardTopics.map((topic) => topic.id));
  const existingIds = new Set(data.subtopics.map((subtopic) => subtopic.id));
  const existingKeys = new Set(data.subtopics.map((subtopic) => `${subtopic.standardTopicId}:${normalizeLabel(subtopic.title)}`));
  const addedSubtopics = defaults.subtopics.filter(
    (subtopic) =>
      validStandardIds.has(subtopic.standardTopicId) &&
      !existingIds.has(subtopic.id) &&
      !existingKeys.has(`${subtopic.standardTopicId}:${normalizeLabel(subtopic.title)}`),
  );

  if (addedSubtopics.length === 0) return data;
  return {
    ...data,
    subtopics: [...data.subtopics, ...addedSubtopics],
  };
}

function addDefaultSubjectBundle(data: StudyData, subjectId: string): StudyData {
  const defaults = createDefaultStudyData();
  const defaultSubject = defaults.subjects.find((subject) => subject.id === subjectId);
  if (!defaultSubject) return data;
  if (!data.subjects.some((subject) => subject.id === subjectId)) return data;

  const hasId = <T extends { id: string }>(rows: T[], id: string) => rows.some((row) => row.id === id);
  const defaultMaterialIds = new Set(
    defaults.materials.filter((material) => materialHasSubject(material, subjectId)).map((material) => material.id),
  );
  const defaultStandardIds = new Set(
    defaults.standardTopics.filter((topic) => topic.subjectId === subjectId).map((topic) => topic.id),
  );
  const defaultTopicIds = new Set(
    defaults.materialTopics.filter((topic) => defaultMaterialIds.has(topic.materialId)).map((topic) => topic.id),
  );
  const existingSettingKeys = new Set(
    (data.subjectMaterialSettings || []).map((setting) => `${setting.subjectId}:${setting.materialId}`),
  );
  const hasExistingSubjectMaterialData =
    data.materials.some((material) => materialHasSubject(material, subjectId)) ||
    (data.subjectMaterialSettings || []).some((setting) => setting.subjectId === subjectId);

  return {
    ...data,
    subjects: data.subjects.map((subject) =>
      subject.id === subjectId && !hasExistingSubjectMaterialData
        ? { ...subject, showOnDashboard: defaultSubject.showOnDashboard }
        : subject,
    ),
    materials: [
      ...data.materials,
      ...defaults.materials.filter((material) => defaultMaterialIds.has(material.id) && !hasId(data.materials, material.id)),
    ],
    subjectMaterialSettings: [
      ...(data.subjectMaterialSettings || []),
      ...defaults.subjectMaterialSettings.filter(
        (setting) =>
          setting.subjectId === subjectId &&
          defaultMaterialIds.has(setting.materialId) &&
          !existingSettingKeys.has(`${setting.subjectId}:${setting.materialId}`),
      ),
    ],
    materialTopics: [
      ...data.materialTopics,
      ...defaults.materialTopics.filter((topic) => defaultMaterialIds.has(topic.materialId) && !hasId(data.materialTopics, topic.id)),
    ],
    standardTopics: [
      ...data.standardTopics,
      ...defaults.standardTopics.filter((topic) => topic.subjectId === subjectId && !hasId(data.standardTopics, topic.id)),
    ],
    subtopics: [
      ...data.subtopics,
      ...defaults.subtopics.filter((subtopic) => defaultStandardIds.has(subtopic.standardTopicId) && !hasId(data.subtopics, subtopic.id)),
    ],
    mappings: [
      ...data.mappings,
      ...defaults.mappings.filter(
        (mapping) =>
          defaultTopicIds.has(mapping.materialTopicId) &&
          defaultStandardIds.has(mapping.standardTopicId) &&
          !hasId(data.mappings, mapping.id),
      ),
    ],
  };
}

export default App;
