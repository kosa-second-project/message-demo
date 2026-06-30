import type { Member, SendRecord, StatsGrain, StatsPage, StatsPeriod, StatsPeriodPreset, Template } from './types';

export const TEMPLATES: Template[] = [
  { id: 1, name: "6월 여름 할인 이벤트", channel: "카카오톡", content: "[현대퓨처넷] 안녕하세요 #{이름}님! 6월 특별 여름 세일이 시작되었습니다.\n최대 30% 할인 혜택을 지금 바로 만나보세요.", category: "이벤트", usageCount: 128, updatedAt: "2026-06-20", scope: "현대백화점 전용", openRate: 54.3, clickRate: 21.8, optOutRate: 0.18, messagePurpose: "advertising" },
  { id: 2, name: "생일 축하 메시지", channel: "문자", content: "[현대퓨처넷] #{이름}님, 생일을 진심으로 축하드립니다! 특별한 생일 쿠폰을 확인해보세요.", category: "혜택", usageCount: 2341, updatedAt: "2026-06-18", scope: "전사 공통", openRate: 78.4, clickRate: 34.2, optOutRate: 0.05, messagePurpose: "advertising" },
  { id: 3, name: "신규 가입 환영", channel: "카카오톡", content: "[현대퓨처넷] #{이름}님, 가입을 환영합니다! 신규 가입 혜택 5,000P가 적립되었습니다.", category: "안내", usageCount: 891, updatedAt: "2026-06-15", scope: "전사 공통", openRate: 68.1, clickRate: 25.4, optOutRate: 0.08, messagePurpose: "informational" },
  { id: 4, name: "포인트 소멸 안내", channel: "문자", content: "[현대퓨처넷] 안내 드립니다. #{이름}님의 포인트 #{포인트}P가 2026년 6월 30일 소멸 예정입니다. 지금 바로 사용하세요!", category: "안내", usageCount: 445, updatedAt: "2026-06-10", scope: "현대홈쇼핑 전용", openRate: 62.8, clickRate: 18.1, optOutRate: 0.11, messagePurpose: "informational" },
  { id: 5, name: "우수고객 전용 혜택", channel: "카카오톡", content: "[현대퓨처넷] #{이름}님께만 드리는 우수고객 전용 특가 상품을 안내해드립니다. 특별한 혜택을 놓치지 마세요!", category: "혜택", usageCount: 312, updatedAt: "2026-06-08", scope: "한섬 전용", openRate: 71.2, clickRate: 28.9, optOutRate: 0.22, messagePurpose: "advertising" },
  { id: 6, name: "배송 완료 안내", channel: "문자", content: "[현대퓨처넷] #{이름}님, 주문하신 상품이 배송 완료되었습니다. 주문번호: #{주문번호}", category: "안내", usageCount: 5821, updatedAt: "2026-06-01", scope: "전사 공통", openRate: 66.4, clickRate: 12.6, optOutRate: 0.03, messagePurpose: "informational" },
];
export const TEMPLATE_TAGS = ["일반", "신규", "휴면", "생일", "포인트", "쿠폰", "최근구매", "장바구니", "앱사용자", "현대백화점", "현대홈쇼핑", "한섬", "리빙", "패션", "오프라인방문"];
export const MEMBER_TAGS = [
  "전체 고객", "일반", "신규", "휴면", "생일 대상자", "포인트 소멸 예정", "최근구매", "장바구니 이탈", "쿠폰 반응", "앱사용자",
  "카카오 동의", "SMS 동의", "RCS 동의", "LMS 동의", "현대백화점", "현대홈쇼핑", "한섬", "리빙 관심", "패션 관심", "오프라인 방문", "미동의 제외",
  "VIP", "VVIP", "우수고객", "멤버십 가입", "멤버십 만료 예정", "재구매 가능", "첫구매 완료", "최근 30일 구매", "최근 90일 미구매",
  "쿠폰 보유", "쿠폰 만료 예정", "포인트 보유", "포인트 고액 보유", "리뷰 작성", "리뷰 미작성", "앱 푸시 동의", "이메일 동의",
  "남성", "여성", "20대", "30대", "40대", "50대 이상", "서울/수도권", "지방", "오프라인 구매", "온라인 구매", "프로모션 반응",
];
export const TAG_GROUPS = [
  { id: "전체", label: "전체 태그", tags: [] },
  { id: "대상", label: "고객 유형", tags: ["일반", "신규", "휴면", "생일 대상자", "앱사용자"] },
  { id: "행동", label: "행동/관심", tags: ["최근구매", "장바구니", "장바구니 이탈", "쿠폰 반응", "리빙 관심", "패션 관심", "오프라인 방문", "오프라인방문", "재구매 가능", "첫구매 완료", "최근 30일 구매", "최근 90일 미구매", "리뷰 작성", "리뷰 미작성", "오프라인 구매", "온라인 구매", "프로모션 반응"] },
  { id: "목적", label: "목적", tags: ["이벤트", "쿠폰", "혜택", "안내", "포인트", "생일", "재구매", "포인트 소멸 예정", "쿠폰 보유", "쿠폰 만료 예정", "포인트 보유", "포인트 고액 보유"] },
  { id: "계열사", label: "계열사", tags: ["현대백화점", "현대홈쇼핑", "한섬", "리빙", "패션"] },
  { id: "동의", label: "수신 동의", tags: ["카카오 동의", "SMS 동의", "RCS 동의", "LMS 동의", "앱 푸시 동의", "이메일 동의", "미동의 제외"] },
  { id: "등급", label: "등급/멤버십", tags: ["VIP", "VVIP", "우수고객", "멤버십 가입", "멤버십 만료 예정"] },
  { id: "인구통계", label: "인구통계", tags: ["남성", "여성", "20대", "30대", "40대", "50대 이상", "서울/수도권", "지방"] },
];
export const uniqueTags = (tags: string[]) => Array.from(new Set(tags.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
export const tagGroupOf = (tag: string) => TAG_GROUPS.find(group => group.id !== "전체" && group.tags.includes(tag))?.id ?? "사용자";
export const tagGroupLabel = (tag: string) => TAG_GROUPS.find(group => group.id === tagGroupOf(tag))?.label ?? "사용자";
export const memberMatchesTargetTag = (member: Member, tag: string) => {
  const memberTags = member.tags ?? [];
  if (tag === "전체 고객") return true;
  if (tag === "SMS 동의" || tag === "LMS 동의") return member.smsConsent;
  if (tag === "카카오 동의") return member.kakaoConsent;
  if (tag === "RCS 동의") return member.rcsConsent;
  if (tag === "이메일 동의") return member.emailConsent;
  if (tag === "미동의 제외") return member.smsConsent || member.kakaoConsent || member.emailConsent || member.rcsConsent;
  return memberTags.includes(tag) || member.type === tag;
};
export const AI_REPORT_SECTIONS = [
  { title: "맞춤법·오타", status: "통과", score: 96, detail: "띄어쓰기와 오탈자 위험이 낮습니다.", action: "수정 불필요" },
  { title: "광고 표기", status: "주의", score: 82, detail: "마케팅성 문구에는 수신거부 문구와 발신자 표기가 필요합니다.", action: "080 수신거부 문구 유지" },
  { title: "민감 표현", status: "통과", score: 91, detail: "사회적 이슈, 차별, 과장 보장 표현은 감지되지 않았습니다.", action: "현재 문구 사용 가능" },
  { title: "개인정보·마스킹", status: "통과", score: 94, detail: "개인 식별 정보 직접 노출 없이 #{이름} 변수만 사용됩니다.", action: "실발송 전 변수 치환 검증" },
  { title: "채널 적합성", status: "검토", score: 78, detail: "90자를 초과하면 SMS가 LMS로 전환될 수 있습니다.", action: "SMS 발송 시 길이 축약 권장" },
  { title: "브랜드 톤", status: "통과", score: 89, detail: "현대적이고 간결한 안내 톤을 유지합니다.", action: "혜택 조건을 한 문장으로 명확화" },
];

export const getTemplateTags = (template: Template) => template.tags ?? [
  template.category,
  template.channel.includes("카카오") ? "카카오" : template.channel,
  TEMPLATE_TAGS[template.id % TEMPLATE_TAGS.length],
  TEMPLATE_TAGS[(template.id + 5) % TEMPLATE_TAGS.length],
];

export const createTemplateRows = () => Array.from({ length: 72 }, (_, index) => {
  const base = TEMPLATES[index % TEMPLATES.length];
  const group = Math.floor(index / TEMPLATES.length) + 1;
  return {
    ...base,
    id: index + 1,
    name: group === 1 ? base.name : `${base.name} ${group}`,
    usageCount: base.usageCount + index * 17,
    updatedAt: `2026-06-${String(23 - (index % 18)).padStart(2, "0")}`,
    tags: [base.category, TEMPLATE_TAGS[index % TEMPLATE_TAGS.length], TEMPLATE_TAGS[(index + 4) % TEMPLATE_TAGS.length]],
  };
});
export const MEMBERS: Member[] = [
  { id: 1, name: "김민준", phone: "010-****-3841", type: "일반", smsConsent: true, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2023-03-12", lastSend: "2026-06-22" },
  { id: 2, name: "이서연", phone: "010-****-7291", type: "일반", smsConsent: true, kakaoConsent: false, emailConsent: true, rcsConsent: false, joinedAt: "2024-01-08", lastSend: "2026-06-21" },
  { id: 3, name: "박지호", phone: "010-****-5502", type: "신규", smsConsent: true, kakaoConsent: true, emailConsent: false, rcsConsent: true, joinedAt: "2026-05-30", lastSend: "2026-06-20" },
  { id: 4, name: "최수아", phone: "010-****-1183", type: "휴면", smsConsent: false, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2022-11-20", lastSend: "2026-06-19" },
  { id: 5, name: "정도윤", phone: "010-****-9947", type: "휴면", smsConsent: true, kakaoConsent: false, emailConsent: false, rcsConsent: false, joinedAt: "2021-07-04", lastSend: "2025-12-01" },
  { id: 6, name: "윤지아", phone: "010-****-6620", type: "일반", smsConsent: true, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2024-08-15", lastSend: "2026-06-18" },
  { id: 7, name: "한예준", phone: "010-****-3309", type: "일반", smsConsent: false, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2025-02-28", lastSend: "2026-06-17" },
  { id: 8, name: "오서윤", phone: "010-****-8814", type: "신규", smsConsent: true, kakaoConsent: true, emailConsent: false, rcsConsent: true, joinedAt: "2023-09-01", lastSend: "2026-06-22" },
];
export const createMemberRows = () => Array.from({ length: 96 }, (_, index) => {
  const base = MEMBERS[index % MEMBERS.length];
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String((index % 27) + 1).padStart(2, "0");
  return {
    ...base,
    id: index + 1,
    name: index < MEMBERS.length ? base.name : `${base.name}${Math.floor(index / MEMBERS.length) + 1}`,
    phone: `010-****-${String(1000 + index * 37).slice(-4)}`,
    joinedAt: `2024-${month}-${day}`,
    lastSend: `2026-06-${String(23 - (index % 14)).padStart(2, "0")}`,
    smsConsent: index % 5 !== 0,
    kakaoConsent: index % 4 !== 0,
    emailConsent: index % 6 !== 0,
    rcsConsent: index % 3 === 0,
    tags: [base.type, MEMBER_TAGS[(index + 3) % MEMBER_TAGS.length], MEMBER_TAGS[(index + 9) % MEMBER_TAGS.length], index % 2 === 0 ? "최근구매" : "장바구니 이탈"],
  };
});
export const HISTORY: SendRecord[] = [
  { id: 1, template: "6월 여름 할인 이벤트", channel: "카카오톡", targetType: "전체 고객", count: 284391, success: 279112, fail: 5279, sentAt: "2026-06-22 14:00", status: "완료", cost: 3128400, savedCost: 1245600, affiliate: "현대백화점", messagePurpose: "advertising", failoverSteps: [{ label: "1차 카카오톡", requested: 284391, success: 279112, fail: 5279 }, { label: "2차 SMS 대체", requested: 5279, success: 5144, fail: 135 }] },
  { id: 2, template: "포인트 소멸 안내", channel: "LMS", targetType: "일반·휴면", count: 92841, success: 91220, fail: 1621, sentAt: "2026-06-21 09:30", status: "완료", cost: 2785230, savedCost: 0, affiliate: "현대홈쇼핑", messagePurpose: "informational", failoverSteps: [{ label: "1차 LMS", requested: 92841, success: 91220, fail: 1621 }] },
  { id: 3, template: "생일 축하 메시지", channel: "SMS", targetType: "생일 대상자", count: 1284, success: 1270, fail: 14, sentAt: "2026-06-20 08:00", status: "완료", cost: 12840, savedCost: 0, affiliate: "전사 공통", messagePurpose: "advertising", failoverSteps: [{ label: "1차 SMS", requested: 1284, success: 1270, fail: 14 }] },
  { id: 4, template: "우수고객 전용 혜택", channel: "카카오톡", targetType: "일반", count: 18420, success: 18198, fail: 222, sentAt: "2026-06-19 11:00", status: "완료", cost: 198720, savedCost: 82680, affiliate: "한섬", messagePurpose: "advertising", failoverSteps: [{ label: "1차 카카오톡", requested: 18420, success: 18198, fail: 222 }, { label: "2차 SMS 대체", requested: 222, success: 219, fail: 3 }] },
  { id: 5, template: "신규 가입 환영", channel: "카카오톡", targetType: "신규 가입자", count: 341, success: 338, fail: 3, sentAt: "2026-06-19 실시간", status: "진행중", cost: 2046, savedCost: 1364, affiliate: "전사 공통", messagePurpose: "informational", failoverSteps: [{ label: "1차 카카오톡", requested: 341, success: 338, fail: 3 }] },
  { id: 6, template: "배송 완료 안내", channel: "SMS", targetType: "배송 완료자", count: 2841, success: 2830, fail: 11, sentAt: "2026-06-18 16:00", status: "완료", cost: 28410, savedCost: 0, affiliate: "현대백화점", messagePurpose: "informational", failoverSteps: [{ label: "1차 SMS", requested: 2841, success: 2830, fail: 11 }] },
];

export const formatWon = (value: number) => `${value.toLocaleString()}원`;
export const QUEUE_STATUS = [
  { label: "대기", count: 0, color: "bg-slate-400" },
  { label: "발송 중", count: 2500, color: "bg-blue-500" },
  { label: "완료", count: 12847, color: "bg-emerald-500" },
  { label: "실패", count: 165, color: "bg-red-500" },
];
export const routingSavingsData = [
  { month: "1월", actual: 9800000, baseline: 11200000, saved: 1400000 },
  { month: "2월", actual: 10600000, baseline: 12450000, saved: 1850000 },
  { month: "3월", actual: 12100000, baseline: 14900000, saved: 2800000 },
  { month: "4월", actual: 13800000, baseline: 16950000, saved: 3150000 },
  { month: "5월", actual: 16200000, baseline: 20700000, saved: 4500000 },
  { month: "6월", actual: 18700000, baseline: 24200000, saved: 5500000 },
];
export const channelCostData = [
  { channel: "카카오톡", sends: 535279, successRate: 99.1, failRate: 0.9, cost: 3586503, unit: 7 },
  { channel: "SMS", sends: 249886, successRate: 99.1, failRate: 0.9, cost: 2498860, unit: 10 },
  { channel: "LMS", sends: 80241, successRate: 98.2, failRate: 1.8, cost: 2407230, unit: 30 },
  { channel: "이메일", sends: 26739, successRate: 97.8, failRate: 2.2, cost: 80217, unit: 3 },
];
export const affiliateStats = [
  { name: "현대백화점", sends: 384210, cost: 7200000, rate: 98.9 },
  { name: "현대홈쇼핑", sends: 248300, cost: 5600000, rate: 98.1 },
  { name: "한섬", sends: 168410, cost: 3900000, rate: 97.8 },
  { name: "리빙", sends: 91420, cost: 2000000, rate: 98.4 },
];
export const fallbackStats = [
  { label: "Push 실패 후 알림톡 전환", count: 320 },
  { label: "알림톡 실패 후 SMS 전환", count: 85 },
  { label: "친구톡 실패 후 SMS 전환", count: 5144 },
  { label: "최종 실패", count: 24 },
];

export const monthlyData = [
  { month: "1월", sms: 120000, lms: 45000, kakao: 210000, rcs: 12000 },
  { month: "2월", sms: 98000, lms: 38000, kakao: 189000, rcs: 15000 },
  { month: "3월", sms: 145000, lms: 52000, kakao: 245000, rcs: 18000 },
  { month: "4월", sms: 132000, lms: 49000, kakao: 228000, rcs: 21000 },
  { month: "5월", sms: 168000, lms: 61000, kakao: 312000, rcs: 28000 },
  { month: "6월", sms: 154000, lms: 58000, kakao: 284000, rcs: 31000 },
];
export const dailyTrend = [
  { date: "6/17", sends: 82400, success: 80900 },
  { date: "6/18", sends: 91200, success: 89700 },
  { date: "6/19", sends: 48300, success: 47800 },
  { date: "6/20", sends: 67100, success: 65900 },
  { date: "6/21", sends: 95400, success: 93800 },
  { date: "6/22", sends: 284391, success: 279112 },
  { date: "6/23", sends: 12847, success: 12690 },
];
export const channelPie = [
  { name: "카카오톡", value: 60, color: "#F7E600" },
  { name: "SMS", value: 28, color: "#1843FA" },
  { name: "LMS", value: 9, color: "#10B981" },
  { name: "이메일", value: 3, color: "#0EA5E9" },
];
export const memberTypeData = [
  { type: "일반", count: 198341, rate: 98.2, open: 41.2 },
  { type: "신규", count: 34210, rate: 97.8, open: 52.1 },
  { type: "휴면", count: 23420, rate: 94.2, open: 18.3 },
];
export const newMemberData = [
  { month: "1월", count: 820 },
  { month: "2월", count: 960 },
  { month: "3월", count: 1120 },
  { month: "4월", count: 1084 },
  { month: "5월", count: 1248 },
  { month: "6월", count: 1284 },
];
export const performanceData = [
  { month: "1월", clickRate: 12.4, conversionRate: 3.2 },
  { month: "2월", clickRate: 14.2, conversionRate: 3.9 },
  { month: "3월", clickRate: 16.1, conversionRate: 4.4 },
  { month: "4월", clickRate: 15.8, conversionRate: 4.1 },
  { month: "5월", clickRate: 18.3, conversionRate: 5.2 },
  { month: "6월", clickRate: 19.1, conversionRate: 5.8 },
];
export const fallbackStageData = [
  { stage: "1차", kakao: 98.9, sms: 99.1, lms: 98.2 },
  { stage: "2차", kakao: 96.4, sms: 97.4, lms: 96.8 },
  { stage: "3차", kakao: 92.8, sms: 94.1, lms: 93.7 },
];
export const fallbackDonutData = [
  { name: "1차 성공", value: 279112, rate: 98.9, color: "#1843FA", channels: "카카오 211,240 · SMS 48,120 · LMS 19,752" },
  { name: "2차 성공", value: 5144, rate: 97.4, color: "#10B981", channels: "SMS 4,820 · LMS 324" },
  { name: "3차 성공", value: 281, rate: 94.1, color: "#F59E0B", channels: "LMS 178 · 이메일 103" },
  { name: "최종 실패", value: 135, rate: 0, color: "#EF4444", channels: "수신거부 57 · 번호오류 42 · 채널실패 36" },
];
export const weekdayClickData = [
  { day: "월", rate: 12.1 }, { day: "화", rate: 16.8 }, { day: "수", rate: 18.2 },
  { day: "목", rate: 17.3 }, { day: "금", rate: 15.9 }, { day: "토", rate: 11.4 }, { day: "일", rate: 10.1 },
];
export const hourlyClickData = [
  { time: "00시", rate: 2.1 }, { time: "01시", rate: 1.4 }, { time: "02시", rate: 0.9 },
  { time: "03시", rate: 0.7 }, { time: "04시", rate: 0.8 }, { time: "05시", rate: 1.2 },
  { time: "06시", rate: 2.6 }, { time: "07시", rate: 5.3 }, { time: "08시", rate: 8.4 },
  { time: "09시", rate: 13.8 }, { time: "10시", rate: 18.7 }, { time: "11시", rate: 16.9 },
  { time: "12시", rate: 14.2 }, { time: "13시", rate: 15.6 }, { time: "14시", rate: 17.9 },
  { time: "15시", rate: 19.4 }, { time: "16시", rate: 21.3 }, { time: "17시", rate: 18.1 },
  { time: "18시", rate: 13.6 }, { time: "19시", rate: 10.2 }, { time: "20시", rate: 8.7 },
  { time: "21시", rate: 6.1 }, { time: "22시", rate: 4.3 }, { time: "23시", rate: 3.0 },
];
export const templatePerformanceTop = [
  { name: "생일 축하 메시지", click: 34.2, conversion: 7.1, source: "기본 템플릿" },
  { name: "AI 생성 템플릿", click: 31.6, conversion: 6.8, source: "기본 템플릿" },
  { name: "우수고객 전용 혜택", click: 28.9, conversion: 6.4, source: "AI 템플릿" },
  { name: "신규 가입 환영", click: 25.4, conversion: null, source: "AI 템플릿" },
  { name: "6월 여름 할인 이벤트", click: 21.8, conversion: 5.2, source: "기본 템플릿" },
  { name: "포인트 소멸 안내", click: 18.1, conversion: null, source: "기본 템플릿" },
];

export const STATS_TODAY = "2026-06-29";
export const STATS_PAGE_DEFAULT_PRESETS: Record<StatsPage, StatsPeriodPreset> = {
  "stats-overview": "recent7",
  "stats-channel": "recent30",
  "stats-routing": "thisMonth",
  "stats-member": "recent30",
  "stats-performance": "recent30",
};

export const parseStatDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
export const isValidStatDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseStatDate(value).getTime());
export const formatStatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
export const addStatDays = (value: string, days: number) => {
  const date = parseStatDate(value);
  date.setDate(date.getDate() + days);
  return formatStatDate(date);
};
export const createStatsPeriod = (preset: StatsPeriodPreset): StatsPeriod => {
  if (preset === "recent7") return { preset, start: addStatDays(STATS_TODAY, -6), end: STATS_TODAY };
  if (preset === "recent30") return { preset, start: addStatDays(STATS_TODAY, -29), end: STATS_TODAY };
  if (preset === "thisMonth") return { preset, start: `${STATS_TODAY.slice(0, 8)}01`, end: STATS_TODAY };
  return { preset, start: addStatDays(STATS_TODAY, -29), end: STATS_TODAY };
};
export const createDefaultStatsPeriods = (): Record<StatsPage, StatsPeriod> => ({
  "stats-overview": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-overview"]),
  "stats-channel": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-channel"]),
  "stats-routing": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-routing"]),
  "stats-member": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-member"]),
  "stats-performance": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-performance"]),
});
export const getOrderedStatsPeriod = (period: StatsPeriod) => {
  if (!isValidStatDate(period.start) || !isValidStatDate(period.end)) return createStatsPeriod("thisMonth");
  const startDate = parseStatDate(period.start);
  const endDate = parseStatDate(period.end);
  return startDate <= endDate ? period : { ...period, start: period.end, end: period.start };
};
export const getStatsPeriodDays = (period: StatsPeriod) => {
  const ordered = getOrderedStatsPeriod(period);
  return Math.max(1, Math.round((parseStatDate(ordered.end).getTime() - parseStatDate(ordered.start).getTime()) / 86400000) + 1);
};
export const getStatsGrain = (period: StatsPeriod): StatsGrain => {
  const days = getStatsPeriodDays(period);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
};
export const getStatsGrainLabel = (grain: StatsGrain) => ({ day: "일별", week: "주별", month: "월별" }[grain]);
export const formatCompactDate = (date: Date) => `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, "0")}`;
export const getStatsPeriodLabel = (period: StatsPeriod) => {
  const ordered = getOrderedStatsPeriod(period);
  const days = getStatsPeriodDays(ordered);
  return `${ordered.start} ~ ${ordered.end} (${days}일)`;
};
export const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const createStatsBuckets = (period: StatsPeriod) => {
  const ordered = getOrderedStatsPeriod(period);
  const grain = getStatsGrain(ordered);
  const end = parseStatDate(ordered.end);
  const buckets: { label: string; days: number; index: number }[] = [];
  let cursor = parseStatDate(ordered.start);

  while (cursor <= end) {
    const start = new Date(cursor);
    let bucketEnd = new Date(cursor);
    if (grain === "day") {
      bucketEnd = new Date(cursor);
    } else if (grain === "week") {
      bucketEnd.setDate(bucketEnd.getDate() + 6);
    } else {
      bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    }
    if (bucketEnd > end) bucketEnd = new Date(end);
    const days = Math.round((bucketEnd.getTime() - start.getTime()) / 86400000) + 1;
    const label = grain === "day"
      ? `${start.getMonth() + 1}/${start.getDate()}`
      : grain === "week"
        ? `${formatCompactDate(start)}-${formatCompactDate(bucketEnd)}`
        : `${start.getMonth() + 1}월`;
    buckets.push({ label, days, index: buckets.length });
    cursor = new Date(bucketEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  return { grain, buckets };
};
export const buildSendTrendData = (period: StatsPeriod, seed = 1) => {
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => {
    const daily = 43000 + ((bucket.index * 13817 + seed * 7919) % 72000);
    const spike = bucket.index % 5 === 2 ? 1.45 : 1;
    const sends = Math.round(daily * bucket.days * spike);
    const successRate = 0.973 + ((bucket.index + seed) % 6) * 0.003;
    return { label: bucket.label, sends, success: Math.round(sends * successRate) };
  });
};
export const buildChannelTrendData = (period: StatsPeriod, seed = 3) => {
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => {
    const base = (26000 + ((bucket.index * 9631 + seed * 5443) % 42000)) * bucket.days;
    return {
      label: bucket.label,
      kakao: Math.round(base * 1.72),
      sms: Math.round(base * 0.92),
      lms: Math.round(base * 0.34),
      rcs: Math.round(base * 0.16),
    };
  });
};
export const buildRoutingSeriesData = (period: StatsPeriod) => {
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => {
    const actual = Math.round((470000 + ((bucket.index * 182000) % 360000)) * bucket.days);
    const baseline = Math.round(actual * (1.22 + (bucket.index % 4) * 0.035));
    return { label: bucket.label, actual, baseline, saved: baseline - actual };
  });
};
export const buildNewMemberSeriesData = (period: StatsPeriod) => {
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => ({
    label: bucket.label,
    count: Math.round((34 + ((bucket.index * 17) % 31)) * bucket.days),
  }));
};
export const buildPerformanceSeriesData = (period: StatsPeriod, channel: string) => {
  const channelOffset = ["카카오톡", "SMS", "LMS", "이메일"].indexOf(channel) * 0.8;
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => {
    const clickRate = Number(clampNumber(14.8 + channelOffset + bucket.index * 0.45 + (bucket.days > 7 ? 1.4 : 0), 8, 36).toFixed(1));
    return {
      label: bucket.label,
      clickRate,
      conversionRate: Number(clampNumber(clickRate * 0.28 + (bucket.index % 3) * 0.2, 2, 11).toFixed(1)),
    };
  });
};
export const buildChannelCostData = (period: StatsPeriod) => {
  const scale = getStatsPeriodDays(period) / 30;
  return channelCostData.map((channel, index) => {
    const sends = Math.round(channel.sends * scale * (0.94 + index * 0.025));
    const successRate = Number(clampNumber(channel.successRate + ((getStatsPeriodDays(period) + index) % 5 - 2) * 0.08, 96, 99.8).toFixed(1));
    return {
      ...channel,
      sends,
      successRate,
      failRate: Number((100 - successRate).toFixed(1)),
      cost: sends * channel.unit,
    };
  });
};
export const buildChannelShareData = (rows: typeof channelCostData) => {
  const colors: Record<string, string> = {
    "카카오톡": "#F7E600",
    SMS: "#1843FA",
    LMS: "#10B981",
    "이메일": "#0EA5E9",
  };
  const total = rows.reduce((sum, row) => sum + row.sends, 0) || 1;
  const grouped = rows.reduce<Record<string, number>>((acc, row) => {
    const name = row.channel.includes("카카오") ? "카카오톡" : row.channel;
    acc[name] = (acc[name] ?? 0) + row.sends;
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, sends]) => ({
    name,
    value: Math.round((sends / total) * 100),
    color: colors[name] ?? "#64748B",
  }))
    .sort((a, b) => b.value - a.value);
};
export const buildFallbackStageData = (period: StatsPeriod) => {
  const modifier = Math.min(1.2, getStatsPeriodDays(period) / 45);
  return fallbackStageData.map((stage, index) => ({
    ...stage,
    kakao: Number(clampNumber(stage.kakao - index * 0.18 + modifier * 0.12, 90, 100).toFixed(1)),
    sms: Number(clampNumber(stage.sms - index * 0.14 + modifier * 0.1, 90, 100).toFixed(1)),
    lms: Number(clampNumber(stage.lms - index * 0.16 + modifier * 0.08, 90, 100).toFixed(1)),
  }));
};
