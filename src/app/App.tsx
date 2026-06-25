import { useState, useMemo } from "react";
import {
  LayoutDashboard, Send, FileText, History, Users, BarChart3,
  Bell, Settings, LogOut, Plus, Search, Filter, CheckCircle2,
  XCircle, Clock, Sparkles, MessageSquare, Phone, Mail, Zap,
  TrendingUp, TrendingDown, Edit2, Trash2, Download, Eye,
  ChevronRight, ChevronDown, AlertTriangle, X, Check, RefreshCw,
  Target, Activity, Tag, CalendarDays, Megaphone, PieChart,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Info, Upload,
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

interface Template {
  id: number; name: string; channel: string; content: string; category: string; usageCount: number; updatedAt: string; tags?: string[];
  scope?: string; approvalStatus?: string; rejectReason?: string; openRate?: number; clickRate?: number; optOutRate?: number;
}
interface Member {
  id: number; name: string; phone: string; type: string; smsConsent: boolean; kakaoConsent: boolean; rcsConsent: boolean; joinedAt: string; lastSend: string; tags?: string[];
}
interface SendRecord {
  id: number; template: string; channel: string; targetType: string; count: number; success: number; fail: number; sentAt: string; status: string;
  cost: number; savedCost: number; affiliate: string; failoverSteps: { label: string; requested: number; success: number; fail: number }[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  { id: 1, name: "6월 여름 할인 이벤트", channel: "카카오 친구톡", content: "[현대퓨처넷] 안녕하세요 #{이름}님! 6월 특별 여름 세일이 시작되었습니다.\n최대 30% 할인 혜택을 지금 바로 만나보세요.", category: "이벤트", usageCount: 128, updatedAt: "2026-06-20", scope: "현대백화점 전용", approvalStatus: "승인 완료", openRate: 54.3, clickRate: 21.8, optOutRate: 0.18 },
  { id: 2, name: "생일 축하 메시지", channel: "SMS", content: "[현대퓨처넷] #{이름}님, 생일을 진심으로 축하드립니다! 특별한 생일 쿠폰을 확인해보세요.", category: "혜택", usageCount: 2341, updatedAt: "2026-06-18", scope: "전사 공통", approvalStatus: "불필요", openRate: 78.4, clickRate: 34.2, optOutRate: 0.05 },
  { id: 3, name: "신규 가입 환영", channel: "카카오 알림톡", content: "[현대퓨처넷] #{이름}님, 가입을 환영합니다! 신규 가입 혜택 5,000P가 적립되었습니다.", category: "안내", usageCount: 891, updatedAt: "2026-06-15", scope: "전사 공통", approvalStatus: "승인 완료", openRate: 68.1, clickRate: 25.4, optOutRate: 0.08 },
  { id: 4, name: "포인트 소멸 안내", channel: "LMS", content: "[현대퓨처넷] 안내 드립니다. #{이름}님의 포인트 #{포인트}P가 2026년 6월 30일 소멸 예정입니다. 지금 바로 사용하세요!", category: "안내", usageCount: 445, updatedAt: "2026-06-10", scope: "현대홈쇼핑 전용", approvalStatus: "불필요", openRate: 62.8, clickRate: 18.1, optOutRate: 0.11 },
  { id: 5, name: "VIP 멤버십 전용 혜택", channel: "카카오 친구톡", content: "[현대퓨처넷] #{이름}님께만 드리는 VIP 전용 특가 상품을 안내해드립니다. 특별한 혜택을 놓치지 마세요!", category: "VIP", usageCount: 312, updatedAt: "2026-06-08", scope: "한섬 전용", approvalStatus: "반려", rejectReason: "혜택 문구가 과장 표현으로 분류됨", openRate: 71.2, clickRate: 28.9, optOutRate: 0.22 },
  { id: 6, name: "배송 완료 안내", channel: "SMS", content: "[현대퓨처넷] #{이름}님, 주문하신 상품이 배송 완료되었습니다. 주문번호: #{주문번호}", category: "안내", usageCount: 5821, updatedAt: "2026-06-01", scope: "전사 공통", approvalStatus: "불필요", openRate: 66.4, clickRate: 12.6, optOutRate: 0.03 },
];
const TEMPLATE_TAGS = ["VIP", "VVIP", "신규", "휴면", "생일", "포인트", "쿠폰", "최근구매", "장바구니", "앱사용자", "현대백화점", "현대홈쇼핑", "한섬", "리빙", "패션", "오프라인방문"];
const MEMBER_TAGS = ["전체 회원", "VIP", "VVIP", "일반", "신규", "휴면", "생일 대상자", "포인트 소멸 예정", "최근구매", "장바구니 이탈", "쿠폰 반응", "앱사용자", "카카오 동의", "SMS 동의", "RCS 동의", "LMS 동의", "현대백화점", "현대홈쇼핑", "한섬", "리빙 관심", "패션 관심", "오프라인 방문", "미동의 제외"];
const TAG_GROUPS = [
  { id: "전체", label: "전체 태그", tags: [] },
  { id: "대상", label: "대상", tags: ["VIP", "VVIP", "일반", "신규", "휴면", "생일 대상자", "앱사용자"] },
  { id: "행동", label: "행동/관심", tags: ["최근구매", "장바구니", "장바구니 이탈", "쿠폰 반응", "리빙 관심", "패션 관심", "오프라인 방문", "오프라인방문"] },
  { id: "목적", label: "목적", tags: ["이벤트", "쿠폰", "혜택", "안내", "포인트", "생일", "재구매", "포인트 소멸 예정"] },
  { id: "계열사", label: "계열사", tags: ["현대백화점", "현대홈쇼핑", "한섬", "리빙", "패션"] },
  { id: "동의", label: "수신 동의", tags: ["카카오 동의", "SMS 동의", "RCS 동의", "LMS 동의", "미동의 제외"] },
];
const uniqueTags = (tags: string[]) => Array.from(new Set(tags.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
const tagGroupOf = (tag: string) => TAG_GROUPS.find(group => group.id !== "전체" && group.tags.includes(tag))?.id ?? "사용자";
const tagGroupLabel = (tag: string) => TAG_GROUPS.find(group => group.id === tagGroupOf(tag))?.label ?? "사용자";
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
  { id: 1, name: "김민준", phone: "010-****-3841", type: "VIP", smsConsent: true, kakaoConsent: true, rcsConsent: false, joinedAt: "2023-03-12", lastSend: "2026-06-22" },
  { id: 2, name: "이서연", phone: "010-****-7291", type: "일반", smsConsent: true, kakaoConsent: false, rcsConsent: false, joinedAt: "2024-01-08", lastSend: "2026-06-21" },
  { id: 3, name: "박지호", phone: "010-****-5502", type: "신규", smsConsent: true, kakaoConsent: true, rcsConsent: true, joinedAt: "2026-05-30", lastSend: "2026-06-20" },
  { id: 4, name: "최수아", phone: "010-****-1183", type: "VIP", smsConsent: false, kakaoConsent: true, rcsConsent: false, joinedAt: "2022-11-20", lastSend: "2026-06-19" },
  { id: 5, name: "정도윤", phone: "010-****-9947", type: "휴면", smsConsent: true, kakaoConsent: false, rcsConsent: false, joinedAt: "2021-07-04", lastSend: "2025-12-01" },
  { id: 6, name: "윤지아", phone: "010-****-6620", type: "일반", smsConsent: true, kakaoConsent: true, rcsConsent: false, joinedAt: "2024-08-15", lastSend: "2026-06-18" },
  { id: 7, name: "한예준", phone: "010-****-3309", type: "일반", smsConsent: false, kakaoConsent: true, rcsConsent: false, joinedAt: "2025-02-28", lastSend: "2026-06-17" },
  { id: 8, name: "오서윤", phone: "010-****-8814", type: "VIP", smsConsent: true, kakaoConsent: true, rcsConsent: true, joinedAt: "2023-09-01", lastSend: "2026-06-22" },
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
    rcsConsent: index % 3 === 0,
    tags: [base.type, MEMBER_TAGS[(index + 3) % MEMBER_TAGS.length], MEMBER_TAGS[(index + 9) % MEMBER_TAGS.length], index % 2 === 0 ? "최근구매" : "장바구니 이탈"],
  };
});
const HISTORY: SendRecord[] = [
  { id: 1, template: "6월 여름 할인 이벤트", channel: "스마트 라우팅", targetType: "전체 회원", count: 284391, success: 279112, fail: 5279, sentAt: "2026-06-22 14:00", status: "완료", cost: 3128400, savedCost: 1245600, affiliate: "현대백화점", failoverSteps: [{ label: "1차 카카오 친구톡", requested: 284391, success: 279112, fail: 5279 }, { label: "2차 SMS 대체", requested: 5279, success: 5144, fail: 135 }] },
  { id: 2, template: "포인트 소멸 안내", channel: "LMS", targetType: "일반·VIP", count: 92841, success: 91220, fail: 1621, sentAt: "2026-06-21 09:30", status: "완료", cost: 2785230, savedCost: 0, affiliate: "현대홈쇼핑", failoverSteps: [{ label: "1차 LMS", requested: 92841, success: 91220, fail: 1621 }] },
  { id: 3, template: "생일 축하 메시지", channel: "SMS", targetType: "생일 대상자", count: 1284, success: 1270, fail: 14, sentAt: "2026-06-20 08:00", status: "완료", cost: 12840, savedCost: 0, affiliate: "전사 공통", failoverSteps: [{ label: "1차 SMS", requested: 1284, success: 1270, fail: 14 }] },
  { id: 4, template: "VIP 멤버십 전용 혜택", channel: "스마트 라우팅", targetType: "VIP", count: 18420, success: 18198, fail: 222, sentAt: "2026-06-19 11:00", status: "완료", cost: 198720, savedCost: 82680, affiliate: "한섬", failoverSteps: [{ label: "1차 카카오 친구톡", requested: 18420, success: 18198, fail: 222 }, { label: "2차 SMS 대체", requested: 222, success: 219, fail: 3 }] },
  { id: 5, template: "신규 가입 환영", channel: "카카오 알림톡", targetType: "신규 가입자", count: 341, success: 338, fail: 3, sentAt: "2026-06-19 실시간", status: "진행중", cost: 2046, savedCost: 1364, affiliate: "전사 공통", failoverSteps: [{ label: "1차 카카오 알림톡", requested: 341, success: 338, fail: 3 }] },
  { id: 6, template: "배송 완료 안내", channel: "SMS", targetType: "배송 완료자", count: 2841, success: 2830, fail: 11, sentAt: "2026-06-18 16:00", status: "완료", cost: 28410, savedCost: 0, affiliate: "현대백화점", failoverSteps: [{ label: "1차 SMS", requested: 2841, success: 2830, fail: 11 }] },
];

const formatWon = (value: number) => `₩${value.toLocaleString()}`;
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
  { type: "VIP", count: 28420, rate: 99.1, open: 68.4 },
  { type: "일반", count: 198341, rate: 98.2, open: 41.2 },
  { type: "신규", count: 34210, rate: 97.8, open: 52.1 },
  { type: "휴면", count: 23420, rate: 94.2, open: 18.3 },
];
const performanceData = [
  { month: "1월", openRate: 38.2, clickRate: 12.4, conversionRate: 3.2 },
  { month: "2월", openRate: 41.1, clickRate: 14.2, conversionRate: 3.9 },
  { month: "3월", openRate: 44.8, clickRate: 16.1, conversionRate: 4.4 },
  { month: "4월", openRate: 43.2, clickRate: 15.8, conversionRate: 4.1 },
  { month: "5월", openRate: 47.9, clickRate: 18.3, conversionRate: 5.2 },
  { month: "6월", openRate: 49.4, clickRate: 19.1, conversionRate: 5.8 },
];

