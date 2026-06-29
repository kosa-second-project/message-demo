import { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard, Send, FileText, History, Users, BarChart3,
  Bell, Settings, LogOut, Plus, Search, Filter, CheckCircle2,
  XCircle, Clock, Sparkles, MessageSquare, Phone, Mail, Zap,
  TrendingUp, TrendingDown, Edit2, Trash2, Download, Eye,
  ChevronRight, ChevronDown, AlertTriangle, X, Check, RefreshCw, Menu,
  Target, Activity, Tag, CalendarDays, Megaphone, PieChart,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Info,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RePieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page =
  | "dashboard" | "send" | "templates" | "history" | "members"
  | "stats-overview" | "stats-channel" | "stats-routing" | "stats-member" | "stats-performance";
type MessagePurpose = "advertising" | "informational";
type StatsPage = Extract<Page, "stats-overview" | "stats-channel" | "stats-routing" | "stats-member" | "stats-performance">;
type StatsPeriodPreset = "recent7" | "recent30" | "thisMonth" | "custom";
type StatsGrain = "day" | "week" | "month";

interface Template {
  id: number; name: string; channel: string; content: string; category: string; usageCount: number; updatedAt: string; tags?: string[];
  scope?: string; openRate?: number; clickRate?: number; optOutRate?: number; messagePurpose: MessagePurpose;
}
interface Member {
  id: number; name: string; phone: string; type: string; smsConsent: boolean; kakaoConsent: boolean; emailConsent: boolean; rcsConsent: boolean; joinedAt: string; lastSend: string; tags?: string[];
}
interface SendRecord {
  id: number; template: string; channel: string; targetType: string; count: number; success: number; fail: number; sentAt: string; status: string;
  cost: number; savedCost: number; affiliate: string; messagePurpose: MessagePurpose; failoverSteps: { label: string; requested: number; success: number; fail: number }[];
}
interface StatsPeriod {
  preset: StatsPeriodPreset;
  start: string;
  end: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  { id: 1, name: "6월 여름 할인 이벤트", channel: "카카오 친구톡", content: "[현대퓨처넷] 안녕하세요 #{이름}님! 6월 특별 여름 세일이 시작되었습니다.\n최대 30% 할인 혜택을 지금 바로 만나보세요.", category: "이벤트", usageCount: 128, updatedAt: "2026-06-20", scope: "현대백화점 전용", openRate: 54.3, clickRate: 21.8, optOutRate: 0.18, messagePurpose: "advertising" },
  { id: 2, name: "생일 축하 메시지", channel: "SMS", content: "[현대퓨처넷] #{이름}님, 생일을 진심으로 축하드립니다! 특별한 생일 쿠폰을 확인해보세요.", category: "혜택", usageCount: 2341, updatedAt: "2026-06-18", scope: "전사 공통", openRate: 78.4, clickRate: 34.2, optOutRate: 0.05, messagePurpose: "advertising" },
  { id: 3, name: "신규 가입 환영", channel: "카카오 알림톡", content: "[현대퓨처넷] #{이름}님, 가입을 환영합니다! 신규 가입 혜택 5,000P가 적립되었습니다.", category: "안내", usageCount: 891, updatedAt: "2026-06-15", scope: "전사 공통", openRate: 68.1, clickRate: 25.4, optOutRate: 0.08, messagePurpose: "informational" },
  { id: 4, name: "포인트 소멸 안내", channel: "LMS", content: "[현대퓨처넷] 안내 드립니다. #{이름}님의 포인트 #{포인트}P가 2026년 6월 30일 소멸 예정입니다. 지금 바로 사용하세요!", category: "안내", usageCount: 445, updatedAt: "2026-06-10", scope: "현대홈쇼핑 전용", openRate: 62.8, clickRate: 18.1, optOutRate: 0.11, messagePurpose: "informational" },
  { id: 5, name: "우수고객 전용 혜택", channel: "카카오 친구톡", content: "[현대퓨처넷] #{이름}님께만 드리는 우수고객 전용 특가 상품을 안내해드립니다. 특별한 혜택을 놓치지 마세요!", category: "혜택", usageCount: 312, updatedAt: "2026-06-08", scope: "한섬 전용", openRate: 71.2, clickRate: 28.9, optOutRate: 0.22, messagePurpose: "advertising" },
  { id: 6, name: "배송 완료 안내", channel: "SMS", content: "[현대퓨처넷] #{이름}님, 주문하신 상품이 배송 완료되었습니다. 주문번호: #{주문번호}", category: "안내", usageCount: 5821, updatedAt: "2026-06-01", scope: "전사 공통", openRate: 66.4, clickRate: 12.6, optOutRate: 0.03, messagePurpose: "informational" },
];
const TEMPLATE_TAGS = ["일반", "신규", "휴면", "생일", "포인트", "쿠폰", "최근구매", "장바구니", "앱사용자", "현대백화점", "현대홈쇼핑", "한섬", "리빙", "패션", "오프라인방문"];
const MEMBER_TAGS = [
  "전체 고객", "일반", "신규", "휴면", "생일 대상자", "포인트 소멸 예정", "최근구매", "장바구니 이탈", "쿠폰 반응", "앱사용자",
  "카카오 동의", "SMS 동의", "RCS 동의", "LMS 동의", "현대백화점", "현대홈쇼핑", "한섬", "리빙 관심", "패션 관심", "오프라인 방문", "미동의 제외",
  "VIP", "VVIP", "우수고객", "멤버십 가입", "멤버십 만료 예정", "재구매 가능", "첫구매 완료", "최근 30일 구매", "최근 90일 미구매",
  "쿠폰 보유", "쿠폰 만료 예정", "포인트 보유", "포인트 고액 보유", "리뷰 작성", "리뷰 미작성", "앱 푸시 동의", "이메일 동의",
  "남성", "여성", "20대", "30대", "40대", "50대 이상", "서울/수도권", "지방", "오프라인 구매", "온라인 구매", "프로모션 반응",
];
const TAG_GROUPS = [
  { id: "전체", label: "전체 타겟", tags: [] },
  { id: "대상", label: "고객 유형", tags: ["일반", "신규", "휴면", "생일 대상자", "앱사용자"] },
  { id: "행동", label: "행동/관심", tags: ["최근구매", "장바구니", "장바구니 이탈", "쿠폰 반응", "리빙 관심", "패션 관심", "오프라인 방문", "오프라인방문", "재구매 가능", "첫구매 완료", "최근 30일 구매", "최근 90일 미구매", "리뷰 작성", "리뷰 미작성", "오프라인 구매", "온라인 구매", "프로모션 반응"] },
  { id: "목적", label: "목적", tags: ["이벤트", "쿠폰", "혜택", "안내", "포인트", "생일", "재구매", "포인트 소멸 예정", "쿠폰 보유", "쿠폰 만료 예정", "포인트 보유", "포인트 고액 보유"] },
  { id: "계열사", label: "계열사", tags: ["현대백화점", "현대홈쇼핑", "한섬", "리빙", "패션"] },
  { id: "동의", label: "수신 동의", tags: ["카카오 동의", "SMS 동의", "RCS 동의", "LMS 동의", "앱 푸시 동의", "이메일 동의", "미동의 제외"] },
  { id: "등급", label: "등급/멤버십", tags: ["VIP", "VVIP", "우수고객", "멤버십 가입", "멤버십 만료 예정"] },
  { id: "인구통계", label: "인구통계", tags: ["남성", "여성", "20대", "30대", "40대", "50대 이상", "서울/수도권", "지방"] },
];
const uniqueTags = (tags: string[]) => Array.from(new Set(tags.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
const tagGroupOf = (tag: string) => TAG_GROUPS.find(group => group.id !== "전체" && group.tags.includes(tag))?.id ?? "사용자";
const tagGroupLabel = (tag: string) => TAG_GROUPS.find(group => group.id === tagGroupOf(tag))?.label ?? "사용자";
const memberMatchesTargetTag = (member: Member, tag: string) => {
  const memberTags = member.tags ?? [];
  if (tag === "전체 고객") return true;
  if (tag === "SMS 동의" || tag === "LMS 동의") return member.smsConsent;
  if (tag === "카카오 동의") return member.kakaoConsent;
  if (tag === "RCS 동의") return member.rcsConsent;
  if (tag === "이메일 동의") return member.emailConsent;
  if (tag === "미동의 제외") return member.smsConsent || member.kakaoConsent || member.emailConsent || member.rcsConsent;
  return memberTags.includes(tag) || member.type === tag;
};
const AI_REPORT_SECTIONS = [
  { title: "맞춤법·오타", status: "통과", score: 96, detail: "띄어쓰기와 오탈자 위험이 낮습니다.", action: "수정 불필요" },
  { title: "광고 표기", status: "주의", score: 82, detail: "마케팅성 문구에는 수신거부 문구와 발신자 표기가 필요합니다.", action: "080 수신거부 문구 유지" },
  { title: "민감 표현", status: "통과", score: 91, detail: "사회적 이슈, 차별, 과장 보장 표현은 감지되지 않았습니다.", action: "현재 문구 사용 가능" },
  { title: "개인정보·마스킹", status: "통과", score: 94, detail: "개인 식별 정보 직접 노출 없이 #{이름} 변수만 사용됩니다.", action: "실발송 전 변수 치환 검증" },
  { title: "채널 적합성", status: "검토", score: 78, detail: "90자를 초과하면 SMS가 LMS로 전환될 수 있습니다.", action: "SMS 발송 시 길이 축약 권장" },
  { title: "브랜드 톤", status: "통과", score: 89, detail: "현대적이고 간결한 안내 톤을 유지합니다.", action: "혜택 조건을 한 문장으로 명확화" },
];

const getTemplateTags = (template: Template) => template.tags ?? [
  template.category,
  template.channel.includes("카카오") ? "카카오" : template.channel,
  TEMPLATE_TAGS[template.id % TEMPLATE_TAGS.length],
  TEMPLATE_TAGS[(template.id + 5) % TEMPLATE_TAGS.length],
];

const createTemplateRows = () => Array.from({ length: 72 }, (_, index) => {
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
const MEMBERS: Member[] = [
  { id: 1, name: "김민준", phone: "010-****-3841", type: "일반", smsConsent: true, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2023-03-12", lastSend: "2026-06-22" },
  { id: 2, name: "이서연", phone: "010-****-7291", type: "일반", smsConsent: true, kakaoConsent: false, emailConsent: true, rcsConsent: false, joinedAt: "2024-01-08", lastSend: "2026-06-21" },
  { id: 3, name: "박지호", phone: "010-****-5502", type: "신규", smsConsent: true, kakaoConsent: true, emailConsent: false, rcsConsent: true, joinedAt: "2026-05-30", lastSend: "2026-06-20" },
  { id: 4, name: "최수아", phone: "010-****-1183", type: "휴면", smsConsent: false, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2022-11-20", lastSend: "2026-06-19" },
  { id: 5, name: "정도윤", phone: "010-****-9947", type: "휴면", smsConsent: true, kakaoConsent: false, emailConsent: false, rcsConsent: false, joinedAt: "2021-07-04", lastSend: "2025-12-01" },
  { id: 6, name: "윤지아", phone: "010-****-6620", type: "일반", smsConsent: true, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2024-08-15", lastSend: "2026-06-18" },
  { id: 7, name: "한예준", phone: "010-****-3309", type: "일반", smsConsent: false, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "2025-02-28", lastSend: "2026-06-17" },
  { id: 8, name: "오서윤", phone: "010-****-8814", type: "신규", smsConsent: true, kakaoConsent: true, emailConsent: false, rcsConsent: true, joinedAt: "2023-09-01", lastSend: "2026-06-22" },
];
const createMemberRows = () => Array.from({ length: 96 }, (_, index) => {
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
const HISTORY: SendRecord[] = [
  { id: 1, template: "6월 여름 할인 이벤트", channel: "카카오 친구톡", targetType: "전체 고객", count: 284391, success: 279112, fail: 5279, sentAt: "2026-06-22 14:00", status: "완료", cost: 3128400, savedCost: 1245600, affiliate: "현대백화점", messagePurpose: "advertising", failoverSteps: [{ label: "1차 카카오 친구톡", requested: 284391, success: 279112, fail: 5279 }, { label: "2차 SMS 대체", requested: 5279, success: 5144, fail: 135 }] },
  { id: 2, template: "포인트 소멸 안내", channel: "LMS", targetType: "일반·휴면", count: 92841, success: 91220, fail: 1621, sentAt: "2026-06-21 09:30", status: "완료", cost: 2785230, savedCost: 0, affiliate: "현대홈쇼핑", messagePurpose: "informational", failoverSteps: [{ label: "1차 LMS", requested: 92841, success: 91220, fail: 1621 }] },
  { id: 3, template: "생일 축하 메시지", channel: "SMS", targetType: "생일 대상자", count: 1284, success: 1270, fail: 14, sentAt: "2026-06-20 08:00", status: "완료", cost: 12840, savedCost: 0, affiliate: "전사 공통", messagePurpose: "advertising", failoverSteps: [{ label: "1차 SMS", requested: 1284, success: 1270, fail: 14 }] },
  { id: 4, template: "우수고객 전용 혜택", channel: "카카오 친구톡", targetType: "일반", count: 18420, success: 18198, fail: 222, sentAt: "2026-06-19 11:00", status: "완료", cost: 198720, savedCost: 82680, affiliate: "한섬", messagePurpose: "advertising", failoverSteps: [{ label: "1차 카카오 친구톡", requested: 18420, success: 18198, fail: 222 }, { label: "2차 SMS 대체", requested: 222, success: 219, fail: 3 }] },
  { id: 5, template: "신규 가입 환영", channel: "카카오 알림톡", targetType: "신규 가입자", count: 341, success: 338, fail: 3, sentAt: "2026-06-19 실시간", status: "진행중", cost: 2046, savedCost: 1364, affiliate: "전사 공통", messagePurpose: "informational", failoverSteps: [{ label: "1차 카카오 알림톡", requested: 341, success: 338, fail: 3 }] },
  { id: 6, template: "배송 완료 안내", channel: "SMS", targetType: "배송 완료자", count: 2841, success: 2830, fail: 11, sentAt: "2026-06-18 16:00", status: "완료", cost: 28410, savedCost: 0, affiliate: "현대백화점", messagePurpose: "informational", failoverSteps: [{ label: "1차 SMS", requested: 2841, success: 2830, fail: 11 }] },
];

const formatWon = (value: number) => `${value.toLocaleString()}원`;
const QUEUE_STATUS = [
  { label: "대기", count: 0, color: "bg-slate-400" },
  { label: "발송 중", count: 2500, color: "bg-blue-500" },
  { label: "완료", count: 12847, color: "bg-emerald-500" },
  { label: "실패", count: 165, color: "bg-red-500" },
];
const routingSavingsData = [
  { month: "1월", actual: 9800000, baseline: 11200000, saved: 1400000 },
  { month: "2월", actual: 10600000, baseline: 12450000, saved: 1850000 },
  { month: "3월", actual: 12100000, baseline: 14900000, saved: 2800000 },
  { month: "4월", actual: 13800000, baseline: 16950000, saved: 3150000 },
  { month: "5월", actual: 16200000, baseline: 20700000, saved: 4500000 },
  { month: "6월", actual: 18700000, baseline: 24200000, saved: 5500000 },
];
const channelCostData = [
  { channel: "카카오 알림톡", sends: 160450, successRate: 99.4, failRate: 0.6, cost: 962700, unit: 6 },
  { channel: "카카오 친구톡", sends: 374829, successRate: 98.9, failRate: 1.1, cost: 2623803, unit: 7 },
  { channel: "SMS", sends: 249886, successRate: 99.1, failRate: 0.9, cost: 2498860, unit: 10 },
  { channel: "LMS", sends: 80241, successRate: 98.2, failRate: 1.8, cost: 2407230, unit: 30 },
  { channel: "RCS", sends: 26739, successRate: 97.8, failRate: 2.2, cost: 374346, unit: 14 },
];
const affiliateStats = [
  { name: "현대백화점", sends: 384210, cost: 7200000, rate: 98.9 },
  { name: "현대홈쇼핑", sends: 248300, cost: 5600000, rate: 98.1 },
  { name: "한섬", sends: 168410, cost: 3900000, rate: 97.8 },
  { name: "리빙", sends: 91420, cost: 2000000, rate: 98.4 },
];
const fallbackStats = [
  { label: "Push 실패 후 알림톡 전환", count: 320 },
  { label: "알림톡 실패 후 SMS 전환", count: 85 },
  { label: "친구톡 실패 후 SMS 전환", count: 5144 },
  { label: "최종 실패", count: 24 },
];

const monthlyData = [
  { month: "1월", sms: 120000, lms: 45000, kakao: 210000, rcs: 12000 },
  { month: "2월", sms: 98000, lms: 38000, kakao: 189000, rcs: 15000 },
  { month: "3월", sms: 145000, lms: 52000, kakao: 245000, rcs: 18000 },
  { month: "4월", sms: 132000, lms: 49000, kakao: 228000, rcs: 21000 },
  { month: "5월", sms: 168000, lms: 61000, kakao: 312000, rcs: 28000 },
  { month: "6월", sms: 154000, lms: 58000, kakao: 284000, rcs: 31000 },
];
const dailyTrend = [
  { date: "6/17", sends: 82400, success: 80900 },
  { date: "6/18", sends: 91200, success: 89700 },
  { date: "6/19", sends: 48300, success: 47800 },
  { date: "6/20", sends: 67100, success: 65900 },
  { date: "6/21", sends: 95400, success: 93800 },
  { date: "6/22", sends: 284391, success: 279112 },
  { date: "6/23", sends: 12847, success: 12690 },
];
const channelPie = [
  { name: "카카오 친구톡", value: 42, color: "#F7E600" },
  { name: "SMS", value: 28, color: "#1843FA" },
  { name: "카카오 알림톡", value: 18, color: "#FF8F00" },
  { name: "LMS", value: 9, color: "#10B981" },
  { name: "RCS", value: 3, color: "#8B5CF6" },
];
const memberTypeData = [
  { type: "일반", count: 198341, rate: 98.2, open: 41.2 },
  { type: "신규", count: 34210, rate: 97.8, open: 52.1 },
  { type: "휴면", count: 23420, rate: 94.2, open: 18.3 },
];
const newMemberData = [
  { month: "1월", count: 820 },
  { month: "2월", count: 960 },
  { month: "3월", count: 1120 },
  { month: "4월", count: 1084 },
  { month: "5월", count: 1248 },
  { month: "6월", count: 1284 },
];
const performanceData = [
  { month: "1월", clickRate: 12.4, conversionRate: 3.2 },
  { month: "2월", clickRate: 14.2, conversionRate: 3.9 },
  { month: "3월", clickRate: 16.1, conversionRate: 4.4 },
  { month: "4월", clickRate: 15.8, conversionRate: 4.1 },
  { month: "5월", clickRate: 18.3, conversionRate: 5.2 },
  { month: "6월", clickRate: 19.1, conversionRate: 5.8 },
];
const fallbackStageData = [
  { stage: "1차", kakao: 98.9, sms: 99.1, lms: 98.2 },
  { stage: "2차", kakao: 96.4, sms: 97.4, lms: 96.8 },
  { stage: "3차", kakao: 92.8, sms: 94.1, lms: 93.7 },
];
const fallbackDonutData = [
  { name: "1차 성공", value: 279112, rate: 98.9, color: "#1843FA", channels: "카카오 211,240 · SMS 48,120 · LMS 19,752" },
  { name: "2차 성공", value: 5144, rate: 97.4, color: "#10B981", channels: "SMS 4,820 · LMS 324" },
  { name: "3차 성공", value: 281, rate: 94.1, color: "#F59E0B", channels: "LMS 178 · RCS 103" },
  { name: "최종 실패", value: 135, rate: 0, color: "#EF4444", channels: "수신거부 57 · 번호오류 42 · 채널실패 36" },
];
const weekdayClickData = [
  { day: "월", rate: 12.1 }, { day: "화", rate: 16.8 }, { day: "수", rate: 18.2 },
  { day: "목", rate: 17.3 }, { day: "금", rate: 15.9 }, { day: "토", rate: 11.4 }, { day: "일", rate: 10.1 },
];
const hourlyClickData = [
  { time: "00시", rate: 2.1 }, { time: "01시", rate: 1.4 }, { time: "02시", rate: 0.9 },
  { time: "03시", rate: 0.7 }, { time: "04시", rate: 0.8 }, { time: "05시", rate: 1.2 },
  { time: "06시", rate: 2.6 }, { time: "07시", rate: 5.3 }, { time: "08시", rate: 8.4 },
  { time: "09시", rate: 13.8 }, { time: "10시", rate: 18.7 }, { time: "11시", rate: 16.9 },
  { time: "12시", rate: 14.2 }, { time: "13시", rate: 15.6 }, { time: "14시", rate: 17.9 },
  { time: "15시", rate: 19.4 }, { time: "16시", rate: 21.3 }, { time: "17시", rate: 18.1 },
  { time: "18시", rate: 13.6 }, { time: "19시", rate: 10.2 }, { time: "20시", rate: 8.7 },
  { time: "21시", rate: 6.1 }, { time: "22시", rate: 4.3 }, { time: "23시", rate: 3.0 },
];
const templatePerformanceTop = [
  { name: "생일 축하 메시지", click: 34.2, conversion: 7.1, source: "기본 템플릿" },
  { name: "AI 생성 템플릿", click: 31.6, conversion: 6.8, source: "기본 템플릿" },
  { name: "우수고객 전용 혜택", click: 28.9, conversion: 6.4, source: "AI 템플릿" },
  { name: "신규 가입 환영", click: 25.4, conversion: null, source: "AI 템플릿" },
  { name: "6월 여름 할인 이벤트", click: 21.8, conversion: 5.2, source: "기본 템플릿" },
  { name: "포인트 소멸 안내", click: 18.1, conversion: null, source: "기본 템플릿" },
];

const STATS_TODAY = "2026-06-29";
const STATS_PAGE_DEFAULT_PRESETS: Record<StatsPage, StatsPeriodPreset> = {
  "stats-overview": "recent7",
  "stats-channel": "recent30",
  "stats-routing": "thisMonth",
  "stats-member": "recent30",
  "stats-performance": "recent30",
};

const parseStatDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const isValidStatDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseStatDate(value).getTime());
const formatStatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addStatDays = (value: string, days: number) => {
  const date = parseStatDate(value);
  date.setDate(date.getDate() + days);
  return formatStatDate(date);
};
const createStatsPeriod = (preset: StatsPeriodPreset): StatsPeriod => {
  if (preset === "recent7") return { preset, start: addStatDays(STATS_TODAY, -6), end: STATS_TODAY };
  if (preset === "recent30") return { preset, start: addStatDays(STATS_TODAY, -29), end: STATS_TODAY };
  if (preset === "thisMonth") return { preset, start: `${STATS_TODAY.slice(0, 8)}01`, end: STATS_TODAY };
  return { preset, start: addStatDays(STATS_TODAY, -29), end: STATS_TODAY };
};
const createDefaultStatsPeriods = (): Record<StatsPage, StatsPeriod> => ({
  "stats-overview": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-overview"]),
  "stats-channel": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-channel"]),
  "stats-routing": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-routing"]),
  "stats-member": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-member"]),
  "stats-performance": createStatsPeriod(STATS_PAGE_DEFAULT_PRESETS["stats-performance"]),
});
const getOrderedStatsPeriod = (period: StatsPeriod) => {
  if (!isValidStatDate(period.start) || !isValidStatDate(period.end)) return createStatsPeriod("thisMonth");
  const startDate = parseStatDate(period.start);
  const endDate = parseStatDate(period.end);
  return startDate <= endDate ? period : { ...period, start: period.end, end: period.start };
};
const getStatsPeriodDays = (period: StatsPeriod) => {
  const ordered = getOrderedStatsPeriod(period);
  return Math.max(1, Math.round((parseStatDate(ordered.end).getTime() - parseStatDate(ordered.start).getTime()) / 86400000) + 1);
};
const getStatsGrain = (period: StatsPeriod): StatsGrain => {
  const days = getStatsPeriodDays(period);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
};
const getStatsGrainLabel = (grain: StatsGrain) => ({ day: "일별", week: "주별", month: "월별" }[grain]);
const formatCompactDate = (date: Date) => `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, "0")}`;
const getStatsPeriodLabel = (period: StatsPeriod) => {
  const ordered = getOrderedStatsPeriod(period);
  const days = getStatsPeriodDays(ordered);
  return `${ordered.start} ~ ${ordered.end} (${days}일)`;
};
const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const createStatsBuckets = (period: StatsPeriod) => {
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
const buildSendTrendData = (period: StatsPeriod, seed = 1) => {
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => {
    const daily = 43000 + ((bucket.index * 13817 + seed * 7919) % 72000);
    const spike = bucket.index % 5 === 2 ? 1.45 : 1;
    const sends = Math.round(daily * bucket.days * spike);
    const successRate = 0.973 + ((bucket.index + seed) % 6) * 0.003;
    return { label: bucket.label, sends, success: Math.round(sends * successRate) };
  });
};
const buildChannelTrendData = (period: StatsPeriod, seed = 3) => {
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
const buildRoutingSeriesData = (period: StatsPeriod) => {
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => {
    const actual = Math.round((470000 + ((bucket.index * 182000) % 360000)) * bucket.days);
    const baseline = Math.round(actual * (1.22 + (bucket.index % 4) * 0.035));
    return { label: bucket.label, actual, baseline, saved: baseline - actual };
  });
};
const buildNewMemberSeriesData = (period: StatsPeriod) => {
  const { buckets } = createStatsBuckets(period);
  return buckets.map(bucket => ({
    label: bucket.label,
    count: Math.round((34 + ((bucket.index * 17) % 31)) * bucket.days),
  }));
};
const buildPerformanceSeriesData = (period: StatsPeriod, channel: string) => {
  const channelOffset = ["카카오 친구톡", "카카오 알림톡", "SMS", "LMS", "RCS"].indexOf(channel) * 0.8;
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
const buildChannelCostData = (period: StatsPeriod) => {
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
const buildChannelShareData = (rows: typeof channelCostData) => {
  const colors: Record<string, string> = {
    "카카오 친구톡": "#F7E600",
    SMS: "#1843FA",
    "카카오 알림톡": "#FF8F00",
    LMS: "#10B981",
    RCS: "#8B5CF6",
  };
  const total = rows.reduce((sum, row) => sum + row.sends, 0) || 1;
  return rows.map(row => ({ name: row.channel, value: Math.round((row.sends / total) * 100), color: colors[row.channel] ?? "#64748B" }))
    .sort((a, b) => b.value - a.value);
};
const buildFallbackStageData = (period: StatsPeriod) => {
  const modifier = Math.min(1.2, getStatsPeriodDays(period) / 45);
  return fallbackStageData.map((stage, index) => ({
    ...stage,
    kakao: Number(clampNumber(stage.kakao - index * 0.18 + modifier * 0.12, 90, 100).toFixed(1)),
    sms: Number(clampNumber(stage.sms - index * 0.14 + modifier * 0.1, 90, 100).toFixed(1)),
    lms: Number(clampNumber(stage.lms - index * 0.16 + modifier * 0.08, 90, 100).toFixed(1)),
  }));
};

// ─── Shared Components ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, icon, color = "blue" }: {
  label: string; value: string; sub?: string; trend?: { val: string; up: boolean; label?: string }; icon: React.ReactNode; color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight mb-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
          {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.val} {trend.label ?? "전주 대비"}
        </div>
      )}
    </div>
  );
}

function Badge({ text, variant = "default" }: { text: string; variant?: string }) {
  const v: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${v[variant] || v.default}`}>{text}</span>;
}

function SpecPin({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
      <Info className="h-3 w-3 text-primary" />
      {children}
    </span>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, disabled = false, className = "" }: {
  children: React.ReactNode; variant?: string; size?: string; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-5 py-3 text-sm" : "px-4 py-2 text-sm";
  const vars: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-foreground hover:bg-muted",
    danger: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
  };
  return <button className={`${base} ${sz} ${vars[variant] || vars.primary} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function StatsPeriodControl({ period, onChange, compact = false }: {
  period: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
  compact?: boolean;
}) {
  const ordered = getOrderedStatsPeriod(period);
  const grainLabel = getStatsGrainLabel(getStatsGrain(ordered));
  const handleDateChange = (key: "start" | "end", value: string) => {
    if (!isValidStatDate(value)) return;
    onChange({ ...period, preset: "custom", [key]: value });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "rounded-xl border border-border bg-card p-2"}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        기간
      </div>
      <input type="date" value={period.start} onChange={event => handleDateChange("start", event.target.value)} className="h-9 rounded-lg border border-border bg-input-background px-3 text-xs font-semibold text-foreground" />
      <span className="text-xs font-semibold text-muted-foreground">~</span>
      <input type="date" value={period.end} onChange={event => handleDateChange("end", event.target.value)} className="h-9 rounded-lg border border-border bg-input-background px-3 text-xs font-semibold text-foreground" />
      <span className="rounded-lg bg-muted px-2.5 py-2 text-[11px] font-bold text-muted-foreground">
        {grainLabel} 집계
      </span>
      <span className="text-[11px] font-semibold text-muted-foreground">{getStatsPeriodLabel(ordered)}</span>
    </div>
  );
}

type TemplateFormState = Pick<Template, "name" | "channel" | "content" | "category" | "messagePurpose"> & { scope: string };

function TemplateFormFields({ form, setForm, onCancel, onSave, saveDisabled = false }: {
  form: TemplateFormState;
  setForm: React.Dispatch<React.SetStateAction<TemplateFormState>>;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">템플릿명</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">채널</label>
          <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none">
            {["SMS", "LMS", "카카오 알림톡", "카카오 친구톡", "RCS"].map(channel => <option key={channel}>{channel}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">카테고리</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none">
            {["이벤트", "혜택", "안내"].map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">광고여부</label>
        <div className="grid grid-cols-2 gap-2">
          {MESSAGE_PURPOSES.map(purpose => {
            const Icon = purpose.icon;
            const selected = form.messagePurpose === purpose.id;
            return (
              <button key={purpose.id} type="button" onClick={() => setForm(f => ({ ...f, messagePurpose: purpose.id }))} className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors ${selected ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                <Icon className="h-3.5 w-3.5" />
                {purpose.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">공개 범위</label>
        <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none">
          {["전사 공통", "현대백화점 전용", "현대홈쇼핑 전용", "한섬 전용"].map(scope => <option key={scope}>{scope}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">메시지 내용</label>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} className="w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{form.content.length}자</span>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Btn variant="outline" onClick={onCancel}>취소</Btn>
        <Btn disabled={saveDisabled || !form.name.trim() || !form.content.trim()} onClick={onSave}>저장</Btn>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative bg-card rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pages = Array.from({ length: Math.min(5, max) }, (_, index) => {
    const base = Math.min(Math.max(page - 2, 1), Math.max(max - 4, 1));
    return base + index;
  }).filter(p => p <= max);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
      <span className="text-xs text-muted-foreground">{total.toLocaleString()}건 중 {start.toLocaleString()}-{end.toLocaleString()}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted">이전</button>
        {pages.map(p => (
          <button key={p} onClick={() => onPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-muted"}`}>{p}</button>
        ))}
        <button onClick={() => onPage(Math.min(max, page + 1))} disabled={page === max} className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted">다음</button>
      </div>
    </div>
  );
}

function AiReportDetail({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
      {AI_REPORT_SECTIONS.map(section => (
        <div key={section.title} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">{section.title}</span>
            <Badge text={section.status} variant={section.status === "주의" ? "amber" : section.status === "검토" ? "blue" : "green"} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${section.score}%` }} />
            </div>
            <span className="text-xs font-bold">{section.score}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{section.detail}</p>
          <div className="text-xs font-semibold text-primary">{section.action}</div>
        </div>
      ))}
    </div>
  );
}

function QueueStatusCard({ subtitle, onDetailClick }: { subtitle?: string; onDetailClick?: () => void }) {
  const [hoveredQueue, setHoveredQueue] = useState<{ label: string; count: number; rate: number; x: number; y: number } | null>(null);
  const queueTotal = QUEUE_STATUS.reduce((sum, current) => sum + current.count, 0);
  const queueColors: Record<string, string> = {
    "대기": "#94A3B8",
    "발송 중": "#3B82F6",
    "완료": "#10B981",
    "실패": "#EF4444",
  };
  const showQueueTooltip = (item: typeof QUEUE_STATUS[number], event: React.MouseEvent<HTMLButtonElement>) => {
    const rate = queueTotal === 0 ? 0 : (item.count / queueTotal) * 100;
    const tooltipWidth = 176;
    const tooltipHeight = 88;
    const offset = 14;
    const viewportPadding = 12;
    setHoveredQueue({
      label: item.label,
      count: item.count,
      rate,
      x: Math.min(event.clientX + offset, window.innerWidth - tooltipWidth - viewportPadding),
      y: Math.min(event.clientY + offset, window.innerHeight - tooltipHeight - viewportPadding),
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">실시간 발송 큐 상태</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {onDetailClick && (
          <button onClick={onDetailClick} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">상세 분석 <ChevronRight className="w-3 h-3" /></button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {QUEUE_STATUS.map(item => {
          const rate = queueTotal === 0 ? 0 : (item.count / queueTotal) * 100;
          return (
            <div key={item.label} className="rounded-lg bg-muted px-3 py-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: queueColors[item.label] }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">{rate.toFixed(1)}%</span>
              </div>
              <div className="text-lg font-bold">{item.count.toLocaleString()}건</div>
            </div>
          );
        })}
      </div>
      <div className="relative">
        {hoveredQueue && (
          <div
            className="pointer-events-none fixed z-50 w-44 rounded-lg border border-border bg-card p-3 text-xs shadow-lg"
            style={{ left: hoveredQueue.x, top: hoveredQueue.y }}
          >
            <div className="font-bold text-foreground">{hoveredQueue.label}</div>
            <div className="mt-1 text-muted-foreground">건수 {hoveredQueue.count.toLocaleString()}건</div>
            <div className="text-muted-foreground">비중 {hoveredQueue.rate.toFixed(1)}%</div>
          </div>
        )}
        <div className="flex h-4 overflow-hidden rounded-full bg-muted">
          {QUEUE_STATUS.map(item => {
            const rate = queueTotal === 0 ? 0 : (item.count / queueTotal) * 100;
            return (
              <button
                key={item.label}
                type="button"
                className="h-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ width: `${Math.max(item.count === 0 ? 2 : 4, rate)}%`, backgroundColor: queueColors[item.label] }}
                onMouseEnter={event => showQueueTooltip(item, event)}
                onMouseMove={event => showQueueTooltip(item, event)}
                onMouseLeave={() => setHoveredQueue(null)}
                onFocus={() => setHoveredQueue({ label: item.label, count: item.count, rate, x: 16, y: 16 })}
                onBlur={() => setHoveredQueue(null)}
                aria-label={`${item.label}: ${item.count.toLocaleString()}건, ${rate.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CostComparisonCard({ title = "비용 비교 현황", className = "", chartClassName = "h-[220px] min-h-0", data = routingSavingsData, xKey = "month" }: {
  title?: string;
  className?: string;
  chartClassName?: string;
  data?: { [key: string]: string | number; actual: number; baseline: number; saved?: number }[];
  xKey?: string;
}) {
  return (
    <div className={`bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col ${className}`}>
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      <div className={chartClassName}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={84} tickFormatter={v => formatWon(Number(v))} />
            <Tooltip formatter={(v: number) => [formatWon(v)]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="actual" name="실제 청구 비용" stroke="#1843FA" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="baseline" name="최대 비용" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChannelShareCard({ title = "채널별 발송 비중", className = "", data = channelPie }: {
  title?: string;
  className?: string;
  data?: { name: string; value: number; color: string }[];
}) {
  return (
    <div className={`bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col ${className}`}>
      <h3 className="text-sm font-bold text-foreground mb-3">{title}</h3>
      <div className="grid min-h-0 flex-1 grid-cols-[0.8fr_1fr] gap-2">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3} label={({ value }) => `${value}%`} labelLine={false}>
              {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v: number) => [`${v}%`]} />
          </RePieChart>
        </ResponsiveContainer>
        <div className="grid content-center gap-1">
          {data.map((channel, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: channel.color }} />
              <span className="text-muted-foreground">{channel.name}</span>
              <span className="ml-auto font-bold">{channel.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailySendTrendCard({ title = "발송 & 성공 추이", gradientId = "dailySendsGrad", className = "", data = dailyTrend, xKey = "date" }: {
  title?: string;
  gradientId?: string;
  className?: string;
  data?: { [key: string]: string | number; sends: number; success: number }[];
  xKey?: string;
}) {
  return (
    <div className={`bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col ${className}`}>
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1843FA" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#1843FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
            <Tooltip formatter={(v: number) => [v.toLocaleString() + "건"]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="sends" stroke="#1843FA" fill={`url(#${gradientId})`} strokeWidth={2} name="발송" />
            <Area type="monotone" dataKey="success" stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 3" name="성공" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pw) { setError("아이디와 비밀번호를 입력해주세요."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 900);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">메시징 시스템</span>
          </div>
          <p className="text-sm text-muted-foreground">운영자 계정으로 로그인하세요</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">ID</label>
              <input
                value={id} onChange={e => { setId(e.target.value); setError(""); }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">비밀번호</label>
              <input
                type="password" value={pw} onChange={e => { setPw(e.target.value); setError(""); }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">ⓒ 2026 Messaging System. All rights reserved.</p>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { page: "dashboard" as Page, icon: LayoutDashboard, label: "대시보드" },
  { page: "send" as Page, icon: Send, label: "메시지 발송" },
  { page: "templates" as Page, icon: FileText, label: "템플릿 관리" },
  { page: "history" as Page, icon: History, label: "전송 기록" },
  { page: "members" as Page, icon: Users, label: "고객 관리" },
];
const STAT_ITEMS = [
  { page: "stats-overview" as Page, label: "발송 현황" },
  { page: "stats-channel" as Page, label: "채널 분석" },
  { page: "stats-routing" as Page, label: "비용 분석" },
  { page: "stats-member" as Page, label: "고객 분석" },
  { page: "stats-performance" as Page, label: "성과 분석" },
];

function Sidebar({ current, setCurrent, onLogout, onNavigate, className = "" }: {
  current: Page;
  setCurrent: (p: Page) => void;
  onLogout: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const [statsOpen, setStatsOpen] = useState(current.startsWith("stats"));
  const isStats = current.startsWith("stats");
  const goToPage = (page: Page) => {
    setCurrent(page);
    onNavigate?.();
  };

  return (
    <aside className={`w-64 lg:w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0 ${className}`}>
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">현대홈쇼핑</div>
            <div className="text-[10px] text-muted-foreground">관리자</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${current === page ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
        <div className="pt-1">
          <button
            onClick={() => setStatsOpen(v => !v)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isStats ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">통계</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${statsOpen ? "rotate-180" : ""}`} />
          </button>
          {statsOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
              {STAT_ITEMS.map(({ page, label }) => (
                <button
                  key={page}
                  onClick={() => { setCurrent(page); setStatsOpen(true); onNavigate?.(); }}
                  className={`w-full text-left px-2 py-2 rounded-lg text-xs font-medium transition-colors ${current === page ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Settings className="w-4 h-4" /> 설정
        </button>
        <button onClick={() => { onNavigate?.(); onLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<Page, string> = {
  dashboard: "대시보드", send: "메시지 발송", templates: "템플릿 관리", history: "전송 기록",
  members: "고객 관리", "stats-overview": "통계 · 발송 현황", "stats-channel": "통계 · 채널 분석",
  "stats-routing": "통계 · 비용 분석", "stats-member": "통계 · 고객 분석", "stats-performance": "통계 · 성과 분석",
};
function Header({ page, onMenuClick }: { page: Page; onMenuClick?: () => void }) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-3 sm:px-6 shrink-0">
      <div className="flex min-w-0 items-center gap-2">
        <button aria-label="메뉴 열기" onClick={onMenuClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="truncate text-sm font-bold text-foreground sm:text-base">{PAGE_TITLES[page]}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">김</div>
          <span className="hidden text-xs font-semibold text-foreground sm:inline">김민준</span>
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="총 발송 건수" value="892,451" icon={<Send className="w-4 h-4" />} color="blue" />
        <StatCard label="발송 성공률/실패 현황" value="98.7% / 165건" icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <StatCard label="활성 고객 수 (일반, 신규)" value="198,341" icon={<Users className="w-4 h-4" />} color="violet" />
        <StatCard label="실제 청구 비용" value={formatWon(18700000)} icon={<BarChart3 className="w-4 h-4" />} color="amber" />
        <StatCard label="스마트 라우팅 절감 현황" value={formatWon(5500000)} icon={<Zap className="w-4 h-4" />} color="green" />
      </div>

      <QueueStatusCard subtitle="대량 발송 엔진의 현재 처리 흐름입니다." onDetailClick={() => setPage("stats-routing")} />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-3 gap-3">
        <CostComparisonCard className="lg:col-span-2" chartClassName="min-h-0 flex-1" />
        <ChannelShareCard />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">최근 전송 기록</h3>
            <button onClick={() => setPage("history")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">전체보기 <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-1.5">
            {HISTORY.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <div className="text-xs font-semibold text-foreground">{r.template}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.sentAt} · {r.targetType}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-foreground">{r.count.toLocaleString()}건</div>
                  <Badge text={r.status} variant={r.status === "완료" ? "green" : "amber"} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <DailySendTrendCard title="일별 발송 추이" gradientId="dashboardDailySendsGrad" />
      </div>
    </div>
  );
}

// ─── Send Message Page ────────────────────────────────────────────────────────
const CHANNELS = [
  { id: "sms", label: "SMS", sub: "90자 이내 단문", icon: Phone },
  { id: "lms", label: "LMS", sub: "2,000자 이내 장문", icon: Mail },
  { id: "kakao-noti", label: "카카오 알림톡", sub: "거래/안내 메시지", icon: MessageSquare },
  { id: "kakao-friend", label: "카카오 친구톡", sub: "마케팅 메시지", icon: Megaphone },
  { id: "rcs", label: "RCS", sub: "리치 미디어 메시지", icon: Zap },
];
const CHANNEL_LABELS = CHANNELS.map(channel => channel.label);
const PERSONAL_FIELDS = [
  ["고객명", "#{이름}"],
  ["포인트", "#{포인트}"],
  ["주문번호", "#{주문번호}"],
  ["쿠폰명", "#{쿠폰명}"],
  ["쿠폰만료일", "#{쿠폰만료일}"],
  ["등급", "#{등급}"],
  ["매장명", "#{매장명}"],
  ["배송예정일", "#{배송예정일}"],
  ["추천상품", "#{추천상품}"],
];
const MESSAGE_PURPOSES: { id: MessagePurpose; label: string; icon: typeof Megaphone; color: "blue" | "green" }[] = [
  { id: "advertising", label: "광고성", icon: Megaphone, color: "blue" },
  { id: "informational", label: "정보성", icon: Info, color: "green" },
];
const getMessagePurposeMeta = (purpose: MessagePurpose) => MESSAGE_PURPOSES.find(item => item.id === purpose) ?? MESSAGE_PURPOSES[0];
function SendMessagePageWizard() {
  const members = useMemo(() => createMemberRows(), []);
  const templates = useMemo(() => createTemplateRows(), []);
  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>(["카카오 동의"]);
  const [targetMatchMode, setTargetMatchMode] = useState<"OR" | "AND">("OR");
  const [tagSearch, setTagSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [checkedMembers, setCheckedMembers] = useState<number[]>([]);
  const [targetSyncNotice, setTargetSyncNotice] = useState("");
  const [includedMembers, setIncludedMembers] = useState<Member[]>([]);
  const [excludedMembers, setExcludedMembers] = useState<Member[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateTargetFilters, setTemplateTargetFilters] = useState<string[]>([]);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("전체");
  const [templateChannelFilter, setTemplateChannelFilter] = useState("전체");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(templates[0]?.id ?? 0);
  const [messageDraft, setMessageDraft] = useState(templates[0]?.content ?? "");
  const [messagePurpose, setMessagePurpose] = useState<MessagePurpose>("advertising");
  const [previewMode, setPreviewMode] = useState<"message" | "kakao" | "email">("message");
  const [selectedChannel, setSelectedChannel] = useState("kakao-noti");
  const [channelSettingsOpen, setChannelSettingsOpen] = useState(true);
  const [channelPriority, setChannelPriority] = useState(["kakao-noti"]);
  const [sendType, setSendType] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("2026-06-26");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [failoverEnabled, setFailoverEnabled] = useState(true);
  const previewMessage = messageDraft
    .replaceAll("#{이름}", "고객님")
    .replaceAll("#{포인트}", "0")
    .replaceAll("#{주문번호}", "주문번호 없음")
    .replaceAll("#{쿠폰명}", "10% 할인 쿠폰")
    .replaceAll("#{쿠폰만료일}", "2026-06-30")
    .replaceAll("#{등급}", "VIP")
    .replaceAll("#{매장명}", "더현대 서울")
    .replaceAll("#{배송예정일}", "2026-06-28")
    .replaceAll("#{추천상품}", "여름 신상품");
  const [marketingCopies, setMarketingCopies] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<null | { title: string; reason: string; audience: string; template: string; channel: string; message: string }>(null);
  const [aiResult, setAiResult] = useState(false);
  const [aiReportOpen, setAiReportOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplateForm, setSaveTemplateForm] = useState<TemplateFormState>({ name: "", channel: "SMS", content: "", category: "이벤트", messagePurpose: "advertising", scope: "전사 공통" });
  const [aiJobs, setAiJobs] = useState([
    { name: "오타·맞춤법", model: "small-ko-proof", status: "대기", result: "-" },
    { name: "광고 표기", model: "small-policy-ad", status: "대기", result: "-" },
    { name: "민감 표현", model: "small-risk-ko", status: "대기", result: "-" },
    { name: "개인정보·마스킹", model: "small-privacy-ko", status: "대기", result: "-" },
    { name: "채널 길이", model: "small-channel-fit", status: "대기", result: "-" },
    { name: "발송 피로도", model: "small-frequency", status: "대기", result: "-" },
  ]);

  const selectedTemplate = templates.find(template => template.id === selectedTemplateId);
  const selectedMessagePurpose = MESSAGE_PURPOSES.find(purpose => purpose.id === messagePurpose) ?? MESSAGE_PURPOSES[0];
  const SelectedMessagePurposeIcon = selectedMessagePurpose.icon;
  const visibleTags = (tagSearch ? MEMBER_TAGS.filter(tag => tag.includes(tagSearch)) : MEMBER_TAGS).slice(0, 36);
  const relatedTags = MEMBER_TAGS
    .filter(tag => !selectedTags.includes(tag) && (tagSearch ? [...tagSearch].some(ch => tag.includes(ch)) : selectedTags.some(selected => tag.includes(selected) || selected.includes(tag))))
    .slice(0, 12);
  const targetMatchedMembers = useMemo(() => members.filter(member => {
    const tagMatch = selectedTags.length === 0 || selectedTags.includes("전체 고객") || (
      targetMatchMode === "AND"
        ? selectedTags.every(tag => memberMatchesTargetTag(member, tag))
        : selectedTags.some(tag => memberMatchesTargetTag(member, tag))
    );
    const hasReceivableChannel = member.smsConsent || member.kakaoConsent || member.emailConsent;
    return tagMatch && hasReceivableChannel;
  }), [members, selectedTags, targetMatchMode]);
  const targetMatchedMemberIds = useMemo(() => new Set(targetMatchedMembers.map(member => member.id)), [targetMatchedMembers]);
  const candidateMembers = useMemo(() => targetMatchedMembers.filter(member => {
    const memberTags = member.tags ?? [];
    return !memberSearch || member.name.includes(memberSearch) || member.phone.includes(memberSearch) || memberTags.some(tag => tag.includes(memberSearch));
  }), [memberSearch, targetMatchedMembers]);
  const visibleMembers = candidateMembers.slice(0, 32);
  const filteredTemplates = templates.filter(template => {
    const tags = getTemplateTags(template);
    const keywordMatch = !templateSearch || template.name.includes(templateSearch) || template.content.includes(templateSearch) || template.channel.includes(templateSearch) || tags.some(tag => tag.includes(templateSearch));
    const targetMatch = templateTargetFilters.length === 0 || templateTargetFilters.every(tag => tags.includes(tag));
    const categoryMatch = templateCategoryFilter === "전체" || template.category === templateCategoryFilter || tags.includes(templateCategoryFilter);
    const channelMatch = templateChannelFilter === "전체" || template.channel === templateChannelFilter;
    return keywordMatch && targetMatch && categoryMatch && channelMatch;
  });
  const visibleTemplates = filteredTemplates.slice(0, 10);
  const templateTargetOptions = uniqueTags(templates.flatMap(getTemplateTags)).slice(0, 8);
  const templateCategoryOptions = ["전체", ...Array.from(new Set(templates.map(template => template.category)))];
  const templateChannelOptions = ["전체", ...Array.from(new Set(templates.map(template => template.channel)))];
  const allVisibleMembersChecked = visibleMembers.length > 0 && visibleMembers.every(member => checkedMembers.includes(member.id));
  const checkedMemberRows = members.filter(member => checkedMembers.includes(member.id));
  const selectedRecipientCount = checkedMembers.length || targetMatchedMembers.length;
  const estimatedTarget = selectedTags.includes("전체 고객") && checkedMembers.length === 0 ? 284391 : Math.max(selectedRecipientCount, targetMatchedMembers.length * 1370);
  const messageMode = messageDraft.length > 90 ? "LMS" : "SMS";
  const selectedChannelMeta = CHANNELS.find(channel => channel.id === selectedChannel);
  const channelUnitCost = (channelId: string) => channelId === "sms" ? 10 : channelId === "lms" ? 30 : channelId === "kakao-noti" ? 6 : channelId === "rcs" ? 14 : 8;
  const unitCost = !selectedChannel ? 0 : channelUnitCost(selectedChannel);
  const estimatedCost = estimatedTarget * unitCost;
  const baselineCost = estimatedTarget * (messageMode === "LMS" ? 30 : 10);
  const estimatedSaving = Math.max(0, baselineCost - estimatedCost);
  const channelAudienceBase = checkedMembers.length > 0 ? checkedMemberRows : targetMatchedMembers;
  const channelAudienceRatio = (channelId: string) => {
    if (channelAudienceBase.length === 0) return 1;
    const reachableCount = channelAudienceBase.filter(member => {
      if (channelId === "sms" || channelId === "lms") return member.smsConsent;
      if (channelId === "kakao-noti" || channelId === "kakao-friend") return member.kakaoConsent;
      if (channelId === "rcs") return member.rcsConsent;
      return member.smsConsent || member.kakaoConsent || member.rcsConsent || member.emailConsent;
    }).length;
    return Math.max(0.08, reachableCount / channelAudienceBase.length);
  };
  const getChannelEstimate = (channelId: string) => {
    const count = Math.round(estimatedTarget * channelAudienceRatio(channelId));
    const cost = count * channelUnitCost(channelId);
    return { count, cost };
  };
  const selectedChannelSummary = channelPriority
    .map(channelId => CHANNELS.find(channel => channel.id === channelId)?.label)
    .filter(Boolean)
    .join(" > ");
  const selectedChannelLabels = channelPriority
    .map(channelId => CHANNELS.find(channel => channel.id === channelId)?.label)
    .filter(Boolean);
  const aiComplete = aiJobs.every(job => job.status === "완료") && aiResult;
  const messageStepReady = messageDraft.trim().length > 0 && !!selectedChannel && aiComplete;
  const canSend = selectedTags.length > 0 && messageStepReady;
  const stepMeta = ["수신자 선택", "메시지 작성", "검토 및 발송"];
  const stepReady = [
    selectedTags.length > 0,
    messageStepReady,
    canSend,
  ];
  const nextDisabledReason = step === 1 && !stepReady[0]
    ? "수신자를 먼저 선택해 주세요."
    : step === 2 && !messageDraft.trim()
      ? "메시지를 작성해 주세요."
      : step === 2 && !selectedChannel
        ? "채널을 선택해 주세요."
        : step === 2 && !aiComplete
          ? "AI 검사를 완료해야 검토 및 발송으로 이동할 수 있습니다."
          : "";
  const canGoToStep = (value: number) => value === 1 || stepReady.slice(0, value - 1).every(Boolean);

  useEffect(() => {
    setCheckedMembers(prev => {
      const next = prev.filter(id => targetMatchedMemberIds.has(id));
      const removedCount = prev.length - next.length;
      if (removedCount > 0) {
        setTargetSyncNotice(`타겟 조건이 바뀌어 조건에서 벗어난 고객 ${removedCount.toLocaleString()}명을 선택 해제했습니다.`);
        return next;
      }
      return prev;
    });
  }, [targetMatchedMemberIds]);

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
  const selectAllMembers = () => {
    setSelectedTags(["전체 고객"]);
    setCheckedMembers([]);
    setMemberSearch("");
    setTargetSyncNotice("전체 고객 타겟으로 전환했습니다. 개별 고객 선택은 초기화되었습니다.");
  };
  const selectAllSearchedMembers = () => {
    setCheckedMembers(candidateMembers.map(member => member.id));
    setTargetSyncNotice("");
  };
  const clearSelectedMembers = () => {
    setCheckedMembers([]);
    setTargetSyncNotice("");
  };
  const toggleVisibleMembers = () => {
    const visibleIds = visibleMembers.map(member => member.id);
    setCheckedMembers(prev => allVisibleMembersChecked ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])));
    setTargetSyncNotice("");
  };
  const toggleTemplateTargetFilter = (tag: string) => {
    setTemplateTargetFilters(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
  };
  const toggleChannelPriority = (channelId: string) => {
    if (channelId === "rcs") return;
    setChannelPriority(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      setSelectedChannel(next[0] ?? "");
      return next;
    });
  };
  const insertVariable = (value: string) => setMessageDraft(prev => `${prev}${prev.endsWith(" ") || prev.length === 0 ? "" : " "}${value}`);
  const recommendMarketingCopy = () => {
    const copies = [
      "[현대퓨처넷] #{이름}님, 지금 #{등급} 고객님께 준비된 #{쿠폰명}이 도착했습니다. #{쿠폰만료일} 전에 혜택을 확인해 주세요.",
      "[현대퓨처넷] #{이름}님을 위한 #{추천상품} 혜택을 준비했습니다. 가까운 #{매장명} 또는 앱에서 특별 혜택을 만나보세요.",
      "[현대퓨처넷] #{이름}님, 보유 포인트 #{포인트}P와 함께 사용할 수 있는 혜택이 있습니다. 오늘 추천 상품을 확인해 보세요.",
    ];
    setMarketingCopies(copies);
  };
  const toggleMemberCheck = (id: number) => {
    setCheckedMembers(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    setTargetSyncNotice("");
  };
  const mergeMembers = (base: Member[], add: Member[]) => [...base, ...add.filter(member => !base.some(item => item.id === member.id))];
  const addChecked = () => {
    const checked = members.filter(member => checkedMembers.includes(member.id));
    setIncludedMembers(prev => mergeMembers(prev, checked));
    setExcludedMembers(prev => prev.filter(member => !checkedMembers.includes(member.id)));
    setCheckedMembers([]);
  };
  const excludeChecked = () => {
    const checked = members.filter(member => checkedMembers.includes(member.id));
    setExcludedMembers(prev => mergeMembers(prev, checked));
    setIncludedMembers(prev => prev.filter(member => !checkedMembers.includes(member.id)));
    setCheckedMembers([]);
  };
  const addManualMember = () => {
    if (!manualName.trim() || !manualPhone.trim()) return;
    const manual: Member = { id: Date.now(), name: manualName, phone: manualPhone, type: "수동", smsConsent: true, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "-", lastSend: "-", tags: ["수동 추가"] };
    setIncludedMembers(prev => mergeMembers(prev, [manual]));
    setManualName("");
    setManualPhone("");
  };
  const pickTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setMessageDraft(template.content);
  };
  const openSaveTemplate = () => {
    setSaveTemplateForm({
      name: selectedTemplate ? `${selectedTemplate.name} 복사본` : "새 메시지 템플릿",
      channel: selectedChannelMeta?.label ?? "SMS",
      content: messageDraft,
      category: selectedTemplate?.category ?? "이벤트",
      messagePurpose,
      scope: selectedTemplate?.scope ?? "전사 공통",
    });
    setSaveTemplateOpen(true);
  };
  const runAiPlan = () => {
    setAiLoading(true);
    window.setTimeout(() => {
      const template = templates.find(item => getTemplateTags(item).includes("최근구매")) ?? templates[0];
      const message = "[현대퓨처넷] #{이름}님, 최근 관심 상품 기준으로 선별한 우수고객 혜택이 준비되었습니다. 앱에서 쿠폰과 사용 기간을 확인해 주세요. 수신거부 080-000-0000";
      setAiPlan({
        title: "최근구매 고객 재구매 캠페인",
        reason: "최근구매·카카오 동의·일반 타겟 조합의 예상 반응률이 가장 높습니다.",
        audience: "일반, 최근구매, 카카오 동의",
        template: template.name,
        channel: "카카오 친구톡",
        message,
      });
      setSelectedTags(["일반", "최근구매", "카카오 동의"]);
      setMessagePurpose("advertising");
      setSelectedChannel("kakao-friend");
      setSelectedTemplateId(template.id);
      setMessageDraft(message);
      setCheckedMembers(members.filter(member => member.tags?.includes("최근구매") && member.kakaoConsent).slice(0, 12).map(member => member.id));
      setStep(2);
      setAiLoading(false);
    }, 1200);
  };
  const runAiCheck = () => {
    setAiResult(false);
    setAiReportOpen(false);
    setAiJobs(jobs => jobs.map(job => ({ ...job, status: "실행중", result: "queued" })));
    aiJobs.forEach((job, index) => {
      window.setTimeout(() => {
        setAiJobs(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, status: "완료", result: ["정상", messagePurpose === "advertising" ? "광고성 표기 확인" : "정보성 기준 확인", "위험 없음", "마스킹 필요 없음", messageDraft.length > 90 ? "LMS/RCS 권장" : "SMS 가능", "빈도 정상"][index] } : item));
        if (index === aiJobs.length - 1) setAiResult(true);
      }, 500 + index * 280);
    });
  };

  const renderAiRecommendation = () => (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-sm font-bold mb-1">AI 자동 추천</h3>
          <p className="text-xs text-muted-foreground">수신자, 템플릿, 채널, 문구를 한 번에 추천하고 단계별 화면에 반영합니다.</p>
        </div>
        <Btn onClick={runAiPlan} disabled={aiLoading}>
          <Sparkles className="w-3.5 h-3.5" />{aiLoading ? "추천 중..." : "추천 받기"}
        </Btn>
      </div>
      {aiPlan && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
          <div className="rounded-lg border border-border bg-muted p-4">
            <div className="text-sm font-bold mb-1">{aiPlan.title}</div>
            <p className="text-xs text-muted-foreground mb-3">{aiPlan.reason}</p>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">{aiPlan.message}</pre>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {[["대상", aiPlan.audience], ["템플릿", aiPlan.template], ["채널", aiPlan.channel], ["예상 대상", `${estimatedTarget.toLocaleString()}명`]].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className="text-xs font-bold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRecipients = () => (
    <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[360px_1fr] gap-3">
      <div className="rounded-xl border border-border bg-card p-4 flex min-h-0 flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">타겟 선택</h3>
          <button onClick={selectAllMembers} className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary">
            전체 고객
          </button>
        </div>
        <div className="space-y-3 min-h-0 flex-1">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-primary">현재 타겟</span>
              <span className="text-[11px] font-bold text-muted-foreground">{targetMatchedMembers.length.toLocaleString()}명 후보</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedTags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className="rounded-full bg-primary px-2 py-1 text-[11px] font-bold text-white">
                  {tag} ×
                </button>
              ))}
              {selectedTags.length === 0 && <span className="text-xs font-semibold text-muted-foreground">타겟을 선택해 주세요.</span>}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={tagSearch} onChange={event => setTagSearch(event.target.value)} placeholder="타겟 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground">조건</div>
          </div>
          <div className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1">
            {(["OR", "AND"] as const).map(option => (
              <button key={option} onClick={() => setTargetMatchMode(option)} className={`px-3 py-1.5 rounded-md text-xs font-bold ${targetMatchMode === option ? "bg-primary text-white" : "text-muted-foreground hover:bg-card"}`}>
                {option === "OR" ? "하나라도 포함" : "모두 포함"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-muted p-2">
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${selectedTags.includes(tag) ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {relatedTags.length > 0 && (
            <div className="rounded-lg border border-border bg-muted p-2">
              <div className="text-xs font-bold text-muted-foreground mb-2">유사 타겟</div>
              <div className="flex flex-wrap gap-1.5">
                {relatedTags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} className="px-2.5 py-1 rounded-full text-xs font-semibold border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-full min-h-0">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border bg-muted p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="고객명, 번호, 타겟 검색" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none" />
            </div>
            <button onClick={selectAllSearchedMembers} disabled={candidateMembers.length === 0} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">
              검색 결과 선택
            </button>
            <button onClick={clearSelectedMembers} disabled={checkedMembers.length === 0} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-bold text-muted-foreground hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40">
              선택 해제
            </button>
          </div>
          <div className="border-b border-border bg-card px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground">
                타겟 후보 {targetMatchedMembers.length.toLocaleString()}명
              </span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700">
                현재 표시 {candidateMembers.length.toLocaleString()}명
              </span>
              <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary">
                직접 선택 {checkedMembers.length.toLocaleString()}명
              </span>
              {checkedMemberRows.slice(0, 5).map(member => (
                <span key={member.id} className="rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                  {member.name}
                </span>
              ))}
              {checkedMemberRows.length > 5 && <span className="text-[11px] font-semibold text-muted-foreground">+{checkedMemberRows.length - 5}명</span>}
            </div>
            {targetSyncNotice && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                {targetSyncNotice}
              </div>
            )}
          </div>
          <div className="overflow-x-auto border-b border-border">
            <div className="grid min-w-[760px] grid-cols-[36px_0.8fr_1fr_0.45fr_2.2fr_0.45fr_0.45fr_0.45fr] gap-3 bg-muted/60 px-3 py-2 text-xs font-bold text-muted-foreground">
            <button type="button" onClick={toggleVisibleMembers} className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${allVisibleMembersChecked ? "border-primary bg-primary text-white" : "border-border bg-card text-transparent hover:border-primary"}`}>
              <Check className="h-3.5 w-3.5" />
            </button>
            <span>고객명</span>
            <span>번호</span>
            <span>유형</span>
            <span>타겟</span>
            <span>문자</span>
            <span>카카오</span>
            <span>이메일</span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {visibleMembers.map(member => {
              const checked = checkedMembers.includes(member.id);
              return (
                <label key={member.id} className="grid min-w-[760px] grid-cols-[36px_0.8fr_1fr_0.45fr_2.2fr_0.45fr_0.45fr_0.45fr] gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-blue-50/60 cursor-pointer transition-colors">
                  <span className={`relative flex h-5 w-5 items-center justify-center rounded border transition-colors ${checked ? "border-primary bg-primary text-white" : "border-border bg-card text-transparent"}`}>
                    <Check className="h-3.5 w-3.5" />
                    <input className="sr-only" type="checkbox" checked={checked} onChange={() => toggleMemberCheck(member.id)} />
                  </span>
                  <span className="text-xs font-bold">{member.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{member.phone}</span>
                  <span className="text-xs text-muted-foreground">{member.type}</span>
                  <div className="flex min-w-0 gap-1 overflow-hidden whitespace-nowrap">
                    {(member.tags ?? []).slice(0, 5).map(tag => <span key={tag} className="shrink-0 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}
                  </div>
                  <span>{member.smsConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</span>
                  <span>{member.kakaoConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</span>
                  <span>{member.emailConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</span>
                </label>
              );
            })}
            {visibleMembers.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">수신 가능한 채널이 있는 고객만 표시됩니다.</div>
            )}
          </div>
          <div className="flex h-12 shrink-0 items-center border-t border-primary/15 bg-primary/5 px-4">
            <span className="text-sm font-bold text-foreground">
              {checkedMembers.length > 0
                ? `타겟 후보 ${targetMatchedMembers.length.toLocaleString()}명 중 ${checkedMembers.length.toLocaleString()}명 직접 선택`
                : `직접 선택 없음 · 타겟 후보 ${targetMatchedMembers.length.toLocaleString()}명 전체 적용`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChannelSettings = () => (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={() => setChannelSettingsOpen(prev => !prev)} className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-bold">채널 선택</h3>
          <p className="mt-1 text-xs text-muted-foreground">{selectedChannelSummary || "채널 미선택"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
            {estimatedTarget.toLocaleString()}명
          </span>
          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            {formatWon(estimatedCost)}
          </span>
          <span className="flex items-center gap-1.5 px-1 text-xs font-bold text-muted-foreground">
            {channelSettingsOpen ? "접기" : "더보기"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${channelSettingsOpen ? "rotate-180" : ""}`} />
          </span>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-out ${channelSettingsOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
            {CHANNELS.map(channel => {
              const priority = channelPriority.indexOf(channel.id) + 1;
              const estimate = getChannelEstimate(channel.id);
              const disabled = channel.id === "rcs";
              const selected = priority > 0;
              return (
                <button key={channel.id} disabled={disabled} onClick={() => toggleChannelPriority(channel.id)} className={`relative rounded-lg border p-3 text-left transition-all ${disabled ? "cursor-not-allowed border-border bg-muted/40 opacity-55" : selected ? "cursor-pointer border-primary bg-accent shadow-sm" : "cursor-pointer border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-md ${selected ? "bg-primary text-white" : "bg-muted text-primary"}`}>
                      <channel.icon className="h-4 w-4" />
                    </span>
                    {disabled ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">비활성</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${priority > 0 ? "border-primary bg-primary text-white" : "border-border bg-muted text-muted-foreground"}`}>
                          {priority || "+"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold">{channel.label}</div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{channelUnitCost(channel.id)}원/건</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{channel.sub}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">대상 인원</span>
                    <b className="text-right">{estimate.count.toLocaleString()}명</b>
                    <span className="text-muted-foreground">예상 금액</span>
                    <b className="text-right">{formatWon(estimate.cost)}</b>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessage = () => (
    <div className="flex min-h-full flex-col gap-4">
      {renderChannelSettings()}
      <div className="grid grid-cols-1 gap-4 xl:h-[640px] xl:shrink-0 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card xl:min-h-0">
          <div className="min-h-[236px] p-5 border-b border-border">
            <div className="mb-3 flex min-h-[36px] items-center">
              <h3 className="text-sm font-bold">템플릿 검색</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={templateSearch} onChange={event => setTemplateSearch(event.target.value)} placeholder="템플릿명, 채널, 문구 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={templateCategoryFilter} onChange={event => setTemplateCategoryFilter(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
                {templateCategoryOptions.map(option => <option key={option}>{option}</option>)}
              </select>
              <select value={templateChannelFilter} onChange={event => setTemplateChannelFilter(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
                {templateChannelOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {templateTargetOptions.map(tag => (
                <button key={tag} onClick={() => toggleTemplateTargetFilter(tag)} className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-bold ${templateTargetFilters.includes(tag) ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-primary/25 bg-blue-50 px-3 py-2">
              <div className="text-[11px] font-bold text-primary">선택한 템플릿</div>
              <div className="mt-1 truncate text-xs font-bold text-blue-950">{selectedTemplate ? selectedTemplate.name : "직접 작성"}</div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {visibleTemplates.map(template => (
              <button key={template.id} onClick={() => pickTemplate(template)} className={`block w-full cursor-pointer text-left px-4 py-3 border-b border-border last:border-0 ${selectedTemplateId === template.id ? "bg-accent" : "bg-card"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold truncate">{template.name}</span>
                  <Badge text={template.channel} variant="blue" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.content.replace(/\n/g, " ")}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {getTemplateTags(template).slice(0, 3).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}
                </div>
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border bg-muted text-xs text-muted-foreground">
            {filteredTemplates.length.toLocaleString()}건 검색됨
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col rounded-xl border border-border bg-card p-4 sm:p-5 xl:min-h-0">
          <div className="mb-4 flex min-h-[36px] flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold">메시지 작성</h3>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button title="템플릿 저장" onClick={openSaveTemplate} className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-accent sm:flex-none">
              <FileText className="w-3.5 h-3.5" /> 템플릿 저장
            </button>
            <button title="AI 문구 추천" onClick={recommendMarketingCopy} className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary/90 sm:flex-none">
              <Sparkles className="w-3.5 h-3.5" /> AI 문구 추천
            </button>
            <button title="AI 검사" onClick={runAiCheck} disabled={!messageDraft || aiJobs.some(job => job.status === "실행중")} className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
              <CheckCircle2 className="w-3.5 h-3.5" /> AI 검사
            </button>
            </div>
          </div>
          {marketingCopies.length > 0 && (
            <div className="mb-3 rounded-xl border border-border bg-muted p-3">
              <div className="mb-2 text-xs font-bold text-muted-foreground">AI 추천 문구</div>
              <div className="space-y-2">
                {marketingCopies.map(copy => (
                  <button key={copy} onClick={() => { setMessageDraft(copy); setSelectedTemplateId(0); }} className="block w-full rounded-lg bg-card px-3 py-2 text-left text-xs leading-relaxed text-foreground">
                    {copy}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(aiJobs.some(job => job.status === "실행중") || aiComplete) && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {aiJobs.slice(0, 3).map(job => (
                <Badge key={job.name} text={`${job.name} ${job.status}`} variant={job.status === "완료" ? "green" : job.status === "실행중" ? "amber" : "default"} />
              ))}
              {aiComplete && (
                <button onClick={() => setAiReportOpen(true)} className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm">
                  <Eye className="h-3 w-3" /> 리포트 보기
                </button>
              )}
            </div>
          )}
          <div className="mb-3">
            <div className="mb-2 text-xs font-bold text-muted-foreground">광고여부</div>
            <div className="grid grid-cols-2 gap-2">
              {MESSAGE_PURPOSES.map(purpose => {
                const Icon = purpose.icon;
                const selected = messagePurpose === purpose.id;
                return (
                  <button key={purpose.id} onClick={() => setMessagePurpose(purpose.id)} className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors ${selected ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {purpose.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-3">
            <div className="mb-2 text-xs font-bold text-muted-foreground">개인화 항목</div>
            <div className="flex flex-wrap gap-2">
            {PERSONAL_FIELDS.map(([label, value]) => (
              <button key={value} onClick={() => insertVariable(value)} className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground">{label}</button>
            ))}
            </div>
          </div>
          <textarea value={messageDraft} onChange={event => { setMessageDraft(event.target.value); setSelectedTemplateId(0); }} className="min-h-[220px] flex-1 w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 xl:min-h-0" />
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex min-h-[36px] flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold">미리보기</h3>
            <div className="inline-flex rounded-lg border border-border bg-muted p-1">
              {[
                ["message", "메시지"],
                ["kakao", "카카오톡"],
                ["email", "이메일"],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setPreviewMode(value as "message" | "kakao" | "email")} className={`px-2.5 py-1.5 rounded-md text-xs font-bold ${previewMode === value ? "bg-primary text-white" : "text-muted-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="mb-3 flex justify-end">
            <Badge text={selectedMessagePurpose.label} variant={selectedMessagePurpose.color} />
          </div>
          <div className="relative mx-auto aspect-[1179/2556] w-full max-w-[260px] shrink-0 overflow-hidden rounded-[2.8rem] bg-gradient-to-b from-slate-700 via-slate-950 to-black p-[6px] shadow-2xl ring-1 ring-slate-500/40">
            <div className="absolute -left-1 top-24 h-14 w-1 rounded-l bg-slate-800" />
            <div className="absolute -right-1 top-32 h-20 w-1 rounded-r bg-slate-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[2.35rem] bg-white">
              <div className="absolute left-1/2 top-3 z-30 flex h-6 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black shadow-lg">
                <span className="mr-2 h-1.5 w-7 rounded-full bg-slate-700" />
                <span className="h-2 w-2 rounded-full bg-slate-800 ring-1 ring-slate-600" />
              </div>
              <div className={`flex items-center justify-between px-6 pb-2 pt-4 text-[11px] font-bold ${previewMode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-slate-50 text-slate-700"}`}>
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-3.5 rounded-sm border border-current" />
                  <span className="h-2 w-3 rounded-sm bg-current" />
                </span>
              </div>
              <div className={`border-b border-black/5 px-5 py-3 text-center text-xs font-bold ${previewMode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-white text-slate-800"}`}>
                {previewMode === "message" ? "메시지" : previewMode === "kakao" ? "카카오톡" : "Mail"}
              </div>
              <div className={`h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 pb-10 ${previewMode === "message" ? "bg-white" : previewMode === "kakao" ? "bg-[#BACEDE]" : "bg-slate-50"}`}>
                {previewMode === "email" ? (
                  <div className="min-h-full bg-white text-slate-900">
                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">M</div>
                      <div className="text-sm font-bold">Gmail</div>
                    </div>
                    <div className="mb-3 text-base font-bold leading-snug">{selectedTemplate ? selectedTemplate.name : "메시지 제목"}</div>
                    <div className="mb-4 flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">현</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-xs font-bold">현대퓨처넷</div>
                          <div className="text-[10px] text-muted-foreground">오전 9:41</div>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">to me</div>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-xs leading-relaxed text-foreground shadow-sm">{previewMessage}</div>
                    <div className="mt-4 flex gap-2">
                      <button className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground">답장</button>
                      <button className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground">전달</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-[11px] text-muted-foreground">{previewMode === "message" ? "010-0000-0000" : "현대퓨처넷"}</div>
                    <div className={`max-w-[185px] p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${previewMode === "message" ? "ml-auto rounded-2xl bg-primary text-white" : "rounded-2xl rounded-tl-sm bg-[#FFF8C5]"}`}>
                      {previewMessage}
                    </div>
                    {previewMode === "kakao" && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5 max-w-[185px]">
                        <button className="rounded-lg bg-white px-2 py-2 text-[11px] font-bold text-[#3A1D1D]">쿠폰 확인</button>
                        <button className="rounded-lg bg-white px-2 py-2 text-[11px] font-bold text-[#3A1D1D]">상세 보기</button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="absolute bottom-2.5 left-1/2 h-1.5 w-28 -translate-x-1/2 rounded-full bg-slate-900/85" />
            </div>
          </div>
          {messageDraft.length > 90 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> SMS 길이를 초과해 LMS 기준 비용으로 계산될 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold">발송 방식</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={() => setSendType("now")} className={`cursor-pointer rounded-lg border px-3 py-3 text-left transition-colors ${sendType === "now" ? "border-primary bg-accent" : "border-border bg-card"}`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Clock className="h-4 w-4 text-primary" /> 즉시 발송
              </div>
            </button>
            <button onClick={() => setSendType("later")} className={`cursor-pointer rounded-lg border px-3 py-3 text-left transition-colors ${sendType === "later" ? "border-primary bg-accent" : "border-border bg-card"}`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <CalendarDays className="h-4 w-4 text-primary" /> 예약 발송
              </div>
            </button>
          </div>
          {sendType === "later" && (
            <div className="mt-3 rounded-xl border border-border bg-muted p-3">
              <div className="mb-2 text-xs font-bold text-muted-foreground">예약 일시</div>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  ["오늘 10:00", "2026-06-26", "10:00"],
                  ["오늘 14:00", "2026-06-26", "14:00"],
                  ["내일 09:00", "2026-06-27", "09:00"],
                ].map(([label, date, time]) => (
                  <button key={label} onClick={() => { setScheduleDate(date); setScheduleTime(time); }} className={`cursor-pointer rounded-lg border px-2 py-2 text-xs font-bold ${scheduleDate === date && scheduleTime === time ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="text-xs font-bold text-muted-foreground">
                  날짜
                  <input type="date" value={scheduleDate} onChange={event => setScheduleDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                </label>
                <label className="text-xs font-bold text-muted-foreground">
                  시간
                  <input type="time" value={scheduleTime} onChange={event => setScheduleTime(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold">비용 계산</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="text-xs font-bold text-muted-foreground">대상 인원</div>
              <div className="mt-2 text-xl font-bold">{estimatedTarget.toLocaleString()}명</div>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="text-xs font-bold text-muted-foreground">광고여부</div>
              <div className="mt-2 flex items-center gap-2 text-xl font-bold">
                <SelectedMessagePurposeIcon className="h-4 w-4 text-primary" />
                {selectedMessagePurpose.label}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="text-xs font-bold text-muted-foreground">채널</div>
              <div className="mt-2 space-y-1.5">
                {selectedChannelLabels.length > 0 ? selectedChannelLabels.map((label, index) => (
                  <div key={label} className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-white">{index + 1}</span>
                    <span>{label}</span>
                  </div>
                )) : <span className="text-xl font-bold">미선택</span>}
              </div>
            </div>
            <div className="rounded-xl border border-primary/20 bg-blue-50 p-4 text-blue-800">
              <div className="text-xs font-bold text-blue-600">예상 발송 비용</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatWon(estimatedCost)}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <div className="text-xs font-bold">예상 절감액</div>
              <div className="mt-2 text-2xl font-bold">{formatWon(estimatedSaving)}</div>
              <div className="mt-2 text-xs font-semibold">{formatWon(baselineCost)} - {formatWon(estimatedCost)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {stepMeta.map((label, index) => {
              const value = index + 1;
              const active = step === value;
              const done = step > value;
              const disabledStep = !canGoToStep(value);
              return (
                <button key={label} disabled={disabledStep} title={disabledStep ? "이전 단계를 먼저 완료해 주세요." : label} onClick={() => setStep(value)} className={`flex items-center gap-2 text-left ${disabledStep ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${active ? "bg-primary border-primary text-white" : done ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : value}
                  </span>
                  <span className={`whitespace-nowrap text-xs font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  {value < stepMeta.length && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {step === 1 && renderRecipients()}
        {step === 2 && renderMessage()}
        {step === 3 && renderReview()}
      </div>

      <div className="border-t border-border bg-background/95 pt-3">
        <div className="flex items-center justify-between">
          <Btn variant="outline" disabled={step === 1} onClick={() => setStep(prev => Math.max(1, prev - 1))}>이전</Btn>
          <div />
          {step < stepMeta.length ? (
            <div className="relative flex items-center">
              {!stepReady[step - 1] && nextDisabledReason && (
                <div className="absolute bottom-full right-0 mb-2 w-max max-w-none whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white shadow-lg">
                  {nextDisabledReason}
                  <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-blue-700" />
                </div>
              )}
              <span title={!stepReady[step - 1] ? nextDisabledReason || "필수값을 완료해 주세요." : ""}>
                <Btn disabled={!stepReady[step - 1]} onClick={() => setStep(prev => Math.min(stepMeta.length, prev + 1))}>다음 <ChevronRight className="w-3.5 h-3.5" /></Btn>
              </span>
            </div>
          ) : (
            <Btn variant="success" disabled={!canSend} onClick={() => alert("발송 요청이 생성되었습니다.")}><Send className="w-3.5 h-3.5" /> 발송 요청</Btn>
          )}
        </div>
      </div>
      <Modal open={aiReportOpen} onClose={() => setAiReportOpen(false)} title="AI 검사 리포트" wide>
        <AiReportDetail />
      </Modal>
      <Modal open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} title="템플릿 저장" wide>
        <TemplateFormFields
          form={saveTemplateForm}
          setForm={setSaveTemplateForm}
          onCancel={() => setSaveTemplateOpen(false)}
          onSave={() => { setSaveTemplateOpen(false); alert("템플릿이 저장되었습니다."); }}
        />
      </Modal>
    </div>
  );
}

function RecipientBox({ title, members, onRemove }: { title: string; members: Member[]; onRemove: (id: number) => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 min-h-36">
      <div className="text-xs font-bold mb-2">{title} <span className="text-muted-foreground">{members.length}</span></div>
      <div className="space-y-1.5">
        {members.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">선택 없음</div>}
        {members.slice(0, 6).map(member => (
          <div key={member.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2 py-1.5">
            <span className="text-xs font-semibold truncate">{member.name}</span>
            <button onClick={() => onRemove(member.id)} className="text-muted-foreground hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
          </div>
        ))}
        {members.length > 6 && <div className="text-xs text-muted-foreground">외 {members.length - 6}명</div>}
      </div>
    </div>
  );
}

// ─── Templates Page ───────────────────────────────────────────────────────────
function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(() => createTemplateRows());
  const [search, setSearch] = useState("");
  const [targetFilters, setTargetFilters] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [channelFilter, setChannelFilter] = useState("전체");
  const [purposeFilter, setPurposeFilter] = useState<"전체" | MessagePurpose>("전체");
  const [page, setPage] = useState(1);
  const [editModal, setEditModal] = useState<Template | null>(null);
  const [detailModal, setDetailModal] = useState<Template | null>(null);
  const [templatePreviewMode, setTemplatePreviewMode] = useState<"message" | "kakao" | "email">("kakao");
  const [addModal, setAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateFormState>({ name: "", channel: "SMS", content: "", category: "이벤트", messagePurpose: "advertising", scope: "전사 공통" });

  const filtered = useMemo(() => templates.filter(t => {
    const tags = getTemplateTags(t);
    const purposeMeta = getMessagePurposeMeta(t.messagePurpose);
    const keyword = !search || t.name.includes(search) || t.content.includes(search) || t.channel.includes(search) || t.category.includes(search) || purposeMeta.label.includes(search) || tags.some(tag => tag.includes(search));
    const targetMatch = targetFilters.length === 0 || targetFilters.every(tag => tags.includes(tag));
    const categoryMatch = categoryFilter === "전체" || t.category === categoryFilter;
    const channelMatch = channelFilter === "전체" || t.channel === channelFilter;
    const purposeMatch = purposeFilter === "전체" || t.messagePurpose === purposeFilter;
    return keyword && targetMatch && categoryMatch && channelMatch && purposeMatch;
  }), [templates, search, targetFilters, categoryFilter, channelFilter, purposeFilter]);
  const pageSize = 10;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pagedTemplates = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const targetOptions = uniqueTags(templates.flatMap(getTemplateTags)).slice(0, 16);
  const categoryOptions = ["전체", ...Array.from(new Set(templates.map(template => template.category))).sort((a, b) => a.localeCompare(b, "ko"))];
  const channelFilterOptions = ["전체", ...Array.from(new Set(templates.map(template => template.channel))).sort((a, b) => a.localeCompare(b, "ko"))];
  const toggleTargetFilter = (tag: string) => {
    setTargetFilters(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
    setPage(1);
  };

  const saveTemplate = () => {
    if (editModal) {
      setTemplates(prev => prev.map(t => t.id === editModal.id ? { ...t, ...form } : t));
    } else {
      setTemplates(prev => [...prev, { id: Date.now(), ...form, usageCount: 0, updatedAt: new Date().toISOString().slice(0, 10) }]);
    }
    setEditModal(null); setAddModal(false); setForm({ name: "", channel: "SMS", content: "", category: "이벤트", messagePurpose: "advertising", scope: "전사 공통" });
  };

  const openEdit = (t: Template) => { setEditModal(t); setForm({ name: t.name, channel: t.channel, content: t.content, category: t.category, messagePurpose: t.messagePurpose, scope: t.scope ?? "전사 공통" }); };

  return (
    <div className="space-y-4 p-3 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="템플릿명, 내용, 카테고리 검색..." className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-72" />
          </div>
          <select value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setPage(1); }} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
            {categoryOptions.map(option => <option key={option}>{option}</option>)}
          </select>
          <select value={channelFilter} onChange={event => { setChannelFilter(event.target.value); setPage(1); }} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
            {channelFilterOptions.map(option => <option key={option}>{option}</option>)}
          </select>
          <select value={purposeFilter} onChange={event => { setPurposeFilter(event.target.value as "전체" | MessagePurpose); setPage(1); }} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
            <option value="전체">전체 광고여부</option>
            {MESSAGE_PURPOSES.map(purpose => <option key={purpose.id} value={purpose.id}>{purpose.label}</option>)}
          </select>
        </div>
        <Btn onClick={() => { setAddModal(true); setForm({ name: "", channel: "SMS", content: "", category: "이벤트", messagePurpose: "advertising", scope: "전사 공통" }); }}><Plus className="w-3.5 h-3.5" /> 템플릿 추가</Btn>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {targetOptions.map(tag => (
          <button key={tag} onClick={() => toggleTargetFilter(tag)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${targetFilters.includes(tag) ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>{tag}</button>
        ))}
      </div>
      <div className="bg-card overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead><tr className="bg-muted border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">템플릿명</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">카테고리</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">광고여부</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">타겟</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">채널</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">사용 횟수</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">수정일</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">작업</th>
            </tr></thead>
            <tbody>{pagedTemplates.map(t => (
              <tr key={t.id} onClick={() => setDetailModal(t)} className="border-b border-border hover:bg-blue-50/70 transition-colors cursor-pointer">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-foreground text-xs">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{t.content.replace(/\n/g, " ")}</div>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell"><Badge text={t.category} variant="default" /></td>
                <td className="px-4 py-3.5"><Badge text={getMessagePurposeMeta(t.messagePurpose).label} variant={getMessagePurposeMeta(t.messagePurpose).color} /></td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-56">
                    {getTemplateTags(t).slice(0, 3).map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3.5"><Badge text={t.channel} variant="blue" /></td>
                <td className="px-4 py-3.5 hidden lg:table-cell"><span className="text-xs font-semibold">{t.usageCount.toLocaleString()}회</span></td>
                <td className="px-4 py-3.5"><span className="text-xs text-muted-foreground">{t.updatedAt}</span></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(t); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onPage={setPage} />
      </div>

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="템플릿 상세" wide>
        {detailModal && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-foreground">{detailModal.name}</div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">채널</span>
                    <span className="font-bold text-blue-700">{detailModal.channel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">카테고리</span>
                    <span className="font-bold text-foreground">{detailModal.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">광고여부</span>
                    <Badge text={getMessagePurposeMeta(detailModal.messagePurpose).label} variant={getMessagePurposeMeta(detailModal.messagePurpose).color} />
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="mr-0.5 text-xs font-bold text-muted-foreground">태그</span>
                    {getTemplateTags(detailModal).length > 0 ? getTemplateTags(detailModal).map(tag => <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{tag}</span>) : <span className="text-xs font-semibold text-muted-foreground">없음</span>}
                  </div>
                </div>
              </div>
              <Btn size="sm" variant="outline" onClick={() => { openEdit(detailModal); setDetailModal(null); }}><Edit2 className="w-3 h-3" /> 수정</Btn>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-border pb-4 md:grid-cols-6">
              {[
                ["사용 횟수", `${detailModal.usageCount.toLocaleString()}회`],
                ["최근 수정", detailModal.updatedAt],
                ["광고여부", getMessagePurposeMeta(detailModal.messagePurpose).label],
                ["문자 길이", `${detailModal.content.length}자`],
                ["템플릿 클릭률", `${detailModal.clickRate ?? 0}%`],
                ["수신거부율", `${detailModal.optOutRate ?? 0}%`],
              ].map(([label, value]) => <div key={label}><div className="mb-1 text-xs font-bold text-muted-foreground">{label}</div><div className="text-sm font-bold text-foreground">{value}</div></div>)}
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <section>
                <div className="mb-2 text-xs font-bold text-muted-foreground">메시지 내용</div>
                <div className="min-h-[420px] whitespace-pre-wrap rounded-lg border border-border bg-input-background p-4 text-sm leading-relaxed text-foreground">{detailModal.content}</div>
              </section>
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-muted-foreground">미리보기</div>
                  <div className="inline-flex rounded-lg border border-border bg-muted p-1">
                    {[
                      ["message", "메시지"],
                      ["kakao", "카카오톡"],
                      ["email", "이메일"],
                    ].map(([value, label]) => (
                      <button key={value} onClick={() => setTemplatePreviewMode(value as "message" | "kakao" | "email")} className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${templatePreviewMode === value ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="relative mx-auto aspect-[1179/2556] w-[260px] shrink-0 overflow-hidden rounded-[2.8rem] bg-gradient-to-b from-slate-700 via-slate-950 to-black p-[6px] shadow-2xl ring-1 ring-slate-500/40">
                  <div className="absolute -left-1 top-24 h-14 w-1 rounded-l bg-slate-800" />
                  <div className="absolute -right-1 top-32 h-20 w-1 rounded-r bg-slate-800" />
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[2.35rem] bg-white">
                    <div className="absolute left-1/2 top-3 z-30 flex h-6 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black shadow-lg">
                      <span className="mr-2 h-1.5 w-7 rounded-full bg-slate-700" />
                      <span className="h-2 w-2 rounded-full bg-slate-800 ring-1 ring-slate-600" />
                    </div>
                    <div className={`flex items-center justify-between px-6 pb-2 pt-4 text-[11px] font-bold ${templatePreviewMode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-slate-50 text-slate-700"}`}>
                      <span>9:41</span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-3.5 rounded-sm border border-current" />
                        <span className="h-2 w-3 rounded-sm bg-current" />
                      </span>
                    </div>
                    <div className={`border-b border-black/5 px-5 py-3 text-center text-xs font-bold ${templatePreviewMode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-white text-slate-800"}`}>
                      {templatePreviewMode === "message" ? "메시지" : templatePreviewMode === "kakao" ? "카카오톡" : "Mail"}
                    </div>
                    <div className={`h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 pb-10 ${templatePreviewMode === "message" ? "bg-white" : templatePreviewMode === "kakao" ? "bg-[#BACEDE]" : "bg-slate-50"}`}>
                      {templatePreviewMode === "email" ? (
                        <div className="min-h-full bg-white text-slate-900">
                          <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">M</div>
                            <div className="text-sm font-bold">Gmail</div>
                          </div>
                          <div className="mb-3 text-base font-bold leading-snug">{detailModal.name}</div>
                          <div className="mb-4 flex items-start gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">현</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate text-xs font-bold">현대퓨처넷</div>
                                <div className="text-[10px] text-muted-foreground">오전 9:41</div>
                              </div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground">to me</div>
                            </div>
                          </div>
                          <div className="whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-xs leading-relaxed text-foreground shadow-sm">{detailModal.content}</div>
                          <div className="mt-4 flex gap-2">
                            <button className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">답장</button>
                            <button className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">전달</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 text-[11px] text-muted-foreground">{templatePreviewMode === "message" ? "010-0000-0000" : "현대퓨처넷"}</div>
                          <div className={`max-w-[185px] whitespace-pre-wrap p-3 text-sm leading-relaxed shadow-sm ${templatePreviewMode === "message" ? "ml-auto rounded-2xl bg-primary text-white" : "rounded-2xl rounded-tl-sm bg-[#FFF8C5]"}`}>{detailModal.content}</div>
                          {templatePreviewMode === "kakao" && (
                            <div className="mt-2 max-w-[185px] rounded-xl bg-white p-2 text-center text-[11px] font-bold text-[#3A1D1D] shadow-sm">자세히 보기</div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="absolute bottom-2.5 left-1/2 h-1.5 w-28 -translate-x-1/2 rounded-full bg-slate-900/85" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="템플릿 수정" wide>
        <TemplateFormFields form={form} setForm={setForm} onCancel={() => { setEditModal(null); setAddModal(false); }} onSave={saveTemplate} />
      </Modal>
      <Modal open={addModal} onClose={() => setAddModal(false)} title="새 템플릿 추가" wide>
        <TemplateFormFields form={form} setForm={setForm} onCancel={() => { setEditModal(null); setAddModal(false); }} onSave={saveTemplate} />
      </Modal>
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="템플릿 삭제">
        <p className="text-sm text-muted-foreground mb-4">이 템플릿을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</p>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setDeleteId(null)}>취소</Btn>
          <Btn variant="danger" onClick={() => { setTemplates(t => t.filter(x => x.id !== deleteId)); setDeleteId(null); }}>삭제</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────────
function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("전체");
  const [period, setPeriod] = useState<StatsPeriod>(() => createStatsPeriod("recent30"));
  const [channelFilter, setChannelFilter] = useState("전체 채널");
  const [purposeFilter, setPurposeFilter] = useState<"전체 광고여부" | MessagePurpose>("전체 광고여부");
  const [selectedRecord, setSelectedRecord] = useState<SendRecord | null>(null);
  const [page, setPage] = useState(1);
  const orderedPeriod = getOrderedStatsPeriod(period);
  const updatePeriod = (nextPeriod: StatsPeriod) => {
    setPeriod(nextPeriod);
    setPage(1);
  };
  const filtered = HISTORY.filter(r =>
    r.sentAt.slice(0, 10) >= orderedPeriod.start &&
    r.sentAt.slice(0, 10) <= orderedPeriod.end &&
    (filter === "전체" || r.status === filter) &&
    (channelFilter === "전체 채널" || r.channel === channelFilter) &&
    (purposeFilter === "전체 광고여부" || r.messagePurpose === purposeFilter) &&
    (r.template.includes(search) || r.channel.includes(search) || r.affiliate.includes(search) || getMessagePurposeMeta(r.messagePurpose).label.includes(search))
  );
  const pageSize = 10;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pagedRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const channelOptions = ["전체 채널", ...CHANNEL_LABELS];
  return (
    <div className="p-3 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <StatsPeriodControl period={period} onChange={updatePeriod} compact />
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="템플릿 또는 채널 검색" className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-4 text-sm focus:outline-none sm:w-52" />
          </div>
          {["전체", "완료", "진행중", "실패"].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
          <select value={channelFilter} onChange={e => { setChannelFilter(e.target.value); setPage(1); }} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground">
            {channelOptions.map(option => <option key={option}>{option}</option>)}
          </select>
          <select value={purposeFilter} onChange={e => { setPurposeFilter(e.target.value as "전체 광고여부" | MessagePurpose); setPage(1); }} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground">
            <option value="전체 광고여부">전체 광고여부</option>
            {MESSAGE_PURPOSES.map(purpose => <option key={purpose.id} value={purpose.id}>{purpose.label}</option>)}
          </select>
        </div>
        <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" /> Excel 내보내기</Btn>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            {["발송일시", "계열사", "템플릿", "채널", "광고여부", "대상", "발송", "성공", "실패", "성공률", "비용 절감", "상태"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>{pagedRecords.map(r => (
              <tr key={r.id} onClick={() => setSelectedRecord(r)} className={`border-b border-border transition-colors cursor-pointer ${selectedRecord?.id === r.id ? "bg-accent" : "hover:bg-blue-50/70"}`}>
                <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{r.sentAt}</td>
                <td className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{r.affiliate}</td>
                <td className="px-4 py-3.5 text-xs font-semibold text-foreground">{r.template}</td>
                <td className="px-4 py-3.5"><Badge text={r.channel} variant="blue" /></td>
                <td className="px-4 py-3.5"><Badge text={getMessagePurposeMeta(r.messagePurpose).label} variant={getMessagePurposeMeta(r.messagePurpose).color} /></td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{r.targetType}</td>
                <td className="px-4 py-3.5 text-xs font-bold">{r.count.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-emerald-600">{r.success.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-red-500">{r.fail.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-foreground">{((r.success / r.count) * 100).toFixed(1)}%</td>
                <td className="px-4 py-3.5 text-xs font-bold text-emerald-600 whitespace-nowrap">{formatWon(r.savedCost)}</td>
                <td className="px-4 py-3.5"><Badge text={r.status} variant={r.status === "완료" ? "green" : r.status === "진행중" ? "amber" : "red"} /></td>
              </tr>
            ))}</tbody>
        </table>
        </div>
        <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onPage={setPage} />
      </div>
      <Modal open={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="전송 기록 상세" wide>
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 p-4 bg-muted rounded-xl">
              <div>
                <div className="text-base font-bold text-foreground mb-1">{selectedRecord.template}</div>
                <div className="flex items-center gap-2"><Badge text={selectedRecord.channel} variant="blue" /><Badge text={getMessagePurposeMeta(selectedRecord.messagePurpose).label} variant={getMessagePurposeMeta(selectedRecord.messagePurpose).color} /><Badge text={selectedRecord.status} variant={selectedRecord.status === "완료" ? "green" : selectedRecord.status === "진행중" ? "amber" : "red"} /></div>
              </div>
              <div className="text-xs text-muted-foreground">{selectedRecord.sentAt}</div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["대상", selectedRecord.targetType],
                ["총 발송", `${selectedRecord.count.toLocaleString()}건`],
                ["광고여부", getMessagePurposeMeta(selectedRecord.messagePurpose).label],
                ["성공", `${selectedRecord.success.toLocaleString()}건`],
                ["실패", `${selectedRecord.fail.toLocaleString()}건`],
                ["총 소요 비용", formatWon(selectedRecord.cost)],
                ["절감액", formatWon(selectedRecord.savedCost)],
                ["계열사", selectedRecord.affiliate],
                ["최종 도달률", `${(((selectedRecord.success + selectedRecord.failoverSteps.slice(1).reduce((sum, step) => sum + step.success, 0)) / selectedRecord.count) * 100).toFixed(1)}%`],
              ].map(([label, value]) => <div key={label} className="p-3 bg-muted rounded-lg"><div className="text-xs text-muted-foreground mb-1">{label}</div><div className="text-sm font-bold">{value}</div></div>)}
            </div>
            {selectedRecord.fail > 0 && (
              <div className="flex justify-end">
                <Btn size="sm" variant="outline"><RefreshCw className="w-3.5 h-3.5" /> 실패 대상자에게 재발송</Btn>
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-bold text-muted-foreground mb-2">메시지 정보</div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{TEMPLATES.find(template => selectedRecord.template.includes(template.name) || template.name.includes(selectedRecord.template))?.content ?? "[현대퓨처넷] 발송 메시지 본문 정보입니다."}</pre>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-bold text-muted-foreground mb-3">대체 발송 흐름</div>
              <div className="space-y-3">
                {selectedRecord.failoverSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</div>
                    <div className="flex-1 rounded-lg bg-muted p-3">
                      <div className="text-xs font-bold mb-1">{step.label}</div>
                      <div className="text-xs text-muted-foreground">요청 {step.requested.toLocaleString()}건 · 성공 {step.success.toLocaleString()}건 · 실패 {step.fail.toLocaleString()}건</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted border-b border-border">{["구분", "건수", "비율", "조치"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    ["성공", selectedRecord.success, `${((selectedRecord.success / selectedRecord.count) * 100).toFixed(1)}%`, "완료"],
                    ["수신거부", Math.round(selectedRecord.fail * 0.42), "실패 내 42%", "대상 제외"],
                    ["번호 오류", Math.round(selectedRecord.fail * 0.31), "실패 내 31%", "고객 정보 확인"],
                    ["채널 실패", Math.round(selectedRecord.fail * 0.27), "실패 내 27%", "대체 발송 검토"],
                  ].map(row => <tr key={row[0]} className="border-b border-border hover:bg-blue-50/70 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-xs font-bold">{row[0]}</td>
                    <td className="px-4 py-3 text-xs">{Number(row[1]).toLocaleString()}건</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row[2]}</td>
                    <td className="px-4 py-3 text-xs text-primary font-semibold">{row[3]}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Members Page ─────────────────────────────────────────────────────────────
function MembersPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [detailTagInput, setDetailTagInput] = useState("");
  const [memberTab, setMemberTab] = useState<"members" | "blocked">("members");
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [targetEditMode, setTargetEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<Member[]>(() => createMemberRows());
  const visibleMembersForType = members.filter(member => ["일반", "신규", "휴면"].includes(member.type));
  const blockedMembers = visibleMembersForType.filter(member => !member.smsConsent || !member.kakaoConsent);
  const allMemberTags = useMemo(() => uniqueTags(MEMBER_TAGS), []);

  const filtered = visibleMembersForType.filter(m =>
    memberTab === "members" &&
    (typeFilter === "전체" || m.type === typeFilter) &&
    (m.name.includes(search) || m.phone.includes(search) || (m.tags ?? []).some(tag => tag.includes(search)))
  );
  const memberPageSize = 10;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / memberPageSize)));
  const pagedMembers = filtered.slice((currentPage - 1) * memberPageSize, currentPage * memberPageSize);
  const blockedCurrentPage = Math.min(page, Math.max(1, Math.ceil(blockedMembers.length / memberPageSize)));
  const pagedBlockedMembers = blockedMembers.slice((blockedCurrentPage - 1) * memberPageSize, blockedCurrentPage * memberPageSize);

  const typeMap: Record<string, string> = { 일반: "blue", 신규: "green", 휴면: "default" };
  const updateMemberTags = (memberId: number, tags: string[]) => {
    const nextTags = uniqueTags(tags);
    setMembers(prev => prev.map(member => member.id === memberId ? { ...member, tags: nextTags } : member));
    setDetailMember(prev => prev && prev.id === memberId ? { ...prev, tags: nextTags } : prev);
  };
  const addTagToDetailMember = (tagValue = detailTagInput) => {
    if (!detailMember) return;
    const tag = tagValue.trim();
    if (!tag || !allMemberTags.includes(tag)) return;
    updateMemberTags(detailMember.id, [...(detailMember.tags ?? []), tag]);
    setDetailTagInput("");
  };
  const removeTagFromDetailMember = (tag: string) => {
    if (!detailMember) return;
    updateMemberTags(detailMember.id, (detailMember.tags ?? []).filter(item => item !== tag));
  };
  const openMemberDetail = (member: Member) => {
    setDetailMember(member);
    setTargetEditMode(false);
    setDetailTagInput("");
  };
  const closeMemberDetail = () => {
    setDetailMember(null);
    setTargetEditMode(false);
    setDetailTagInput("");
  };
  const detailReceivedMessages = useMemo(() => {
    if (!detailMember) return [];
    return Array.from({ length: 100 }, (_, index) => {
      const record = HISTORY[index % HISTORY.length];
      const day = String(26 - (index % 20)).padStart(2, "0");
      const hour = String(9 + (index % 10)).padStart(2, "0");
      const minute = String((index * 7) % 60).padStart(2, "0");
      return {
        id: `${detailMember.id}-${index}`,
        template: record.template,
        channel: record.channel === "스마트 라우팅" ? (index % 2 === 0 ? "카카오 친구톡" : "SMS") : record.channel,
        sentAt: `2026-06-${day} ${hour}:${minute}`,
        status: index % 11 === 0 ? "실패" : "완료",
      };
    });
  }, [detailMember?.id]);
  const availableDetailTags = allMemberTags
    .filter(tag => !(detailMember?.tags ?? []).includes(tag))
    .filter(tag => !detailTagInput.trim() || tag.includes(detailTagInput.trim()) || tagGroupLabel(tag).includes(detailTagInput.trim()))
    .slice(0, 30);

  return (
    <div className="flex h-full min-h-0 flex-col p-3 sm:p-6">
      <div className="mb-5 grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "전체 고객", value: "307,811", color: "text-foreground" },
          { label: "일반 고객", value: "198,341", color: "text-blue-600" },
          { label: "신규 고객", value: "34,210", color: "text-emerald-600" },
          { label: "휴면 고객", value: "23,420", color: "text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mb-4 flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button onClick={() => { setMemberTab("members"); setPage(1); }} className={`px-3 py-1.5 rounded-md text-xs font-bold ${memberTab === "members" ? "bg-primary text-white" : "text-muted-foreground"}`}>고객 목록</button>
            <button onClick={() => { setMemberTab("blocked"); setPage(1); }} className={`px-3 py-1.5 rounded-md text-xs font-bold ${memberTab === "blocked" ? "bg-primary text-white" : "text-muted-foreground"}`}>수신 거부 목록</button>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="고객명 또는 전화번호 검색" className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-4 text-sm focus:outline-none sm:w-56" />
          </div>
          {memberTab === "members" && ["전체", "일반", "신규", "휴면"].map(f => (
            <button key={f} onClick={() => { setTypeFilter(f); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === f ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" /> {memberTab === "members" ? "고객 파일 내보내기" : "수신거부 파일 내보내기"}</Btn>
        </div>
      </div>
      {memberTab === "members" ? (
      <div className="bg-card flex min-h-0 flex-col overflow-hidden rounded-xl border border-border">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-[780px] w-full text-sm">
            <thead><tr className="bg-muted border-b border-border">
              {["고객명", "전화번호", "유형", "타겟", "SMS 동의", "카카오 동의", "RCS 동의", "가입일"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>{pagedMembers.map(m => (
              <tr key={m.id} className="border-b border-border hover:bg-blue-50/70 transition-colors cursor-pointer" onClick={() => openMemberDetail(m)}>
                <td className="px-4 py-2.5 text-xs font-bold text-foreground">{m.name}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{m.phone}</td>
                <td className="px-4 py-2.5"><Badge text={m.type} variant={typeMap[m.type] || "default"} /></td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1 max-w-48">
                    {(m.tags ?? []).slice(0, 3).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}
                  </div>
                </td>
                <td className="px-4 py-2.5">{m.smsConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</td>
                <td className="px-4 py-2.5">{m.kakaoConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</td>
                <td className="px-4 py-2.5">{m.rcsConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.joinedAt}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="shrink-0">
          <Pagination page={currentPage} total={filtered.length} pageSize={memberPageSize} onPage={setPage} />
        </div>
      </div>
      ) : (
      <div className="bg-card flex min-h-0 flex-col overflow-hidden rounded-xl border border-border">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead><tr className="bg-muted border-b border-border">
              {["고객명", "전화번호", "거부 채널", "수신거부 일시"].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>{pagedBlockedMembers.map(member => (
              <tr key={member.id} onClick={() => openMemberDetail(member)} className="border-b border-border hover:bg-blue-50/70 cursor-pointer">
                <td className="px-4 py-2.5 text-xs font-bold text-foreground">{member.name}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{member.phone}</td>
                <td className="px-4 py-2.5"><Badge text={!member.smsConsent ? "SMS" : "카카오"} variant="red" /></td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">2026-06-{String(10 + (member.id % 14)).padStart(2, "0")} 14:{String((member.id * 7) % 60).padStart(2, "0")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="shrink-0">
          <Pagination page={blockedCurrentPage} total={blockedMembers.length} pageSize={memberPageSize} onPage={setPage} />
        </div>
      </div>
      )}

      <Modal open={!!detailMember} onClose={closeMemberDetail} title="고객 상세 정보" wide>
        {detailMember && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{detailMember.name[0]}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-bold text-foreground">{detailMember.name}</div>
                    <Badge text={detailMember.type} variant={typeMap[detailMember.type] || "default"} />
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{detailMember.phone}</div>
                </div>
              </div>
              <div className="grid min-w-[260px] grid-cols-2 gap-4 text-sm">
                {[
                  { label: "가입일", value: detailMember.joinedAt },
                  { label: "마지막 발송", value: detailMember.lastSend },
                ].map(f => <div key={f.label}><div className="mb-1 text-xs font-bold text-muted-foreground">{f.label}</div><div className="font-semibold text-foreground">{f.value}</div></div>)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
              <span className="mr-1 text-xs font-bold text-muted-foreground">수신 동의</span>
              {[
                { label: "SMS", key: "smsConsent" as const },
                { label: "카카오", key: "kakaoConsent" as const },
                { label: "RCS", key: "rcsConsent" as const },
              ].map(({ label, key }) => (
                <span key={key} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${detailMember[key] ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {detailMember[key] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {label} {detailMember[key] ? "동의" : "거부"}
                </span>
              ))}
            </div>
            <section className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-3">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground">타겟</h4>
                  <div className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{(detailMember.tags ?? []).length}개 등록</div>
                </div>
                <button onClick={() => { setTargetEditMode(prev => !prev); setDetailTagInput(""); }} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${targetEditMode ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}>
                  {targetEditMode ? "완료" : "수정"}
                </button>
              </div>
              <div className="p-4">
                {!targetEditMode ? (
                  <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                    {(detailMember.tags ?? []).map(tag => (
                      <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{tag}</span>
                    ))}
                    {(detailMember.tags ?? []).length === 0 && <span className="text-xs font-semibold text-muted-foreground">등록된 타겟 없음</span>}
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
                    <div>
                      <div className="mb-2 text-[11px] font-bold text-muted-foreground">현재 타겟</div>
                      <div className="min-h-24 max-h-36 overflow-y-auto rounded-lg border border-border p-3">
                        <div className="flex flex-wrap gap-2">
                          {(detailMember.tags ?? []).map(tag => (
                            <button key={tag} onClick={() => removeTagFromDetailMember(tag)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600">
                              {tag}<X className="h-3 w-3" />
                            </button>
                          ))}
                          {(detailMember.tags ?? []).length === 0 && <span className="text-xs font-semibold text-muted-foreground">등록된 타겟 없음</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-[11px] font-bold text-muted-foreground">타겟 추가</div>
                      <input value={detailTagInput} onChange={e => setDetailTagInput(e.target.value)} placeholder="태그 검색" className="mb-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                      <div className="max-h-28 overflow-y-auto rounded-lg bg-muted/60 p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {availableDetailTags.map(tag => (
                            <button key={tag} onClick={() => addTagToDetailMember(tag)} className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground">
                              <span className="mr-1 opacity-70">{tagGroupLabel(tag)}</span>{tag}
                            </button>
                          ))}
                          {availableDetailTags.length === 0 && <span className="text-xs font-semibold text-muted-foreground">검색 가능한 고정 태그가 없습니다.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
            <section className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-3">
                <h4 className="text-xs font-bold text-muted-foreground">받은 메시지 내역</h4>
                <span className="text-xs font-bold text-primary">{detailReceivedMessages.length}건</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border">
                      {["발송일", "템플릿", "채널", "상태"].map(header => <th key={header} className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {detailReceivedMessages.map(record => (
                      <tr key={record.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{record.sentAt}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-foreground">{record.template}</td>
                        <td className="px-4 py-2.5"><Badge text={record.channel} variant="blue" /></td>
                        <td className="px-4 py-2.5"><Badge text={record.status} variant={record.status === "완료" ? "green" : "red"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Statistics Pages ─────────────────────────────────────────────────────────
const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadStatsExcel = (periodLabel = "기본 기간") => {
  const rows = [
    ["구분", "항목", "값"],
    ["공통", "분석 기간", periodLabel],
    ["발송 현황", "기간 총 발송", "892451"],
    ["발송 현황", "Fallback 전환", "5549"],
    ["발송 현황", "Fallback 전환율", "1.9%"],
    ["비용 분석", "실제 청구 비용", formatWon(18700000)],
    ["비용 분석", "기간 절감액", formatWon(5500000)],
    ["성과 분석", "평균 클릭률", "19.1%"],
    ["성과 분석", "전환율", "5.8%"],
  ];
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadFile("stats-report.csv", `\uFEFF${csv}`, "text/csv;charset=utf-8");
};

function StatsReportActions({ period }: { period?: StatsPeriod }) {
  const periodLabel = period ? getStatsPeriodLabel(period) : "기본 기간";
  return (
    <div className="flex justify-end gap-2">
      <Btn variant="outline" size="sm" onClick={() => window.print()}><Download className="w-3.5 h-3.5" /> PDF 다운로드</Btn>
      <Btn variant="outline" size="sm" onClick={() => downloadStatsExcel(periodLabel)}><Download className="w-3.5 h-3.5" /> Excel 다운로드</Btn>
    </div>
  );
}

function StatsOverview({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
  const sendTrendData = useMemo(() => buildSendTrendData(period, 2), [period]);
  const channelTrendData = useMemo(() => buildChannelTrendData(period, 4), [period]);
  const fallbackData = useMemo(() => buildFallbackStageData(period), [period]);
  const routingData = useMemo(() => buildRoutingSeriesData(period), [period]);
  const totalSends = sendTrendData.reduce((sum, row) => sum + row.sends, 0);
  const totalSuccess = sendTrendData.reduce((sum, row) => sum + row.success, 0);
  const totalCost = routingData.reduce((sum, row) => sum + row.actual, 0);
  const totalSaved = routingData.reduce((sum, row) => sum + row.saved, 0);
  const days = getStatsPeriodDays(period);
  const grainLabel = getStatsGrainLabel(getStatsGrain(period));
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="총 발송" value={totalSends.toLocaleString()} sub={getStatsPeriodLabel(period)} trend={{ val: "+12.4%", up: true, label: "이전 기간 대비" }} icon={<Send className="w-4 h-4" />} color="blue" />
        <StatCard label="평균 성공률" value={`${((totalSuccess / totalSends) * 100).toFixed(1)}%`} sub={`실패 ${(totalSends - totalSuccess).toLocaleString()}건`} trend={{ val: "+0.2%p", up: true, label: "이전 기간 대비" }} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <StatCard label="기간 평균 발송" value={Math.round(totalSends / days).toLocaleString()} sub="일 평균 기준" icon={<Activity className="w-4 h-4" />} color="violet" />
        <StatCard label="실제 청구 비용" value={formatWon(totalCost)} sub="선택 기간 누적" trend={{ val: "+8.1%", up: false, label: "이전 기간 대비" }} icon={<Target className="w-4 h-4" />} color="amber" />
        <StatCard label="스마트 라우팅 절감" value={formatWon(totalSaved)} sub="최대 비용 대비" icon={<RefreshCw className="w-4 h-4" />} color="green" />
      </div>
      <QueueStatusCard />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
          <h3 className="text-sm font-bold mb-3">{grainLabel} 채널별 발송 현황</h3>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelTrendData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()}건`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="kakao" name="카카오 친구톡" fill="#F7E600" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sms" name="SMS" fill="#1843FA" radius={[3, 3, 0, 0]} />
                <Bar dataKey="lms" name="LMS" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="rcs" name="RCS" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid min-h-0 grid-rows-2 gap-3">
          <DailySendTrendCard title={`${grainLabel} 발송 & 성공 추이`} gradientId="statsDailySendsGrad" data={sendTrendData} xKey="label" />
          <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">Fallback 채널별 성공률</h3>
              <span className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold text-muted-foreground">{grainLabel}</span>
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fallbackData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[90, 100]} />
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="kakao" name="카카오" fill="#F7E600" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="sms" name="SMS" fill="#1843FA" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="lms" name="LMS" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsChannel({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
  const periodChannelCostData = useMemo(() => buildChannelCostData(period), [period]);
  const channelTrendData = useMemo(() => buildChannelTrendData(period, 8), [period]);
  const channelShareData = useMemo(() => buildChannelShareData(periodChannelCostData), [periodChannelCostData]);
  const totalChannelSends = periodChannelCostData.reduce((sum, channel) => sum + channel.sends, 0);
  const totalChannelCost = periodChannelCostData.reduce((sum, channel) => sum + channel.cost, 0);
  const weightedSuccessRate = periodChannelCostData.reduce((sum, channel) => sum + channel.successRate * channel.sends, 0) / totalChannelSends;
  const averageUnitCost = totalChannelCost / totalChannelSends;
  const grainLabel = getStatsGrainLabel(getStatsGrain(period));
  const channelSummaryMetrics = [
    { label: "총 발송", value: `${totalChannelSends.toLocaleString()}건`, sub: "선택 기간 전체 채널" },
    { label: "평균 성공률", value: `${weightedSuccessRate.toFixed(1)}%`, sub: "발송량 가중 평균" },
    { label: "총 비용", value: formatWon(totalChannelCost), sub: "선택 기간 채널 비용" },
    { label: "평균 단가", value: `${averageUnitCost.toFixed(1)}원`, sub: "건당 평균 비용" },
    { label: "활성 채널", value: `${periodChannelCostData.length}개`, sub: "운영 중인 채널" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {channelSummaryMetrics.map(metric => (
          <div key={metric.label} className="bg-card rounded-xl border border-border p-3">
            <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
            <div className="text-lg font-bold text-foreground">{metric.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{metric.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="grid min-h-0 grid-rows-2 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
            <h3 className="text-sm font-bold mb-3">채널별 성공률/실패율 비교</h3>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodChannelCostData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" horizontal={false} />
                  <XAxis type="number" domain={[96, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="channel" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                  <Bar dataKey="successRate" name="성공률" fill="#1843FA" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
            <h3 className="text-sm font-bold mb-3">{grainLabel} 채널별 추이</h3>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={channelTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString() + "건"]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="kakao" stroke="#F7E600" strokeWidth={2} dot={false} name="카카오 친구톡" />
                  <Line type="monotone" dataKey="sms" stroke="#1843FA" strokeWidth={2} dot={false} name="SMS" />
                  <Line type="monotone" dataKey="lms" stroke="#10B981" strokeWidth={2} dot={false} name="LMS" />
                  <Line type="monotone" dataKey="rcs" stroke="#8B5CF6" strokeWidth={2} dot={false} name="RCS" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="grid min-h-0 grid-rows-[0.9fr_1.1fr] gap-3">
          <ChannelShareCard data={channelShareData} />
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border"><h3 className="text-sm font-bold">채널별 비용 및 평균 단가</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-muted border-b border-border">
                {["채널", "발송량", "성공률", "실패율", "총 비용", "평균 단가"].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>{periodChannelCostData.map(row => (
                <tr key={row.channel} className="border-b border-border hover:bg-muted/30">
                  <td className="px-3 py-2 text-xs font-bold">{row.channel}</td>
                  <td className="px-3 py-2 text-xs">{row.sends.toLocaleString()}건</td>
                  <td className="px-3 py-2 text-xs text-emerald-600 font-bold">{row.successRate}%</td>
                  <td className="px-3 py-2 text-xs text-red-500 font-bold">{row.failRate}%</td>
                  <td className="px-3 py-2 text-xs font-bold">{formatWon(row.cost)}</td>
                  <td className="px-3 py-2 text-xs">{row.unit}원</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
function StatsRouting({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
  const routingData = useMemo(() => buildRoutingSeriesData(period), [period]);
  const actualCost = routingData.reduce((sum, row) => sum + row.actual, 0);
  const baselineCost = routingData.reduce((sum, row) => sum + row.baseline, 0);
  const savedCost = routingData.reduce((sum, row) => sum + row.saved, 0);
  const fallbackSwitches = Math.round(getStatsPeriodDays(period) * 185);
  const grainLabel = getStatsGrainLabel(getStatsGrain(period));
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="실제 청구 비용" value={formatWon(actualCost)} sub="선택 기간 누적" icon={<Target className="w-4 h-4" />} color="amber" />
        <StatCard label="최대 비용" value={formatWon(baselineCost)} sub="동일 물량 기준" icon={<TrendingUp className="w-4 h-4" />} color="violet" />
        <StatCard label="기간 절감액" value={formatWon(savedCost)} sub={`절감률 ${((savedCost / baselineCost) * 100).toFixed(1)}%`} trend={{ val: "+22.1%", up: true, label: "이전 기간 대비" }} icon={<Zap className="w-4 h-4" />} color="green" />
        <StatCard label="대체 발송 전환" value={fallbackSwitches.toLocaleString()} sub="전환율 1.9%" trend={{ val: "+0.4%p", up: true, label: "이전 기간 대비" }} icon={<RefreshCw className="w-4 h-4" />} color="blue" />
      </div>
      <div className="grid shrink-0 grid-cols-1 lg:grid-cols-2 gap-3">
        <CostComparisonCard title={`${grainLabel} 비용 비교 현황`} data={routingData} xKey="label" />
        <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
          <h3 className="text-sm font-bold mb-3">{grainLabel} 절감액 추이</h3>
          <div className="h-[220px] min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={routingData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={84} tickFormatter={v => formatWon(Number(v))} />
                <Tooltip formatter={(v: number) => [formatWon(v)]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="saved" name="절감액" stroke="#10B981" fill="url(#savingGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsMember({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
  const newMemberSeriesData = useMemo(() => buildNewMemberSeriesData(period), [period]);
  const days = getStatsPeriodDays(period);
  const newMembers = newMemberSeriesData.reduce((sum, row) => sum + row.count, 0);
  const totalMembers = 306527 + newMembers;
  const grainLabel = getStatsGrainLabel(getStatsGrain(period));
  const consentChannelData = [
    { label: "메시지", agreed: Math.round(totalMembers * 0.645), total: totalMembers, color: "bg-blue-500" },
    { label: "카카오톡", agreed: Math.round(totalMembers * 0.784), total: totalMembers, color: "bg-amber-400" },
    { label: "이메일", agreed: Math.round(totalMembers * 0.665), total: totalMembers, color: "bg-emerald-500" },
  ].map(channel => ({
    ...channel,
    rate: Number(((channel.agreed / channel.total) * 100).toFixed(1)),
    declined: channel.total - channel.agreed,
  }));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="전체 고객" value={totalMembers.toLocaleString()} sub="분석 가능 고객" icon={<Users className="w-4 h-4" />} color="amber" />
        <StatCard label="일반 고객" value={Math.round(totalMembers * 0.644).toLocaleString()} sub="주요 발송 대상" icon={<Users className="w-4 h-4" />} color="blue" />
        <StatCard label="신규 고객" value={newMembers.toLocaleString()} sub={`${days}일 누적 가입`} trend={{ val: "+3.9%", up: true, label: "이전 기간 대비" }} icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <StatCard label="휴면 고객" value="23,420" sub="6개월 이상 미활동" trend={{ val: "-284명", up: true, label: "이전 기간 대비" }} icon={<Clock className="w-4 h-4" />} color="violet" />
      </div>
      <div className="grid shrink-0 grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
          <h3 className="text-sm font-bold mb-3">{grainLabel} 신규 고객 가입자 수</h3>
          <div className="h-[220px] min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newMemberSeriesData} barSize={24} margin={{ top: 8, right: 8, left: 0, bottom: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()}명`]} />
                <Bar dataKey="count" name="신규 가입자" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
          <h3 className="mb-3 text-sm font-bold">채널 동의 현황</h3>
          <div className="grid flex-1 content-center gap-3">
            {consentChannelData.map(channel => (
              <div key={channel.label} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-foreground">{channel.label}</div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{channel.rate}%</div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-card">
                  <div className={`h-2 rounded-full ${channel.color}`} style={{ width: `${channel.rate}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>동의 {channel.agreed.toLocaleString()}명</span>
                  <span>미동의 {channel.declined.toLocaleString()}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsPerformance({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
  const [performanceChannel, setPerformanceChannel] = useState("카카오 친구톡");
  const performanceSeriesData = useMemo(() => buildPerformanceSeriesData(period, performanceChannel), [period, performanceChannel]);
  const averageClickRate = performanceSeriesData.reduce((sum, row) => sum + row.clickRate, 0) / performanceSeriesData.length;
  const averageConversionRate = performanceSeriesData.reduce((sum, row) => sum + row.conversionRate, 0) / performanceSeriesData.length;
  const optOutRate = clampNumber(0.09 + getStatsPeriodDays(period) / 900, 0.1, 0.32);
  const grainLabel = getStatsGrainLabel(getStatsGrain(period));
  const rankedTemplatePerformanceTop = [...templatePerformanceTop]
    .map((template, index) => ({
      ...template,
      click: Number((template.click + (averageClickRate - 19.1) * 0.18 - index * 0.12).toFixed(1)),
      conversion: template.conversion === null ? null : Number((template.conversion + (averageConversionRate - 5.8) * 0.12).toFixed(1)),
    }))
    .sort((a, b) => b.click - a.click || (b.conversion ?? -1) - (a.conversion ?? -1))
    .slice(0, 5);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <StatsPeriodControl period={period} onChange={onPeriodChange} compact />
          <select value={performanceChannel} onChange={event => setPerformanceChannel(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground">
            {["카카오 친구톡", "카카오 알림톡", "SMS", "LMS", "RCS"].map(option => <option key={option}>{option}</option>)}
          </select>
        </div>
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="선택 채널" value={performanceChannel} sub="채널별 데이터 표시" icon={<MessageSquare className="w-4 h-4" />} color="blue" />
        <StatCard label="평균 클릭률" value={`${averageClickRate.toFixed(1)}%`} sub="업계 평균 8.2%" trend={{ val: "+0.8%p", up: true, label: "이전 기간 대비" }} icon={<Target className="w-4 h-4" />} color="green" />
        <StatCard label="전환율" value={`${averageConversionRate.toFixed(1)}%`} sub="선택 기간 평균" trend={{ val: "+0.6%p", up: true, label: "이전 기간 대비" }} icon={<TrendingUp className="w-4 h-4" />} color="violet" />
        <StatCard label="수신 거부율" value={`${optOutRate.toFixed(2)}%`} sub="업계 평균 0.41%" trend={{ val: "-0.02%p", up: true, label: "이전 기간 대비" }} icon={<CheckCircle2 className="w-4 h-4" />} color="amber" />
      </div>
      <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-[1.1] flex-col">
        <h3 className="text-sm font-bold mb-3">{grainLabel} 성과 지표 추이</h3>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="clickRate" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} name="클릭률" />
              <Line type="monotone" dataKey="conversionRate" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} name="전환율" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold">템플릿별 성과 Top 5</h3>
            <span className="text-[11px] font-semibold text-muted-foreground">클릭률 순 · 동률 시 구매전환율 순</span>
          </div>
          <div className="space-y-1">
            {rankedTemplatePerformanceTop.map((t, i) => (
              <div key={t.name} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1">
                <span className="text-right text-xs font-bold text-primary">{i + 1}</span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-foreground">{t.name}</div>
                  <div className="mt-0.5 truncate text-[10px] text-muted-foreground">구매전환율 {t.conversion === null ? "미반영" : `${t.conversion}%`}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-foreground">{t.click}%</div>
                  <div className="text-[10px] text-muted-foreground">클릭률</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
          <h3 className="text-sm font-bold mb-3">요일별 클릭률</h3>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayClickData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 25]} />
                <Tooltip formatter={(v: number) => [`${v}%`]} />
                <Bar dataKey="rate" name="클릭률" fill="#1843FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex min-h-0 flex-col">
          <h3 className="text-sm font-bold mb-3">시간별 클릭률</h3>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyClickData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="time" interval={2} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`]} />
                <Line type="monotone" dataKey="rate" name="클릭률" stroke="#1843FA" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
function MainLayout({ currentPage, setCurrentPage, onLogout }: {
  currentPage: Page; setCurrentPage: (p: Page) => void; onLogout: () => void;
}) {
  const [statsPeriods, setStatsPeriods] = useState<Record<StatsPage, StatsPeriod>>(() => createDefaultStatsPeriods());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const updateStatsPeriod = (page: StatsPage) => (period: StatsPeriod) => {
    setStatsPeriods(prev => ({ ...prev, [page]: period }));
  };
  const fitToViewport = currentPage === "dashboard" || currentPage === "send" || currentPage === "templates" || currentPage === "members" || currentPage.startsWith("stats");
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage setPage={setCurrentPage} />;
      case "send": return <SendMessagePageWizard />;
      case "templates": return <TemplatesPage />;
      case "history": return <HistoryPage />;
      case "members": return <MembersPage />;
      case "stats-overview": return <StatsOverview period={statsPeriods["stats-overview"]} onPeriodChange={updateStatsPeriod("stats-overview")} />;
      case "stats-channel": return <StatsChannel period={statsPeriods["stats-channel"]} onPeriodChange={updateStatsPeriod("stats-channel")} />;
      case "stats-routing": return <StatsRouting period={statsPeriods["stats-routing"]} onPeriodChange={updateStatsPeriod("stats-routing")} />;
      case "stats-member": return <StatsMember period={statsPeriods["stats-member"]} onPeriodChange={updateStatsPeriod("stats-member")} />;
      case "stats-performance": return <StatsPerformance period={statsPeriods["stats-performance"]} onPeriodChange={updateStatsPeriod("stats-performance")} />;
    }
  };
  return (
    <div className="flex h-dvh bg-background overflow-hidden" style={{ fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif" }}>
      <Sidebar current={currentPage} setCurrent={setCurrentPage} onLogout={onLogout} className="hidden lg:flex" />
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} aria-label="메뉴 닫기" />
          <div className="relative h-full max-w-[82vw]">
            <Sidebar current={currentPage} setCurrent={setCurrentPage} onLogout={onLogout} onNavigate={() => setMobileNavOpen(false)} className="shadow-2xl" />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header page={currentPage} onMenuClick={() => setMobileNavOpen(true)} />
        <main className={`flex-1 min-w-0 overflow-y-auto ${fitToViewport ? "lg:overflow-hidden" : ""}`}>{renderPage()}</main>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  return <MainLayout currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={() => setIsLoggedIn(false)} />;
}