// ─── Shared Components ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, icon, color = "blue" }: {
  label: string; value: string; sub?: string; trend?: { val: string; up: boolean }; icon: React.ReactNode; color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight mb-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
          {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.val} 전주 대비
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
    vip: "bg-gradient-to-r from-amber-400 to-orange-400 text-white",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${v[variant] || v.default}`}>{text}</span>;
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
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">현대퓨처넷</span>
          </div>
          <p className="text-sm text-muted-foreground">메시징 시스템에 로그인하세요</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">관리자 ID</label>
              <input
                value={id} onChange={e => { setId(e.target.value); setError(""); }}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">비밀번호</label>
              <input
                type="password" value={pw} onChange={e => { setPw(e.target.value); setError(""); }}
                placeholder="••••••••"
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
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">데모: 아무 값이나 입력 후 로그인</p>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">© 2026 현대퓨처넷. All rights reserved.</p>
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
  { page: "members" as Page, icon: Users, label: "회원 관리" },
];
const STAT_ITEMS = [
  { page: "stats-overview" as Page, label: "발송 현황" },
  { page: "stats-channel" as Page, label: "채널 분석" },
  { page: "stats-routing" as Page, label: "비용/라우팅 분석" },
  { page: "stats-member" as Page, label: "회원 분석" },
  { page: "stats-performance" as Page, label: "성과 분석" },
];

function Sidebar({ current, setCurrent, onLogout }: { current: Page; setCurrent: (p: Page) => void; onLogout: () => void }) {
  const [statsOpen, setStatsOpen] = useState(current.startsWith("stats"));
  const isStats = current.startsWith("stats");

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">현대퓨처넷</div>
            <div className="text-[10px] text-muted-foreground">Messaging System</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => setCurrent(page)}
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
                  onClick={() => { setCurrent(page); setStatsOpen(true); }}
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
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<Page, string> = {
  dashboard: "대시보드", send: "메시지 발송", templates: "템플릿 관리", history: "전송 기록",
  members: "회원 관리", "stats-overview": "통계 · 발송 현황", "stats-channel": "통계 · 채널 분석",
  "stats-routing": "통계 · 비용/라우팅 분석", "stats-member": "통계 · 회원 분석", "stats-performance": "통계 · 성과 분석",
};
function Header({ page }: { page: Page }) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-bold text-foreground">{PAGE_TITLES[page]}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">김</div>
          <span className="text-xs font-semibold text-foreground">김민준</span>
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="오늘 발송 건수" value="12,847" sub="06월 23일 기준" trend={{ val: "+8.2%", up: true }} icon={<Send className="w-4 h-4" />} color="blue" />
        <StatCard label="발송 성공률" value="98.7%" sub="실패 165건" trend={{ val: "+0.3%p", up: true }} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <StatCard label="활성 회원 수" value="284,391" sub="전체 307,811명" trend={{ val: "+1,284명", up: true }} icon={<Users className="w-4 h-4" />} color="violet" />
        <StatCard label="이번달 누적 발송" value="892,451" sub="목표 1,000,000건" trend={{ val: "+12.4%", up: true }} icon={<BarChart3 className="w-4 h-4" />} color="amber" />
        <StatCard label="스마트 라우팅 절감" value="₩5.5M" sub="SMS/LMS 대비 누적" trend={{ val: "+22.1%", up: true }} icon={<Zap className="w-4 h-4" />} color="green" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">실시간 발송 큐 상태</h3>
            <p className="text-xs text-muted-foreground mt-1">대량 발송 엔진의 현재 처리 흐름입니다.</p>
          </div>
          <button onClick={() => setPage("stats-routing")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">상세 분석 <ChevronRight className="w-3 h-3" /></button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {QUEUE_STATUS.map(item => (
            <div key={item.label} className="rounded-lg bg-muted p-3">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className="text-lg font-bold">{item.count.toLocaleString()}건</div>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          {QUEUE_STATUS.map(item => {
            const total = QUEUE_STATUS.reduce((sum, current) => sum + current.count, 0);
            return <div key={item.label} className={`${item.color} h-full`} style={{ width: `${Math.max(2, (item.count / total) * 100)}%` }} />;
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">일별 발송 추이</h3>
            <span className="text-xs text-muted-foreground">최근 7일</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="sendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1843FA" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1843FA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: number) => [v.toLocaleString() + "건"]} />
              <Area type="monotone" dataKey="sends" stroke="#1843FA" fill="url(#sendGrad)" strokeWidth={2} name="발송" />
              <Area type="monotone" dataKey="success" stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 3" name="성공" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">채널별 비중</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RePieChart>
              <Pie data={channelPie} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                {channelPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`]} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {channelPie.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
                <span className="font-semibold">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">최근 전송 기록</h3>
            <button onClick={() => setPage("history")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">전체보기 <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-3">
            {HISTORY.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">빠른 작업</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Send, label: "메시지 발송", sub: "즉시 발송", page: "send" as Page, color: "bg-primary" },
              { icon: FileText, label: "템플릿 관리", sub: "6개 활성", page: "templates" as Page, color: "bg-violet-600" },
              { icon: Users, label: "회원 관리", sub: "284,391명", page: "members" as Page, color: "bg-emerald-600" },
              { icon: BarChart3, label: "통계 확인", sub: "성과 분석", page: "stats-overview" as Page, color: "bg-amber-500" },
            ].map(item => (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all group text-left"
              >
                <div className={`w-9 h-9 ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3.5 bg-accent rounded-xl border border-primary/15">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-primary mb-0.5">AI 마케팅 인사이트</div>
                <div className="text-xs text-muted-foreground">이번 주 VIP 회원 오픈율이 평균 대비 23% 높습니다. VIP 전용 프로모션을 고려해보세요.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Send Message Page ────────────────────────────────────────────────────────
const CHANNELS = [
  { id: "smart-routing", label: "스마트 라우팅", sub: "최저가 조합 자동 선택", icon: Zap },
  { id: "sms", label: "SMS", sub: "90자 이내 단문", icon: Phone },
  { id: "lms", label: "LMS", sub: "2,000자 이내 장문", icon: Mail },
  { id: "kakao-noti", label: "카카오 알림톡", sub: "거래/안내 메시지", icon: MessageSquare },
  { id: "kakao-friend", label: "카카오 친구톡", sub: "마케팅 메시지", icon: Megaphone },
  { id: "rcs", label: "RCS", sub: "리치 미디어 메시지", icon: Zap },
];
function SendMessagePage() {
  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [customText, setCustomText] = useState("");
  const [aiChecking, setAiChecking] = useState(false);
  const [aiResult, setAiResult] = useState<null | { ok: boolean; items: string[] }>(null);
  const [aiGenModal, setAiGenModal] = useState(false);
  const [aiGenResult, setAiGenResult] = useState<string[]>([]);
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendType, setSendType] = useState<"now" | "later">("now");

  const tpl = TEMPLATES.find(t => t.id === selectedTemplate);
  const messageText = tpl ? tpl.content : customText;
  const visibleTags = (tagSearch ? MEMBER_TAGS.filter(tag => tag.includes(tagSearch)) : MEMBER_TAGS).slice(0, 12);
  const relatedTags = tagSearch
    ? MEMBER_TAGS.filter(tag => !visibleTags.includes(tag) && !selectedTags.includes(tag) && [...tagSearch].some(ch => tag.includes(ch))).slice(0, 8)
    : MEMBER_TAGS.filter(tag => selectedTags.some(selected => selected !== tag && (tag.includes(selected) || selected.includes(tag)))).slice(0, 8);

  const toggleTag = (t: string) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const runAiCheck = () => {
    setAiChecking(true);
    setTimeout(() => {
      setAiChecking(false);
      setAiResult({
        ok: true,
        items: ["맞춤법 이상 없음", "민감 표현 미감지", "광고성 문구 적합 여부 확인됨", "발송 권장: 오전 10~11시"],
      });
    }, 1800);
  };

  const runAiGen = () => {
    setAiGenLoading(true);
    setTimeout(() => {
      setAiGenLoading(false);
      setAiGenResult([
        `[현대퓨처넷] ${selectedTags.includes("VIP") ? "소중한 VIP 고객님께 드리는 특별 혜택! " : ""}이번 달 한정 프로모션으로 최대 40% 할인 혜택을 누리세요. 지금 바로 확인하세요 →`,
        `[현대퓨처넷] 고객님만을 위한 맞춤 혜택이 도착했습니다. 7월 시작을 더욱 특별하게 만들어 드릴 단독 이벤트를 놓치지 마세요!`,
        `[현대퓨처넷] 안녕하세요! 오늘만 제공되는 특가 소식을 전해드립니다. 한정 수량으로 조기 마감될 수 있습니다.`,
      ]);
    }, 2000);
  };

  if (sent) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">발송 완료!</h2>
        <p className="text-sm text-muted-foreground mb-6">메시지가 성공적으로 발송 요청되었습니다.</p>
        <Btn onClick={() => { setSent(false); setStep(1); setSelectedTags([]); setSelectedTemplate(null); setSelectedChannel(""); setCustomText(""); setAiResult(null); }}>새 메시지 발송</Btn>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{step > s ? <Check className="w-3.5 h-3.5" /> : s}</div>
            <span className={`text-xs font-medium ${step === s ? "text-foreground" : "text-muted-foreground"}`}>{["수신자 선택", "메시지 작성", "채널 선택", "검토 및 발송"][s - 1]}</span>
            {s < 4 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">수신자 유형 선택 <span className="text-red-500">*</span></h3>
            <p className="text-xs text-muted-foreground mb-3">태그 수가 많은 운영 환경을 기준으로 검색 후 선택하세요. 복수 선택 가능합니다.</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={tagSearch} onChange={e => setTagSearch(e.target.value)} placeholder="태그 검색: VIP, 최근구매, 카카오 동의..." className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted rounded-lg">
                {selectedTags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-white flex items-center gap-1">{tag}<X className="w-3 h-3" /></button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {visibleTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedTags.includes(tag) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {relatedTags.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold text-muted-foreground mb-2">유사 태그</div>
                <div className="flex flex-wrap gap-2">
                  {relatedTags.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground">{tag}</button>)}
                </div>
              </div>
            )}
            {selectedTags.length > 0 && (
              <div className="mt-3 p-3 bg-accent rounded-lg">
                <p className="text-xs text-primary font-semibold">예상 발송 대상: {selectedTags.includes("전체 회원") ? "284,391명" : `${(selectedTags.length * 42000 + 3000).toLocaleString()}명`}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end"><Btn onClick={() => setStep(2)} disabled={selectedTags.length === 0}>다음 단계 <ChevronRight className="w-3.5 h-3.5" /></Btn></div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">템플릿 선택</h3>
              <Btn variant="outline" size="sm" onClick={() => { setAiGenModal(true); runAiGen(); }}><Sparkles className="w-3.5 h-3.5 text-primary" /> AI 문구 추천</Btn>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${selectedTemplate === t.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}
                >
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedTemplate === t.id ? "border-primary bg-primary" : "border-border"}`}>
                    {selectedTemplate === t.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-foreground">{t.name}</span>
                      <Badge text={t.channel} variant="blue" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.content.replace(/\n/g, " ")}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setSelectedTemplate(0)}
                className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all ${selectedTemplate === 0 ? "border-primary bg-accent" : "border-dashed border-border hover:border-primary/40"}`}
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold">직접 입력</span>
              </button>
            </div>
            {selectedTemplate === 0 && (
              <textarea
                value={customText} onChange={e => setCustomText(e.target.value)}
                placeholder="메시지 내용을 직접 입력하세요..."
                className="w-full h-28 px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
          </div>
          <div className="flex justify-between">
            <Btn variant="outline" onClick={() => setStep(1)}>이전</Btn>
            <Btn onClick={() => setStep(3)} disabled={selectedTemplate === null || (selectedTemplate === 0 && !customText)}>다음 단계 <ChevronRight className="w-3.5 h-3.5" /></Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-bold mb-3">전송 채널 선택 <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-1 gap-2">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={`flex items-center gap-4 p-3.5 rounded-lg border transition-all ${selectedChannel === ch.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedChannel === ch.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    <ch.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">{ch.label}</div>
                    <div className="text-xs text-muted-foreground">{ch.sub}</div>
                  </div>
                  {selectedChannel === ch.id && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Btn variant="outline" onClick={() => setStep(2)}>이전</Btn>
            <Btn onClick={() => setStep(4)} disabled={!selectedChannel}>다음 단계 <ChevronRight className="w-3.5 h-3.5" /></Btn>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="text-sm font-bold mb-1">발송 전 최종 확인</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground block mb-1">수신 대상</span><span className="font-bold">{selectedTags.join(", ")}</span></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground block mb-1">전송 채널</span><span className="font-bold">{CHANNELS.find(c => c.id === selectedChannel)?.label}</span></div>
              <div className="col-span-2 p-3 bg-muted rounded-lg"><span className="text-muted-foreground block mb-1">메시지 내용</span><span className="font-semibold whitespace-pre-wrap text-xs">{messageText}</span></div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSendType("now")}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all ${sendType === "now" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}
              >즉시 발송</button>
              <button
                onClick={() => setSendType("later")}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all ${sendType === "later" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}
              >예약 발송</button>
            </div>
            {sendType === "later" && (
              <input type="datetime-local" className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none" />
            )}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">AI 메시지 검사</span>
                {!aiResult && <Btn size="sm" onClick={runAiCheck} disabled={aiChecking}><Sparkles className="w-3.5 h-3.5" />{aiChecking ? "분석 중..." : "AI 검사 실행"}</Btn>}
              </div>
              {aiChecking && (
                <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="text-xs text-primary font-semibold">메시지를 분석하고 있습니다...</span>
                </div>
              )}
              {aiResult && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1.5 mb-2"><CheckCircle2 className="w-3.5 h-3.5 text-white" /><span className="text-xs font-bold text-white">검사 완료 — 이상 없음</span></div>
                  <AiReportDetail compact />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <Btn variant="outline" onClick={() => setStep(3)}>이전</Btn>
            <Btn variant="success" onClick={() => setSent(true)}><Send className="w-3.5 h-3.5" /> 발송하기</Btn>
          </div>
        </div>
      )}

      <Modal open={aiGenModal} onClose={() => setAiGenModal(false)} title="AI 마케팅 문구 추천" wide>
        {aiGenLoading ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">수신자 정보를 분석하여 최적의 문구를 생성 중...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-4">선택한 수신자 정보 기반으로 생성된 마케팅 문구입니다.</p>
            {aiGenResult.map((text, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg border border-border hover:border-primary/40 transition-all">
                <p className="text-sm text-foreground mb-3 leading-relaxed">{text}</p>
                <Btn size="sm" variant="outline" onClick={() => { setCustomText(text); setSelectedTemplate(0); setAiGenModal(false); setStep(2); }}>이 문구 사용</Btn>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function SendMessagePageV2() {
  const members = useMemo(() => createMemberRows(), []);
  const templates = useMemo(() => createTemplateRows(), []);
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [selectedTags, setSelectedTags] = useState<string[]>(["카카오 동의"]);
  const [tagSearch, setTagSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [checkedMembers, setCheckedMembers] = useState<number[]>([]);
  const [includedMembers, setIncludedMembers] = useState<Member[]>([]);
  const [excludedMembers, setExcludedMembers] = useState<Member[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(templates[0]?.id ?? 0);
  const [messageDraft, setMessageDraft] = useState(templates[0]?.content ?? "");
  const [selectedChannel, setSelectedChannel] = useState("kakao-friend");
  const [sendType, setSendType] = useState<"now" | "later">("now");
  const [smartRouting, setSmartRouting] = useState(true);
  const [failoverEnabled, setFailoverEnabled] = useState(true);
  const [fallbacks, setFallbacks] = useState({ name: "고객님", point: "0", order: "주문번호 없음" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<null | { title: string; reason: string; audience: string; template: string; channel: string; message: string }>(null);
  const [aiResult, setAiResult] = useState(false);
  const [aiJobs, setAiJobs] = useState([
    { name: "오타·맞춤법", model: "small-ko-proof", status: "대기", result: "-" },
    { name: "광고 표기", model: "small-policy-ad", status: "대기", result: "-" },
    { name: "민감 표현", model: "small-risk-ko", status: "대기", result: "-" },
    { name: "개인정보·마스킹", model: "small-privacy-ko", status: "대기", result: "-" },
    { name: "채널 길이", model: "small-channel-fit", status: "대기", result: "-" },
    { name: "발송 피로도", model: "small-frequency", status: "대기", result: "-" },
  ]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const visibleTags = (tagSearch ? MEMBER_TAGS.filter(tag => tag.includes(tagSearch)) : MEMBER_TAGS).slice(0, 14);
  const relatedTags = MEMBER_TAGS
    .filter(tag => !selectedTags.includes(tag) && (tagSearch ? [...tagSearch].some(ch => tag.includes(ch)) : selectedTags.some(selected => tag.includes(selected) || selected.includes(tag))))
    .slice(0, 8);
  const candidateMembers = members.filter(member => {
    const memberTags = member.tags ?? [];
    const tagMatch = selectedTags.length === 0 || selectedTags.includes("전체 회원") || selectedTags.some(tag => memberTags.includes(tag) || member.type === tag);
    const keyword = !memberSearch || member.name.includes(memberSearch) || member.phone.includes(memberSearch) || memberTags.some(tag => tag.includes(memberSearch));
    return tagMatch && keyword;
  });
  const visibleMembers = candidateMembers.slice(0, 8);
  const filteredTemplates = templates.filter(template => {
    const tags = getTemplateTags(template);
    return !templateSearch || template.name.includes(templateSearch) || template.content.includes(templateSearch) || template.channel.includes(templateSearch) || tags.some(tag => tag.includes(templateSearch));
  });
  const visibleTemplates = filteredTemplates.slice(0, 9);
  const estimatedTarget = selectedTags.includes("전체 회원") ? 284391 : Math.max(4200, candidateMembers.length * 1370 + includedMembers.length - excludedMembers.length);
  const aiComplete = aiJobs.every(job => job.status === "완료") && aiResult;
  const canSend = selectedTags.length > 0 && messageDraft.trim().length > 0 && !!selectedChannel && aiComplete;

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
  const toggleMemberCheck = (id: number) => setCheckedMembers(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
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
    const manual: Member = { id: Date.now(), name: manualName, phone: manualPhone, type: "수동", smsConsent: true, kakaoConsent: true, rcsConsent: false, joinedAt: "-", lastSend: "-", tags: ["수동 추가"] };
    setIncludedMembers(prev => mergeMembers(prev, [manual]));
    setManualName("");
    setManualPhone("");
  };
  const pickTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setMessageDraft(template.content);
  };
  const runAiPlan = () => {
    setAiLoading(true);
    window.setTimeout(() => {
      const template = templates.find(t => getTemplateTags(t).includes("VIP")) ?? templates[0];
      const message = "[현대퓨처넷] #{이름}님, 최근 관심 상품 기준으로 선별한 VIP 혜택이 준비되었습니다. 앱에서 쿠폰과 사용 기간을 확인해 주세요. 수신거부 080-000-0000";
      setAiPlan({
        title: "VIP 최근구매 고객 재구매 캠페인",
        reason: "최근구매·카카오 동의·VIP 태그 조합의 예상 반응률이 가장 높습니다.",
        audience: "VIP, 최근구매, 카카오 동의",
        template: template.name,
        channel: "카카오 친구톡",
        message,
      });
      setSelectedTags(["VIP", "최근구매", "카카오 동의"]);
      setSelectedChannel("kakao-friend");
      setSelectedTemplateId(template.id);
      setMessageDraft(message);
      setIncludedMembers(members.filter(member => member.tags?.includes("VIP")).slice(0, 3));
      setAiLoading(false);
    }, 1200);
  };
  const runAiCheck = () => {
    setAiResult(false);
    setAiJobs(jobs => jobs.map(job => ({ ...job, status: "실행중", result: "queued" })));
    aiJobs.forEach((job, index) => {
      window.setTimeout(() => {
        setAiJobs(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, status: "완료", result: ["정상", "주의 1건", "위험 없음", "마스킹 필요 없음", messageDraft.length > 90 ? "LMS/RCS 권장" : "SMS 가능", "빈도 정상"][index] } : item));
        if (index === aiJobs.length - 1) setAiResult(true);
      }, 500 + index * 280);
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {[
            ["manual", "수동 설정"],
            ["ai", "AI 자동 추천"],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setMode(value as "manual" | "ai")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === value ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>
          ))}
        </div>
        <Btn variant="outline" onClick={runAiCheck} disabled={!messageDraft || aiJobs.some(job => job.status === "실행중")}><Sparkles className="w-3.5 h-3.5 text-primary" /> AI 검사 실행</Btn>
      </div>

      {mode === "ai" && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold mb-1">AI가 수신자·템플릿·채널·문구를 한 번에 추천</h3>
              <p className="text-xs text-muted-foreground">선택된 태그, 최근 성과, 채널 적합성을 기준으로 발송안을 구성합니다.</p>
            </div>
            <Btn onClick={runAiPlan} disabled={aiLoading}><Sparkles className="w-3.5 h-3.5" />{aiLoading ? "추천 중..." : "추천 받기"}</Btn>
          </div>
          {aiPlan && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 p-4 bg-muted rounded-xl">
                <div className="text-sm font-bold mb-1">{aiPlan.title}</div>
                <p className="text-xs text-muted-foreground mb-3">{aiPlan.reason}</p>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">{aiPlan.message}</pre>
              </div>
              <div className="space-y-2">
                {[["대상", aiPlan.audience], ["템플릿", aiPlan.template], ["채널", aiPlan.channel], ["예상 대상", `${estimatedTarget.toLocaleString()}명`]].map(([label, value]) => (
                  <div key={label} className="p-3 bg-muted rounded-lg"><div className="text-xs text-muted-foreground mb-1">{label}</div><div className="text-xs font-bold">{value}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">수신자 선택</h3>
              <span className="text-xs font-semibold text-primary">예상 대상 {estimatedTarget.toLocaleString()}명</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={tagSearch} onChange={e => setTagSearch(e.target.value)} placeholder="태그 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {visibleTags.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedTags.includes(tag) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>{tag}</button>)}
            </div>
            {relatedTags.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-muted-foreground mb-2">유사 태그</div>
                <div className="flex flex-wrap gap-2">{relatedTags.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground">{tag}</button>)}</div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="회원명, 번호, 태그 검색" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none" />
                  </div>
                  <Btn size="sm" variant="outline" onClick={addChecked}>선택 추가</Btn>
                  <Btn size="sm" variant="outline" onClick={excludeChecked}>선택 제외</Btn>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  {visibleMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-blue-50/60 cursor-pointer transition-colors">
                      <input type="checkbox" checked={checkedMembers.includes(member.id)} onChange={() => toggleMemberCheck(member.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold">{member.name} <span className="font-mono text-muted-foreground">{member.phone}</span></div>
                        <div className="flex flex-wrap gap-1 mt-1">{(member.tags ?? []).slice(0, 4).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-xl">
                  <div className="text-xs font-bold mb-2">회원 직접 추가</div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="이름" className="px-3 py-2 rounded-lg border border-border bg-card text-xs" />
                    <input value={manualPhone} onChange={e => setManualPhone(e.target.value)} placeholder="전화번호" className="px-3 py-2 rounded-lg border border-border bg-card text-xs" />
                  </div>
                  <Btn size="sm" variant="outline" onClick={addManualMember}><Plus className="w-3 h-3" /> 직접 추가</Btn>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <RecipientBox title="포함 대상" members={includedMembers} onRemove={(id) => setIncludedMembers(prev => prev.filter(member => member.id !== id))} />
                  <RecipientBox title="제외 대상" members={excludedMembers} onRemove={(id) => setExcludedMembers(prev => prev.filter(member => member.id !== id))} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold">템플릿 검색 및 메시지 작성</h3>
              <span className="text-xs text-muted-foreground">운영 템플릿 24,680건 기준</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} placeholder="템플릿명, 채널, 태그, 문구 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4">
              <div className="rounded-xl border border-border overflow-hidden">
                {visibleTemplates.map(template => (
                  <button key={template.id} onClick={() => pickTemplate(template)} className={`block w-full text-left px-3 py-3 border-b border-border last:border-0 transition-colors cursor-pointer ${selectedTemplateId === template.id ? "bg-accent" : "hover:bg-blue-50/60"}`}>
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold">{template.name}</span><Badge text={template.channel} variant="blue" /></div>
                    <p className="text-xs text-muted-foreground truncate">{template.content.replace(/\n/g, " ")}</p>
                  </button>
                ))}
                <div className="px-3 py-2 bg-muted text-xs text-muted-foreground">{filteredTemplates.length.toLocaleString()}건 검색됨 · 상위 9건 표시</div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold">템플릿 미리보기</div>
                    <span className="text-xs text-muted-foreground">{messageDraft.length}자</span>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {selectedTemplate && <Badge text={selectedTemplate.channel} variant="blue" />}
                    {selectedTemplate && getTemplateTags(selectedTemplate).map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-card border border-border text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg bg-card border border-border p-3 text-sm leading-relaxed">{messageDraft.replaceAll("#{이름}", "김민준")}</pre>
                </div>
                <textarea value={messageDraft} onChange={e => { setMessageDraft(e.target.value); setSelectedTemplateId(0); }} rows={6} className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-bold mb-3">채널 선택</h3>
            <div className="space-y-2">
              {CHANNELS.map(channel => (
                <button key={channel.id} onClick={() => setSelectedChannel(channel.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedChannel === channel.id ? "border-primary bg-accent" : "border-border hover:bg-blue-50/60"}`}>
                  <channel.icon className="w-4 h-4 text-primary" />
                  <div className="text-left flex-1"><div className="text-xs font-bold">{channel.label}</div><div className="text-xs text-muted-foreground">{channel.sub}</div></div>
                  {selectedChannel === channel.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">AI 메시지 검사</h3>
              <Badge text={aiComplete ? "완료" : aiJobs.some(job => job.status === "실행중") ? "실행중" : "대기"} variant={aiComplete ? "green" : "default"} />
            </div>
            <div className="space-y-2">
              {aiJobs.map(job => (
                <div key={job.name} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold">{job.name}</span><Badge text={job.status} variant={job.status === "완료" ? "green" : job.status === "실행중" ? "amber" : "default"} /></div>
                  <div className="text-xs text-muted-foreground">{job.model} · {job.result}</div>
                </div>
              ))}
            </div>
            {aiComplete && <div className="mt-3"><AiReportDetail compact /></div>}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-sm font-bold">최종 발송</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">태그 조건</span><b>{selectedTags.join(", ") || "-"}</b></div>
              <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">부분 선택</span><b>포함 {includedMembers.length} · 제외 {excludedMembers.length}</b></div>
              <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">채널</span><b>{CHANNELS.find(channel => channel.id === selectedChannel)?.label}</b></div>
              <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">AI 검사</span><b>{aiComplete ? "완료" : "필요"}</b></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSendType("now")} className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold ${sendType === "now" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}>즉시 발송</button>
              <button onClick={() => setSendType("later")} className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold ${sendType === "later" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}>예약 발송</button>
            </div>
            {sendType === "later" && <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm" />}
            <Btn variant="success" disabled={!canSend} onClick={() => alert("발송 요청이 생성되었습니다.")} className="w-full justify-center"><Send className="w-3.5 h-3.5" /> 발송 요청</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendMessagePageWizard() {
  const members = useMemo(() => createMemberRows(), []);
  const templates = useMemo(() => createTemplateRows(), []);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [selectedTags, setSelectedTags] = useState<string[]>(["카카오 동의"]);
  const [tagSearch, setTagSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [checkedMembers, setCheckedMembers] = useState<number[]>([]);
  const [includedMembers, setIncludedMembers] = useState<Member[]>([]);
  const [excludedMembers, setExcludedMembers] = useState<Member[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(templates[0]?.id ?? 0);
  const [messageDraft, setMessageDraft] = useState(templates[0]?.content ?? "");
  const [selectedChannel, setSelectedChannel] = useState("kakao-friend");
  const [sendType, setSendType] = useState<"now" | "later">("now");
  const [smartRouting, setSmartRouting] = useState(true);
  const [failoverEnabled, setFailoverEnabled] = useState(true);
  const [fallbacks, setFallbacks] = useState({ name: "고객님", point: "0", order: "주문번호 없음" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<null | { title: string; reason: string; audience: string; template: string; channel: string; message: string }>(null);
  const [aiResult, setAiResult] = useState(false);
  const [aiJobs, setAiJobs] = useState([
    { name: "오타·맞춤법", model: "small-ko-proof", status: "대기", result: "-" },
    { name: "광고 표기", model: "small-policy-ad", status: "대기", result: "-" },
    { name: "민감 표현", model: "small-risk-ko", status: "대기", result: "-" },
    { name: "개인정보·마스킹", model: "small-privacy-ko", status: "대기", result: "-" },
    { name: "채널 길이", model: "small-channel-fit", status: "대기", result: "-" },
    { name: "발송 피로도", model: "small-frequency", status: "대기", result: "-" },
  ]);

  const selectedTemplate = templates.find(template => template.id === selectedTemplateId);
  const visibleTags = (tagSearch ? MEMBER_TAGS.filter(tag => tag.includes(tagSearch)) : MEMBER_TAGS).slice(0, 12);
  const relatedTags = MEMBER_TAGS
    .filter(tag => !selectedTags.includes(tag) && (tagSearch ? [...tagSearch].some(ch => tag.includes(ch)) : selectedTags.some(selected => tag.includes(selected) || selected.includes(tag))))
    .slice(0, 8);
  const candidateMembers = members.filter(member => {
    const memberTags = member.tags ?? [];
    const tagMatch = selectedTags.length === 0 || selectedTags.includes("전체 회원") || selectedTags.some(tag => memberTags.includes(tag) || member.type === tag);
    const keyword = !memberSearch || member.name.includes(memberSearch) || member.phone.includes(memberSearch) || memberTags.some(tag => tag.includes(memberSearch));
    return tagMatch && keyword;
  });
  const visibleMembers = candidateMembers.slice(0, 9);
  const filteredTemplates = templates.filter(template => {
    const tags = getTemplateTags(template);
    return !templateSearch || template.name.includes(templateSearch) || template.content.includes(templateSearch) || template.channel.includes(templateSearch) || tags.some(tag => tag.includes(templateSearch));
  });
  const visibleTemplates = filteredTemplates.slice(0, 10);
  const estimatedTarget = selectedTags.includes("전체 회원") ? 284391 : Math.max(4200, candidateMembers.length * 1370 + includedMembers.length - excludedMembers.length);
  const messageMode = messageDraft.length > 45 ? "LMS" : "SMS";
  const selectedChannelMeta = CHANNELS.find(channel => channel.id === selectedChannel);
  const unitCost = selectedChannel === "smart-routing" || smartRouting ? 7 : selectedChannel === "sms" ? 10 : selectedChannel === "lms" ? 30 : selectedChannel === "kakao-noti" ? 6 : selectedChannel === "rcs" ? 14 : 8;
  const estimatedCost = estimatedTarget * unitCost;
  const baselineCost = estimatedTarget * (messageMode === "LMS" ? 30 : 10);
  const estimatedSaving = Math.max(0, baselineCost - estimatedCost);
  const aiComplete = aiJobs.every(job => job.status === "완료") && aiResult;
  const canSend = selectedTags.length > 0 && messageDraft.trim().length > 0 && !!selectedChannel && aiComplete;
  const stepMeta = ["수신자 선택", "메시지 작성", "채널 선택", "검토 및 발송"];
  const stepReady = [
    selectedTags.length > 0,
    messageDraft.trim().length > 0,
    !!selectedChannel,
    canSend,
  ];

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
  const selectAllMembers = () => setSelectedTags(["전체 회원"]);
  const insertVariable = (value: string) => setMessageDraft(prev => `${prev}${prev.endsWith(" ") || prev.length === 0 ? "" : " "}${value}`);
  const toggleMemberCheck = (id: number) => setCheckedMembers(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
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
    const manual: Member = { id: Date.now(), name: manualName, phone: manualPhone, type: "수동", smsConsent: true, kakaoConsent: true, rcsConsent: false, joinedAt: "-", lastSend: "-", tags: ["수동 추가"] };
    setIncludedMembers(prev => mergeMembers(prev, [manual]));
    setManualName("");
    setManualPhone("");
  };
  const pickTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setMessageDraft(template.content);
  };
  const runAiPlan = () => {
    setAiLoading(true);
    window.setTimeout(() => {
      const template = templates.find(item => getTemplateTags(item).includes("VIP")) ?? templates[0];
      const message = "[현대퓨처넷] #{이름}님, 최근 관심 상품 기준으로 선별한 VIP 혜택이 준비되었습니다. 앱에서 쿠폰과 사용 기간을 확인해 주세요. 수신거부 080-000-0000";
      setAiPlan({
        title: "VIP 최근구매 고객 재구매 캠페인",
        reason: "최근구매·카카오 동의·VIP 태그 조합의 예상 반응률이 가장 높습니다.",
        audience: "VIP, 최근구매, 카카오 동의",
        template: template.name,
        channel: "카카오 친구톡",
        message,
      });
      setSelectedTags(["VIP", "최근구매", "카카오 동의"]);
      setSelectedChannel("kakao-friend");
      setSelectedTemplateId(template.id);
      setMessageDraft(message);
      setIncludedMembers(members.filter(member => member.tags?.includes("VIP")).slice(0, 3));
      setStep(2);
      setAiLoading(false);
    }, 1200);
  };
  const runAiCheck = () => {
    setAiResult(false);
    setAiJobs(jobs => jobs.map(job => ({ ...job, status: "실행중", result: "queued" })));
    aiJobs.forEach((job, index) => {
      window.setTimeout(() => {
        setAiJobs(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, status: "완료", result: ["정상", "주의 1건", "위험 없음", "마스킹 필요 없음", messageDraft.length > 90 ? "LMS/RCS 권장" : "SMS 가능", "빈도 정상"][index] } : item));
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
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">태그 기반 수신자</h3>
          <div className="flex items-center gap-2">
            <button onClick={selectAllMembers} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-primary hover:bg-accent">전체 회원 선택</button>
            <span className="text-xs font-semibold text-primary">예상 {estimatedTarget.toLocaleString()}명</span>
          </div>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={tagSearch} onChange={event => setTagSearch(event.target.value)} placeholder="태그 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {visibleTags.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${selectedTags.includes(tag) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-accent"}`}>
              {tag}
            </button>
          ))}
        </div>
        {relatedTags.length > 0 && (
          <div className="mb-4 rounded-lg border border-border bg-muted p-3">
            <div className="text-xs font-bold text-muted-foreground mb-2">유사 태그</div>
            <div className="flex flex-wrap gap-2">
              {relatedTags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="회원명, 번호, 태그 검색" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none" />
            </div>
            <Btn size="sm" variant="outline" onClick={addChecked}>포함</Btn>
            <Btn size="sm" variant="outline" onClick={excludeChecked}>제외</Btn>
          </div>
          {visibleMembers.map(member => (
            <label key={member.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-blue-50/60 cursor-pointer transition-colors">
              <input type="checkbox" checked={checkedMembers.includes(member.id)} onChange={() => toggleMemberCheck(member.id)} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold">{member.name} <span className="font-mono text-muted-foreground">{member.phone}</span></div>
                <div className="flex flex-wrap gap-1 mt-1">{(member.tags ?? []).slice(0, 5).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}</div>
              </div>
              <span className="text-xs text-muted-foreground">{member.type}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold mb-3">회원 직접 추가</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input value={manualName} onChange={event => setManualName(event.target.value)} placeholder="이름" className="px-3 py-2 rounded-lg border border-border bg-input-background text-xs" />
            <input value={manualPhone} onChange={event => setManualPhone(event.target.value)} placeholder="전화번호" className="px-3 py-2 rounded-lg border border-border bg-input-background text-xs" />
          </div>
          <Btn size="sm" variant="outline" onClick={addManualMember}><Plus className="w-3 h-3" /> 직접 추가</Btn>
        </div>
        <RecipientBox title="포함 대상" members={includedMembers} onRemove={(id) => setIncludedMembers(prev => prev.filter(member => member.id !== id))} />
        <RecipientBox title="제외 대상" members={excludedMembers} onRemove={(id) => setExcludedMembers(prev => prev.filter(member => member.id !== id))} />
      </div>
    </div>
  );

  const renderMessage = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold mb-3">템플릿 검색</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={templateSearch} onChange={event => setTemplateSearch(event.target.value)} placeholder="템플릿명, 채널, 태그, 문구 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          {visibleTemplates.map(template => {
            const locked = (template.channel.includes("알림톡") || template.channel === "RCS") && template.approvalStatus !== "승인 완료";
            return (
            <button key={template.id} disabled={locked} onClick={() => !locked && pickTemplate(template)} className={`block w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${locked ? "cursor-not-allowed opacity-55 bg-muted/40" : selectedTemplateId === template.id ? "bg-accent cursor-pointer" : "hover:bg-blue-50/60 cursor-pointer"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold truncate">{template.name}</span>
                <Badge text={template.channel} variant="blue" />
                {template.approvalStatus && <Badge text={locked ? template.approvalStatus : template.approvalStatus} variant={locked ? "red" : template.approvalStatus === "승인 완료" ? "green" : "default"} />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{template.content.replace(/\n/g, " ")}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {getTemplateTags(template).slice(0, 4).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}
              </div>
            </button>
          )})}
        </div>
        <div className="px-4 py-3 border-t border-border bg-muted text-xs text-muted-foreground">
          {filteredTemplates.length.toLocaleString()}건 검색됨 · 상위 10건 표시
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold">스마트폰 미리보기</h3>
              <p className="text-xs text-muted-foreground mt-1">{selectedTemplate ? selectedTemplate.name : "직접 작성"}</p>
            </div>
            <Badge text={`${messageMode} · ${unitCost}원/건`} variant={messageMode === "LMS" ? "amber" : "blue"} />
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selectedTemplate && <Badge text={selectedTemplate.channel} variant="blue" />}
            {selectedTemplate && getTemplateTags(selectedTemplate).map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
          </div>
          <div className="mx-auto max-w-[300px] rounded-[2rem] border-8 border-slate-900 bg-slate-900 p-2 shadow-xl">
            <div className="rounded-[1.35rem] bg-white overflow-hidden">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[11px] font-bold">
                <span>9:41</span><span>{selectedChannelMeta?.label ?? "채널 선택"}</span>
              </div>
              <div className="bg-[#f2f4f7] p-4 min-h-[280px]">
                <div className="mb-2 text-[11px] text-muted-foreground">현대퓨처넷</div>
                <div className="max-w-[220px] rounded-2xl rounded-tl-sm bg-white p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
                  {messageDraft.replaceAll("#{이름}", fallbacks.name).replaceAll("#{포인트}", fallbacks.point).replaceAll("#{주문번호}", fallbacks.order)}
                </div>
                {(selectedChannel === "kakao-friend" || selectedChannel === "rcs") && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 max-w-[220px]">
                    <button className="rounded-lg bg-primary px-2 py-2 text-[11px] font-bold text-white">쿠폰 확인</button>
                    <button className="rounded-lg bg-white px-2 py-2 text-[11px] font-bold text-primary border border-border">상세 보기</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {messageDraft.length > 45 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> SMS 길이를 초과해 LMS 기준 비용으로 계산될 수 있습니다.
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold mb-3">메시지 작성</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {[["이름", "#{이름}"], ["포인트", "#{포인트}"], ["주문번호", "#{주문번호}"]].map(([label, value]) => (
              <button key={value} onClick={() => insertVariable(value)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground">{label} 삽입</button>
            ))}
          </div>
          <textarea value={messageDraft} onChange={event => { setMessageDraft(event.target.value); setSelectedTemplateId(0); }} rows={9} className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["이름 기본값", "name"],
              ["포인트 기본값", "point"],
              ["주문번호 기본값", "order"],
            ].map(([label, key]) => (
              <label key={key} className="text-xs font-semibold text-muted-foreground">
                {label}
                <input value={fallbacks[key as keyof typeof fallbacks]} onChange={event => setFallbacks(prev => ({ ...prev, [key]: event.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-input-background px-2 py-1.5 text-xs text-foreground" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChannel = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold mb-4">채널 선택</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHANNELS.map(channel => (
            <button key={channel.id} onClick={() => { setSelectedChannel(channel.id); if (channel.id === "smart-routing") setSmartRouting(true); }} className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedChannel === channel.id ? "border-primary bg-accent" : "border-border hover:bg-blue-50/60"}`}>
              <channel.icon className="w-4 h-4 text-primary" />
              <div className="text-left flex-1">
                <div className="text-sm font-bold">{channel.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{channel.sub}</div>
              </div>
              {selectedChannel === channel.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3 text-xs font-bold">
            <input type="checkbox" checked={smartRouting} onChange={event => setSmartRouting(event.target.checked)} />
            스마트 라우팅 최저가 조합 사용
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3 text-xs font-bold">
            <input type="checkbox" checked={failoverEnabled} onChange={event => setFailoverEnabled(event.target.checked)} />
            대체 발송 활성화
          </label>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold mb-3">선택 요약</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between rounded-lg bg-muted p-3"><span className="text-muted-foreground">대상</span><b>{estimatedTarget.toLocaleString()}명</b></div>
          <div className="flex justify-between rounded-lg bg-muted p-3"><span className="text-muted-foreground">부분 선택</span><b>포함 {includedMembers.length} · 제외 {excludedMembers.length}</b></div>
          <div className="flex justify-between rounded-lg bg-muted p-3"><span className="text-muted-foreground">메시지</span><b>{messageDraft.length}자</b></div>
          <div className="flex justify-between rounded-lg bg-muted p-3"><span className="text-muted-foreground">채널</span><b>{selectedChannelMeta?.label}</b></div>
          <div className="flex justify-between rounded-lg bg-muted p-3"><span className="text-muted-foreground">예상 비용</span><b>{formatWon(estimatedCost)}</b></div>
          <div className="flex justify-between rounded-lg bg-emerald-50 p-3 text-emerald-700"><span>예상 절감액</span><b>{formatWon(estimatedSaving)}</b></div>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold">AI 메시지 검사</h3>
            <p className="text-xs text-muted-foreground mt-1">소형 LLM 검사 작업을 비동기로 실행합니다.</p>
          </div>
          <Btn onClick={runAiCheck} disabled={!messageDraft || aiJobs.some(job => job.status === "실행중")}>
            <Sparkles className="w-3.5 h-3.5" /> AI 검사 실행
          </Btn>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aiJobs.map(job => (
            <div key={job.name} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{job.name}</span>
                <Badge text={job.status} variant={job.status === "완료" ? "green" : job.status === "실행중" ? "amber" : "default"} />
              </div>
              <div className="text-xs text-muted-foreground">{job.model} · {job.result}</div>
            </div>
          ))}
        </div>
        {aiComplete && <div className="mt-4"><AiReportDetail compact /></div>}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold">발송 요청</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">대상</span><b>{estimatedTarget.toLocaleString()}명</b></div>
          <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">채널</span><b>{selectedChannelMeta?.label}</b></div>
          <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">포함/제외</span><b>{includedMembers.length}/{excludedMembers.length}</b></div>
          <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">AI 검사</span><b>{aiComplete ? "완료" : "필요"}</b></div>
          <div className="p-3 bg-muted rounded-lg"><span className="block text-muted-foreground mb-1">예상 비용</span><b>{formatWon(estimatedCost)}</b></div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700"><span className="block mb-1">예상 절감액</span><b>{formatWon(estimatedSaving)}</b></div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">문자 판별</span><b>{messageMode}</b></div>
          <div className="flex justify-between mt-1"><span className="text-muted-foreground">대체 발송</span><b>{failoverEnabled ? "활성" : "비활성"}</b></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSendType("now")} className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${sendType === "now" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>즉시 발송</button>
          <button onClick={() => setSendType("later")} className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${sendType === "later" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>예약 발송</button>
        </div>
        {sendType === "later" && <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm" />}
        <Btn variant="success" disabled={!canSend} onClick={() => alert("발송 요청이 생성되었습니다.")} className="w-full justify-center">
          <Send className="w-3.5 h-3.5" /> 발송 요청
        </Btn>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {stepMeta.map((label, index) => {
              const value = index + 1;
              const active = step === value;
              const done = step > value;
              return (
                <button key={label} onClick={() => setStep(value)} className="flex items-center gap-2 text-left cursor-pointer">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${active ? "bg-primary border-primary text-white" : done ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : value}
                  </span>
                  <span className={`whitespace-nowrap text-xs font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  {value < stepMeta.length && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
                </button>
              );
            })}
          </div>
          <div className="inline-flex w-fit rounded-xl border border-border bg-muted p-1">
            {[
              ["manual", "수동 설정"],
              ["ai", "AI 자동 추천"],
            ].map(([value, label]) => (
              <button key={value} onClick={() => setMode(value as "manual" | "ai")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === value ? "bg-primary text-white" : "text-muted-foreground hover:bg-card"}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {mode === "ai" && renderAiRecommendation()}

      {step === 1 && renderRecipients()}
      {step === 2 && renderMessage()}
      {step === 3 && renderChannel()}
      {step === 4 && renderReview()}

      <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-background/95 px-6 py-4">
        <div className="flex items-center justify-between">
          <Btn variant="outline" disabled={step === 1} onClick={() => setStep(prev => Math.max(1, prev - 1))}>이전</Btn>
          <div className="text-xs text-muted-foreground">
            {stepMeta[step - 1]} · {step < 4 ? (stepReady[step - 1] ? "다음 단계 가능" : "필수값 필요") : (canSend ? "발송 가능" : "AI 검사 필요")}
          </div>
          {step < 4 ? (
            <Btn disabled={!stepReady[step - 1]} onClick={() => setStep(prev => Math.min(4, prev + 1))}>다음 <ChevronRight className="w-3.5 h-3.5" /></Btn>
          ) : (
            <Btn variant="success" disabled={!canSend} onClick={() => alert("발송 요청이 생성되었습니다.")}><Send className="w-3.5 h-3.5" /> 발송 요청</Btn>
          )}
        </div>
      </div>
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
  const [tagFilter, setTagFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const [editModal, setEditModal] = useState<Template | null>(null);
  const [detailModal, setDetailModal] = useState<Template | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [aiModal, setAiModal] = useState(false);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiResult, setAiResult] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", channel: "SMS", content: "", category: "이벤트", scope: "전사 공통", approvalStatus: "불필요" });

  const filtered = useMemo(() => templates.filter(t => {
    const tags = getTemplateTags(t);
    const keyword = !search || t.name.includes(search) || t.content.includes(search) || t.channel.includes(search) || t.category.includes(search) || tags.some(tag => tag.includes(search));
    const tagMatch = tagFilter === "전체" || tags.includes(tagFilter) || t.channel === tagFilter || t.category === tagFilter;
    return keyword && tagMatch;
  }), [templates, search, tagFilter]);
  const pageSize = 10;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pagedTemplates = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const tagOptions = ["전체", ...Array.from(new Set(templates.flatMap(getTemplateTags))).slice(0, 18)];

  const saveTemplate = () => {
    if (editModal) {
      setTemplates(prev => prev.map(t => t.id === editModal.id ? { ...t, ...form } : t));
    } else {
      setTemplates(prev => [...prev, { id: Date.now(), ...form, usageCount: 0, updatedAt: new Date().toISOString().slice(0, 10) }]);
    }
    setEditModal(null); setAddModal(false); setForm({ name: "", channel: "SMS", content: "", category: "이벤트", scope: "전사 공통", approvalStatus: "불필요" });
  };

  const openEdit = (t: Template) => { setEditModal(t); setForm({ name: t.name, channel: t.channel, content: t.content, category: t.category, scope: t.scope ?? "전사 공통", approvalStatus: t.approvalStatus ?? "불필요" }); };

  const runAiCheck = () => {
    setAiChecking(true);
    setTimeout(() => {
      setAiChecking(false);
      setAiResult(["맞춤법 검사 완료 — 이상 없음", "광고성 표현 감지 없음", "'무료', '보장' 등 주의 표현 없음", "가독성 점수: 88/100"]);
    }, 1600);
  };

  const FormFields = () => (
    <div className="space-y-3">
      <div><label className="text-xs font-semibold text-muted-foreground block mb-1">템플릿명</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-muted-foreground block mb-1">채널</label>
          <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none">
            {["SMS", "LMS", "카카오 알림톡", "카카오 친구톡", "RCS"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="text-xs font-semibold text-muted-foreground block mb-1">카테고리</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none">
            {["이벤트", "혜택", "안내", "VIP"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-muted-foreground block mb-1">공개 범위</label>
          <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none">
            {["전사 공통", "현대백화점 전용", "현대홈쇼핑 전용", "한섬 전용"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="text-xs font-semibold text-muted-foreground block mb-1">승인 상태</label>
          <select value={form.approvalStatus} onChange={e => setForm(f => ({ ...f, approvalStatus: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none">
            {["불필요", "미등록", "심사 대기", "승인 완료", "반려"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div><label className="text-xs font-semibold text-muted-foreground block mb-1">메시지 내용</label>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">{form.content.length}자</span>
          <Btn size="sm" variant="outline" onClick={() => { setAiModal(true); runAiCheck(); }}><Sparkles className="w-3 h-3 text-primary" /> AI 검사</Btn>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Btn variant="outline" onClick={() => { setEditModal(null); setAddModal(false); }}>취소</Btn>
        <Btn onClick={saveTemplate}>저장</Btn>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="템플릿명, 내용, 태그 검색..." className="pl-8 pr-4 py-2 rounded-lg border border-border bg-card text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <Btn onClick={() => { setAddModal(true); setForm({ name: "", channel: "SMS", content: "", category: "이벤트", scope: "전사 공통", approvalStatus: "불필요" }); }}><Plus className="w-3.5 h-3.5" /> 템플릿 추가</Btn>
      </div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {tagOptions.map(tag => (
          <button key={tag} onClick={() => { setTagFilter(tag); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${tagFilter === tag ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>{tag}</button>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">템플릿명</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">채널</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">카테고리</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">공개 범위</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">승인</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">태그</th>
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
              <td className="px-4 py-3.5"><Badge text={t.channel} variant="blue" /></td>
              <td className="px-4 py-3.5 hidden lg:table-cell"><Badge text={t.category} variant="default" /></td>
              <td className="px-4 py-3.5 hidden xl:table-cell"><span className="text-xs font-semibold text-muted-foreground">{t.scope ?? "전사 공통"}</span></td>
              <td className="px-4 py-3.5"><Badge text={t.approvalStatus ?? "불필요"} variant={t.approvalStatus === "승인 완료" ? "green" : t.approvalStatus === "반려" ? "red" : t.approvalStatus === "심사 대기" ? "amber" : "default"} /></td>
              <td className="px-4 py-3.5 hidden xl:table-cell">
                <div className="flex flex-wrap gap-1 max-w-56">
                  {getTemplateTags(t).slice(0, 3).map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
                </div>
              </td>
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
        <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onPage={setPage} />
      </div>

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="템플릿 상세" wide>
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 p-4 bg-muted rounded-xl">
              <div>
                <div className="text-base font-bold text-foreground mb-1">{detailModal.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge text={detailModal.channel} variant="blue" />
                  <Badge text={detailModal.category} variant="default" />
                  {getTemplateTags(detailModal).map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-card text-xs font-semibold text-muted-foreground border border-border">{tag}</span>)}
                </div>
              </div>
              <Btn size="sm" variant="outline" onClick={() => { openEdit(detailModal); setDetailModal(null); }}><Edit2 className="w-3 h-3" /> 수정</Btn>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["사용 횟수", `${detailModal.usageCount.toLocaleString()}회`],
                ["최근 수정", detailModal.updatedAt],
                ["문자 길이", `${detailModal.content.length}자`],
              ].map(([label, value]) => <div key={label} className="p-3 bg-muted rounded-lg"><div className="text-xs text-muted-foreground mb-1">{label}</div><div className="text-sm font-bold">{value}</div></div>)}
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2">메시지 내용</div>
              <pre className="whitespace-pre-wrap rounded-xl border border-border bg-input-background p-4 text-sm leading-relaxed">{detailModal.content}</pre>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["평균 오픈율", `${detailModal.openRate ?? 0}%`],
                ["클릭률", `${detailModal.clickRate ?? 0}%`],
                ["수신거부율", `${detailModal.optOutRate ?? 0}%`],
              ].map(([label, value]) => <div key={label} className="p-3 bg-muted rounded-lg"><div className="text-xs text-muted-foreground mb-1">{label}</div><div className="text-sm font-bold">{value}</div></div>)}
            </div>
            {detailModal.approvalStatus === "반려" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">반려 사유: {detailModal.rejectReason ?? "심사 기준 미충족"}</div>
            )}
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2">AI 검사 요약</div>
              <AiReportDetail />
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="템플릿 수정" wide><FormFields /></Modal>
      <Modal open={addModal} onClose={() => setAddModal(false)} title="새 템플릿 추가" wide><FormFields /></Modal>
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="템플릿 삭제">
        <p className="text-sm text-muted-foreground mb-4">이 템플릿을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</p>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setDeleteId(null)}>취소</Btn>
          <Btn variant="danger" onClick={() => { setTemplates(t => t.filter(x => x.id !== deleteId)); setDeleteId(null); }}>삭제</Btn>
        </div>
      </Modal>
      <Modal open={aiModal} onClose={() => setAiModal(false)} title="AI 메시지 검사 결과">
        {aiChecking ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" /><span className="text-sm">분석 중...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-xs text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              종합 점수 88점 · 발송 가능, 일부 채널 길이 검토 권장
            </div>
            <AiReportDetail />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────────
function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("전체");
  const [periodFilter, setPeriodFilter] = useState("30일");
  const [channelFilter, setChannelFilter] = useState("전체 채널");
  const [affiliateFilter, setAffiliateFilter] = useState("전체 계열사");
  const [selectedRecord, setSelectedRecord] = useState<SendRecord | null>(null);
  const filtered = HISTORY.filter(r =>
    (filter === "전체" || r.status === filter) &&
    (channelFilter === "전체 채널" || r.channel === channelFilter) &&
    (affiliateFilter === "전체 계열사" || r.affiliate === affiliateFilter) &&
    (r.template.includes(search) || r.channel.includes(search) || r.affiliate.includes(search))
  );
  const channelOptions = ["전체 채널", ...Array.from(new Set(HISTORY.map(r => r.channel)))];
  const affiliateOptions = ["전체 계열사", ...Array.from(new Set(HISTORY.map(r => r.affiliate)))];
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="템플릿 또는 채널 검색" className="pl-8 pr-4 py-2 rounded-lg border border-border bg-card text-sm w-52 focus:outline-none" />
          </div>
          {["전체", "완료", "진행중", "실패"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {["오늘", "7일", "30일", "직접 지정"].map(option => <option key={option}>{option}</option>)}
          </select>
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {channelOptions.map(option => <option key={option}>{option}</option>)}
          </select>
          <select value={affiliateFilter} onChange={e => setAffiliateFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {affiliateOptions.map(option => <option key={option}>{option}</option>)}
          </select>
        </div>
        <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" /> 내보내기</Btn>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            {["발송일시", "계열사", "템플릿", "채널", "대상", "발송", "성공", "실패", "비용", "절감", "성공률", "상태"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>{filtered.map(r => {
            const rate = ((r.success / r.count) * 100).toFixed(1);
            return (
              <tr key={r.id} onClick={() => setSelectedRecord(r)} className={`border-b border-border transition-colors cursor-pointer ${selectedRecord?.id === r.id ? "bg-accent" : "hover:bg-blue-50/70"}`}>
                <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{r.sentAt}</td>
                <td className="px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{r.affiliate}</td>
                <td className="px-4 py-3.5 text-xs font-semibold text-foreground">{r.template}</td>
                <td className="px-4 py-3.5"><Badge text={r.channel} variant="blue" /></td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{r.targetType}</td>
                <td className="px-4 py-3.5 text-xs font-bold">{r.count.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-emerald-600">{r.success.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-red-500">{r.fail.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-xs font-bold whitespace-nowrap">{formatWon(r.cost)}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-emerald-600 whitespace-nowrap">{formatWon(r.savedCost)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5 w-16"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} /></div>
                    <span className="text-xs font-semibold">{rate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5"><Badge text={r.status} variant={r.status === "완료" ? "green" : r.status === "진행중" ? "amber" : "red"} /></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <Modal open={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="전송 기록 상세" wide>
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 p-4 bg-muted rounded-xl">
              <div>
                <div className="text-base font-bold text-foreground mb-1">{selectedRecord.template}</div>
                <div className="flex items-center gap-2"><Badge text={selectedRecord.channel} variant="blue" /><Badge text={selectedRecord.status} variant={selectedRecord.status === "완료" ? "green" : selectedRecord.status === "진행중" ? "amber" : "red"} /></div>
              </div>
              <div className="text-xs text-muted-foreground">{selectedRecord.sentAt}</div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                ["대상", selectedRecord.targetType],
                ["총 발송", `${selectedRecord.count.toLocaleString()}건`],
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
                    ["번호 오류", Math.round(selectedRecord.fail * 0.31), "실패 내 31%", "회원 정보 확인"],
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
  const [memberTagSearch, setMemberTagSearch] = useState("");
  const [memberTagGroupFilter, setMemberTagGroupFilter] = useState("전체");
  const [memberTagFilter, setMemberTagFilter] = useState("전체");
  const [newMemberTag, setNewMemberTag] = useState("");
  const [detailTagInput, setDetailTagInput] = useState("");
  const [customMemberTags, setCustomMemberTags] = useState<string[]>([]);
  const [memberTab, setMemberTab] = useState<"members" | "blocked">("members");
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<Member[]>(() => createMemberRows());
  const blockedMembers = members.filter(member => !member.smsConsent || !member.kakaoConsent).slice(0, 18);
  const allMemberTags = useMemo(() => uniqueTags([...MEMBER_TAGS, ...members.flatMap(member => member.tags ?? []), ...customMemberTags]), [members, customMemberTags]);
  const visibleMemberTags = allMemberTags.filter(tag =>
    (memberTagGroupFilter === "전체" || tagGroupOf(tag) === memberTagGroupFilter) &&
    (!memberTagSearch || tag.includes(memberTagSearch))
  );

  const filtered = members.filter(m =>
    memberTab === "members" &&
    (typeFilter === "전체" || m.type === typeFilter) &&
    (memberTagFilter === "전체" || (m.tags ?? []).includes(memberTagFilter) || m.type === memberTagFilter) &&
    (m.name.includes(search) || m.phone.includes(search) || (m.tags ?? []).some(tag => tag.includes(search)))
  );
  const memberPageSize = 8;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / memberPageSize)));
  const pagedMembers = filtered.slice((currentPage - 1) * memberPageSize, currentPage * memberPageSize);

  const typeMap: Record<string, string> = { VIP: "vip", 일반: "blue", 신규: "green", 휴면: "default" };
  const addTagToPool = () => {
    const tag = newMemberTag.trim();
    if (!tag) return;
    setCustomMemberTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
    setNewMemberTag("");
  };
  const updateMemberTags = (memberId: number, tags: string[]) => {
    const nextTags = uniqueTags(tags);
    setMembers(prev => prev.map(member => member.id === memberId ? { ...member, tags: nextTags } : member));
    setDetailMember(prev => prev && prev.id === memberId ? { ...prev, tags: nextTags } : prev);
  };
  const addTagToDetailMember = (tagValue = detailTagInput) => {
    if (!detailMember) return;
    const tag = tagValue.trim();
    if (!tag) return;
    updateMemberTags(detailMember.id, [...(detailMember.tags ?? []), tag]);
    setCustomMemberTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
    setDetailTagInput("");
  };
  const removeTagFromDetailMember = (tag: string) => {
    if (!detailMember) return;
    updateMemberTags(detailMember.id, (detailMember.tags ?? []).filter(item => item !== tag));
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "전체 회원", value: "307,811", color: "text-foreground" },
          { label: "VIP", value: "28,420", color: "text-amber-600" },
          { label: "카카오 동의", value: "241,320", color: "text-yellow-600" },
          { label: "SMS 동의", value: "198,441", color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button onClick={() => setMemberTab("members")} className={`px-3 py-1.5 rounded-md text-xs font-bold ${memberTab === "members" ? "bg-primary text-white" : "text-muted-foreground"}`}>회원 목록</button>
            <button onClick={() => setMemberTab("blocked")} className={`px-3 py-1.5 rounded-md text-xs font-bold ${memberTab === "blocked" ? "bg-primary text-white" : "text-muted-foreground"}`}>수신거부자 목록</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="이름 또는 전화번호 검색" className="pl-8 pr-4 py-2 rounded-lg border border-border bg-card text-sm w-56 focus:outline-none" />
          </div>
          {memberTab === "members" && ["전체", "VIP", "일반", "신규", "휴면"].map(f => (
            <button key={f} onClick={() => { setTypeFilter(f); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === f ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" size="sm" onClick={() => setUploadModal(true)}><Upload className="w-3.5 h-3.5" /> 파일 업로드</Btn>
          <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" /> 내보내기</Btn>
        </div>
      </div>
      {memberTab === "members" ? (
      <>
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-sm font-bold">회원 태그 관리</h3>
            <p className="mt-1 text-xs text-muted-foreground">회원이 보유한 모든 태그를 검색, 그룹 필터, 회원 목록 필터, 신규 추가에 사용할 수 있습니다.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={memberTagSearch} onChange={e => setMemberTagSearch(e.target.value)} placeholder="회원 태그 검색" className="w-full sm:w-56 pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none" />
            </div>
            <select value={memberTagGroupFilter} onChange={e => setMemberTagGroupFilter(e.target.value)} className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-muted-foreground">
              {[...TAG_GROUPS, { id: "사용자", label: "사용자 태그", tags: [] }].map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={newMemberTag} onChange={e => setNewMemberTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addTagToPool(); }} placeholder="새 태그 추가" className="min-w-0 flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-sm" />
              <button onClick={addTagToPool} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">추가</button>
            </div>
          </div>
        </div>
        <div className="max-h-32 overflow-y-auto rounded-lg bg-muted p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>태그 {visibleMemberTags.length.toLocaleString()}개</span>
            <button onClick={() => { setMemberTagFilter("전체"); setPage(1); }} className="font-bold text-primary">필터 초기화</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setMemberTagFilter("전체"); setPage(1); }} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${memberTagFilter === "전체" ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"}`}>전체</button>
            {visibleMemberTags.map(tag => (
              <button key={tag} onClick={() => { setMemberTagFilter(tag); setPage(1); }} className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${memberTagFilter === tag ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                <span className="mr-1 text-[10px] opacity-70">{tagGroupLabel(tag)}</span>{tag}
              </button>
            ))}
            {visibleMemberTags.length === 0 && <div className="py-3 text-xs text-muted-foreground">검색 조건에 맞는 회원 태그가 없습니다.</div>}
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            {["이름", "전화번호", "유형", "태그", "SMS 동의", "카카오 동의", "RCS 동의", "가입일"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>{pagedMembers.map(m => (
            <tr key={m.id} className="border-b border-border hover:bg-blue-50/70 transition-colors cursor-pointer" onClick={() => setDetailMember(m)}>
              <td className="px-4 py-3.5 text-xs font-bold text-foreground">{m.name}</td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{m.phone}</td>
              <td className="px-4 py-3.5"><Badge text={m.type} variant={typeMap[m.type] || "default"} /></td>
              <td className="px-4 py-3.5">
                <div className="flex flex-wrap gap-1 max-w-48">
                  {(m.tags ?? []).slice(0, 3).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}
                </div>
              </td>
              <td className="px-4 py-3.5">{m.smsConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</td>
              <td className="px-4 py-3.5">{m.kakaoConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</td>
              <td className="px-4 py-3.5">{m.rcsConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground">{m.joinedAt}</td>
            </tr>
          ))}</tbody>
        </table>
        <Pagination page={currentPage} total={filtered.length} pageSize={memberPageSize} onPage={setPage} />
      </div>
      </>
      ) : (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted">
          <h3 className="text-sm font-bold">080 ARS 및 수동 수신거부 동기화 목록</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            {["회원명", "전화번호", "거부 채널", "등록 사유", "동기화 상태"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
          </tr></thead>
          <tbody>{blockedMembers.map(member => (
            <tr key={member.id} className="border-b border-border hover:bg-blue-50/70">
              <td className="px-4 py-3 text-xs font-bold">{member.name}</td>
              <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{member.phone}</td>
              <td className="px-4 py-3"><Badge text={!member.smsConsent ? "SMS" : "카카오"} variant="red" /></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">080 수신거부 접수</td>
              <td className="px-4 py-3"><Badge text="회원 동의 N 반영" variant="green" /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      )}

      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="회원 파일 업로드" wide>
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-border bg-muted p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-3 text-primary" />
            <div className="text-sm font-bold text-foreground mb-1">Excel, CSV, JSON 파일 업로드</div>
            <p className="text-xs text-muted-foreground mb-4">대량 회원 추가/수정 전 미리보기와 변경 검증을 거치는 흐름입니다.</p>
            <div className="flex justify-center gap-2">
              {[".xlsx", ".csv", ".json"].map(type => <span key={type} className="px-2.5 py-1 rounded-full bg-card border border-border text-xs font-semibold text-muted-foreground">{type}</span>)}
            </div>
            <input type="file" accept=".xlsx,.csv,.json" className="mt-4 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["검증 항목", "전화번호, 중복 회원, 동의 값"],
              ["번호 보정", "01012345678 → 010-1234-5678"],
              ["예상 처리", "8,420건 / 오류 12건"],
            ].map(([label, value]) => <div key={label} className="p-3 bg-muted rounded-lg"><div className="text-xs text-muted-foreground mb-1">{label}</div><div className="text-sm font-bold">{value}</div></div>)}
          </div>
          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="text-xs font-bold text-muted-foreground mb-3">데이터 충돌 해결 규칙</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {["기존 회원 덮어쓰기", "신규 회원으로 등록", "오류 행으로 제외"].map((label, index) => (
                <label key={label} className="flex items-center gap-2 rounded-lg bg-card border border-border p-3 text-xs font-semibold">
                  <input type="radio" name="conflict-rule" defaultChecked={index === 0} /> {label}
                </label>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted border-b border-border">
                {["상태", "회원명", "전화번호", "변경 내용"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ["수정", "김민준", "010-****-3841", "LMS 동의 Y → N"],
                  ["추가", "강하윤", "010-****-9021", "신규 회원 등록"],
                  ["오류", "중복 행", "010-****-1183", "동일 회원 2건 발견"],
                ].map(row => <tr key={row.join()} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3"><Badge text={row[0]} variant={row[0] === "오류" ? "red" : row[0] === "추가" ? "green" : "blue"} /></td>
                  <td className="px-4 py-3 text-xs font-semibold">{row[1]}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{row[2]}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row[3]}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setUploadModal(false)}>취소</Btn>
            <Btn onClick={() => setUploadModal(false)}>검증 후 반영</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!detailMember} onClose={() => setDetailMember(null)} title="회원 상세 정보">
        {detailMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold text-primary">{detailMember.name[0]}</div>
              <div><div className="font-bold text-foreground">{detailMember.name}</div><div className="text-xs text-muted-foreground">{detailMember.phone}</div></div>
              <Badge text={detailMember.type} variant={typeMap[detailMember.type] || "default"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "가입일", value: detailMember.joinedAt },
                { label: "마지막 발송", value: detailMember.lastSend },
              ].map(f => <div key={f.label} className="p-3 bg-muted rounded-lg"><div className="text-xs text-muted-foreground mb-1">{f.label}</div><div className="text-sm font-semibold">{f.value}</div></div>)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">보유 태그</h4>
              <div className="flex flex-wrap gap-2">
                {(detailMember.tags ?? []).map(tag => (
                  <button key={tag} onClick={() => removeTagFromDetailMember(tag)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600">
                    {tag}<X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted p-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">태그 추가</h4>
              <div className="flex gap-2 mb-3">
                <input value={detailTagInput} onChange={e => setDetailTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addTagToDetailMember(); }} placeholder="회원에게 추가할 태그" className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                <button onClick={() => addTagToDetailMember()} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">추가</button>
              </div>
              <div className="max-h-24 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {allMemberTags.filter(tag => !(detailMember.tags ?? []).includes(tag)).slice(0, 24).map(tag => (
                    <button key={tag} onClick={() => addTagToDetailMember(tag)} className="rounded-full border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground">
                      <span className="mr-1 opacity-70">{tagGroupLabel(tag)}</span>{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">수신 동의 현황</h4>
              {[
                { label: "SMS 수신 동의", key: "smsConsent" as const },
                { label: "카카오 수신 동의", key: "kakaoConsent" as const },
                { label: "RCS 수신 동의", key: "rcsConsent" as const },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-xs font-semibold">{label}</span>
                  <button
                    onClick={() => {
                      setMembers(prev => prev.map(m => m.id === detailMember.id ? { ...m, [key]: !m[key] } : m));
                      setDetailMember(prev => prev ? { ...prev, [key]: !prev[key] } : null);
                    }}
                    className={`w-10 h-5 rounded-full transition-colors relative ${detailMember[key] ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${detailMember[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Statistics Pages ─────────────────────────────────────────────────────────
function StatsReportActions() {
  return (
    <div className="flex justify-end gap-2">
      <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" /> PDF 다운로드</Btn>
      <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" /> Excel 다운로드</Btn>
    </div>
  );
}

function StatsOverview() {
  return (
    <div className="p-6 space-y-5">
      <StatsReportActions />
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="이번달 총 발송" value="892,451" sub="전월 대비 +12.4%" trend={{ val: "+12.4%", up: true }} icon={<Send className="w-4 h-4" />} color="blue" />
        <StatCard label="평균 성공률" value="98.4%" sub="실패 14,232건" trend={{ val: "+0.2%p", up: true }} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <StatCard label="일평균 발송" value="29,748" sub="최고 284,391건" icon={<Activity className="w-4 h-4" />} color="violet" />
        <StatCard label="발송 비용(추정)" value="₩18.7M" sub="전월 대비 +8.1%" trend={{ val: "+8.1%", up: false }} icon={<Target className="w-4 h-4" />} color="amber" />
        <StatCard label="스마트 라우팅 절감" value="₩5.5M" sub="가상 SMS/LMS 대비" trend={{ val: "+22.1%", up: true }} icon={<Zap className="w-4 h-4" />} color="green" />
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold mb-4">실시간 발송 큐 상태</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {QUEUE_STATUS.map(item => (
            <div key={item.label} className="rounded-lg bg-muted p-3">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className="text-lg font-bold">{item.count.toLocaleString()}건</div>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          {QUEUE_STATUS.map(item => {
            const total = QUEUE_STATUS.reduce((sum, current) => sum + current.count, 0);
            return <div key={item.label} className={`${item.color} h-full`} style={{ width: `${Math.max(2, (item.count / total) * 100)}%` }} />;
          })}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold mb-4">월별 채널별 발송 현황</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">일별 발송 & 성공 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1843FA" stopOpacity={0.15} /><stop offset="95%" stopColor="#1843FA" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: number) => [v.toLocaleString() + "건"]} />
              <Area type="monotone" dataKey="sends" stroke="#1843FA" fill="url(#g1)" strokeWidth={2} name="발송" />
              <Area type="monotone" dataKey="success" stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 3" name="성공" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-3">시간대별 발송 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { time: "06~08", count: 12000 }, { time: "08~10", count: 38000 }, { time: "10~12", count: 95000 },
              { time: "12~14", count: 72000 }, { time: "14~16", count: 84000 }, { time: "16~18", count: 61000 },
              { time: "18~20", count: 48000 }, { time: "20~22", count: 29000 },
            ]} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: number) => [v.toLocaleString() + "건"]} />
              <Bar dataKey="count" name="발송수" fill="#1843FA" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatsChannel() {
  return (
    <div className="p-6 space-y-5">
      <StatsReportActions />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {channelPie.map((c, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: c.color }} />
            <div className="text-xs text-muted-foreground mb-1">{c.name}</div>
            <div className="text-lg font-bold">{c.value}%</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">채널별 성공률/실패율 비교</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelCostData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" horizontal={false} />
              <XAxis type="number" domain={[96, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="channel" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v: number) => [`${v}%`]} />
              <Bar dataKey="successRate" name="성공률" fill="#1843FA" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">채널별 발송 비중 (도넛)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie data={channelPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3} label={({ name, value }) => `${value}%`} labelLine={false}>
                {channelPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`]} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {channelPie.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold mb-4">채널별 월별 추이</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
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
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <div className="px-5 py-3 border-b border-border"><h3 className="text-sm font-bold">채널별 비용 및 평균 단가</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            {["채널", "발송량", "성공률", "실패율", "총 비용", "평균 단가"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>{channelCostData.map(row => (
            <tr key={row.channel} className="border-b border-border hover:bg-muted/30">
              <td className="px-4 py-3 text-xs font-bold">{row.channel}</td>
              <td className="px-4 py-3 text-xs">{row.sends.toLocaleString()}건</td>
              <td className="px-4 py-3 text-xs text-emerald-600 font-bold">{row.successRate}%</td>
              <td className="px-4 py-3 text-xs text-red-500 font-bold">{row.failRate}%</td>
              <td className="px-4 py-3 text-xs font-bold">{formatWon(row.cost)}</td>
              <td className="px-4 py-3 text-xs">{row.unit}원</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function StatsRouting() {
  return (
    <div className="p-6 space-y-5">
      <StatsReportActions />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="실제 청구 비용" value="₩18.7M" sub="6월 누적" icon={<Target className="w-4 h-4" />} color="amber" />
        <StatCard label="SMS/LMS 가상 비용" value="₩24.2M" sub="동일 물량 기준" icon={<TrendingUp className="w-4 h-4" />} color="violet" />
        <StatCard label="누적 절감액" value="₩5.5M" sub="절감률 22.7%" trend={{ val: "+22.1%", up: true }} icon={<Zap className="w-4 h-4" />} color="green" />
        <StatCard label="대체 발송 전환" value="5,549" sub="최종 실패 24건" icon={<RefreshCw className="w-4 h-4" />} color="blue" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">실제 비용 vs SMS/LMS 가상 비용</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={routingSavingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₩${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => [formatWon(v)]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="actual" name="실제 청구 비용" stroke="#1843FA" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="baseline" name="SMS/LMS 가상 비용" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">누적 절감액 추이</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={routingSavingsData}>
              <defs>
                <linearGradient id="savingGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₩${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => [formatWon(v)]} />
              <Area type="monotone" dataKey="saved" name="절감액" stroke="#10B981" fill="url(#savingGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">Failover 전환 건수</h3>
          <div className="space-y-3">
            {fallbackStats.map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-xs font-bold">{item.count.toLocaleString()}건</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.count / 55)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">계열사별 비용 점유</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={affiliateStats} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₩${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => [typeof v === "number" ? formatWon(v) : v]} />
              <Bar dataKey="cost" name="비용" fill="#1843FA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatsMember() {
  return (
    <div className="p-6 space-y-5">
      <StatsReportActions />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="VIP 회원" value="28,420" sub="오픈율 68.4%" icon={<Tag className="w-4 h-4" />} color="amber" />
        <StatCard label="일반 회원" value="198,341" sub="오픈율 41.2%" icon={<Users className="w-4 h-4" />} color="blue" />
        <StatCard label="신규 회원" value="34,210" sub="이번달 +1,284명" trend={{ val: "+3.9%", up: true }} icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <StatCard label="휴면 회원" value="23,420" sub="6개월 이상 미활동" trend={{ val: "-284명", up: true }} icon={<Clock className="w-4 h-4" />} color="violet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">회원 유형별 오픈율 & 성공률</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={memberTypeData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="rate" name="발송 성공률" fill="#1843FA" radius={[3, 3, 0, 0]} />
              <Bar dataKey="open" name="메시지 오픈율" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">채널 동의 현황</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { label: "SMS", 동의: 198441, 미동의: 109370 },
              { label: "카카오", 동의: 241320, 미동의: 66491 },
              { label: "RCS", 동의: 48210, 미동의: 259601 },
            ]} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: number) => [v.toLocaleString() + "명"]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="동의" fill="#1843FA" radius={[3, 3, 0, 0]} />
              <Bar dataKey="미동의" fill="#E4E4E7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border"><h3 className="text-sm font-bold">회원 유형별 상세 지표</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            {["유형", "회원 수", "발송 성공률", "오픈율", "발송 건수/인"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
          </tr></thead>
          <tbody>{memberTypeData.map(m => (
            <tr key={m.type} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3.5"><Badge text={m.type} variant={m.type === "VIP" ? "vip" : "blue"} /></td>
              <td className="px-4 py-3.5 text-xs font-bold">{m.count.toLocaleString()}명</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2"><div className="w-20 bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${m.rate}%` }} /></div><span className="text-xs font-semibold">{m.rate}%</span></div>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2"><div className="w-20 bg-muted rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${m.open}%` }} /></div><span className="text-xs font-semibold">{m.open}%</span></div>
              </td>
              <td className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">{(Math.floor(Math.random() * 8) + 3).toFixed(1)}건</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function StatsPerformance() {
  return (
    <div className="p-6 space-y-5">
      <StatsReportActions />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="평균 오픈율" value="49.4%" sub="전월 대비 +1.5%p" trend={{ val: "+1.5%p", up: true }} icon={<Eye className="w-4 h-4" />} color="blue" />
        <StatCard label="평균 클릭률" value="19.1%" sub="업계 평균 8.2%" trend={{ val: "+0.8%p", up: true }} icon={<Target className="w-4 h-4" />} color="green" />
        <StatCard label="전환율" value="5.8%" sub="전월 대비 +0.6%p" trend={{ val: "+0.6%p", up: true }} icon={<TrendingUp className="w-4 h-4" />} color="violet" />
        <StatCard label="수신 거부율" value="0.12%" sub="업계 평균 0.41%" trend={{ val: "-0.02%p", up: true }} icon={<CheckCircle2 className="w-4 h-4" />} color="amber" />
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold mb-4">월별 성과 지표 추이</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v: number) => [`${v}%`]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="openRate" stroke="#1843FA" strokeWidth={2.5} dot={{ r: 4 }} name="오픈율" />
            <Line type="monotone" dataKey="clickRate" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} name="클릭률" />
            <Line type="monotone" dataKey="conversionRate" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} name="전환율" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">템플릿별 성과 Top 5</h3>
          <div className="space-y-3">
            {[
              { name: "생일 축하 메시지", open: 78.4, click: 34.2 },
              { name: "VIP 멤버십 전용 혜택", open: 71.2, click: 28.9 },
              { name: "신규 가입 환영", open: 68.1, click: 25.4 },
              { name: "6월 여름 할인 이벤트", open: 54.3, click: 21.8 },
              { name: "포인트 소멸 안내", open: 62.8, click: 18.1 },
            ].map((t, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">오픈 {t.open}% · 클릭 {t.click}%</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${t.open}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold mb-4">요일별 오픈율</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { day: "월", rate: 42.1 }, { day: "화", rate: 49.8 }, { day: "수", rate: 51.2 },
              { day: "목", rate: 48.3 }, { day: "금", rate: 45.9 }, { day: "토", rate: 38.4 }, { day: "일", rate: 35.1 },
            ]} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[30, 55]} />
              <Tooltip formatter={(v: number) => [`${v}%`]} />
              <Bar dataKey="rate" name="오픈율" fill="#1843FA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
function MainLayout({ currentPage, setCurrentPage, onLogout }: {
  currentPage: Page; setCurrentPage: (p: Page) => void; onLogout: () => void;
}) {
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage setPage={setCurrentPage} />;
      case "send": return <SendMessagePageWizard />;
      case "templates": return <TemplatesPage />;
      case "history": return <HistoryPage />;
      case "members": return <MembersPage />;
      case "stats-overview": return <StatsOverview />;
      case "stats-channel": return <StatsChannel />;
      case "stats-routing": return <StatsRouting />;
      case "stats-member": return <StatsMember />;
      case "stats-performance": return <StatsPerformance />;
    }
  };
  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Pretendard Variable', 'Pretendard', 'Inter', sans-serif" }}>
      <Sidebar current={currentPage} setCurrent={setCurrentPage} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header page={currentPage} />
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
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
