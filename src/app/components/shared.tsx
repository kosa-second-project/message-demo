import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronRight, Info, X } from 'lucide-react';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StatsPeriod, Template } from '../types';
import { AI_REPORT_SECTIONS, MEMBER_TAGS, QUEUE_STATUS, buildChannelShareData, channelPie, dailyTrend, formatWon, getOrderedStatsPeriod, getStatsPeriodLabel, isValidStatDate, routingSavingsData } from '../domain';
import { CHANNEL_LABELS, MESSAGE_PURPOSES } from '../constants/messaging';

export function StatCard({ label, value, sub, trend, icon, color = "blue" }: {
  label: string; value: string; sub?: string; trend?: { val: string; up: boolean; label?: string }; icon: ReactNode; color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <div className="mb-1 break-words text-xl font-bold tracking-tight text-foreground sm:text-2xl">{value}</div>
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

export function Badge({ text, variant = "default" }: { text: string; variant?: string }) {
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

export function SpecPin({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
      <Info className="h-3 w-3 text-primary" />
      {children}
    </span>
  );
}

export function Btn({ children, variant = "primary", size = "md", onClick, disabled = false, className = "", title }: {
  children: ReactNode; variant?: string; size?: string; onClick?: () => void; disabled?: boolean; className?: string; title?: string;
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
  return <button className={`${base} ${sz} ${vars[variant] || vars.primary} ${className}`} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

export function StatsPeriodControl({ period, onChange, compact = false }: {
  period: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
  compact?: boolean;
}) {
  const ordered = getOrderedStatsPeriod(period);
  const maxRangeDays = 365;
  const parseDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const handleDateChange = (key: "start" | "end", value: string) => {
    if (!isValidStatDate(value)) return;
    const next = { ...period, preset: "custom" as const, [key]: value };
    const normalized = getOrderedStatsPeriod(next);
    const rangeMs = parseDate(normalized.end).getTime() - parseDate(normalized.start).getTime();
    const rangeDays = Math.floor(rangeMs / 86400000) + 1;
    if (rangeDays > maxRangeDays) {
      alert("기간은 최대 1년까지만 조회 가능합니다.");
      return;
    }
    onChange(next);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "rounded-xl border border-border bg-card p-2"}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        기간
      </div>
      <input type="date" value={period.start} max={period.end} onChange={event => handleDateChange("start", event.target.value)} className="h-9 rounded-lg border border-border bg-input-background px-3 text-xs font-semibold text-foreground" />
      <span className="text-xs font-semibold text-muted-foreground">~</span>
      <input type="date" value={period.end} min={period.start} onChange={event => handleDateChange("end", event.target.value)} className="h-9 rounded-lg border border-border bg-input-background px-3 text-xs font-semibold text-foreground" />
      <span className="rounded-lg bg-muted px-2.5 py-2 text-[11px] font-bold text-muted-foreground">집계 기준</span>
      <span className="text-[11px] font-semibold text-muted-foreground">{getStatsPeriodLabel(ordered)}</span>
    </div>
  );
}

export type TemplateFormState = Pick<Template, "name" | "channel" | "content" | "category" | "messagePurpose"> & { scope: string; tags: string[] };

export function TemplatePreview({ title, content, mode = "message", onModeChange, compact = false }: {
  title: string;
  content: string;
  mode?: "message" | "kakao" | "email";
  onModeChange?: (mode: "message" | "kakao" | "email") => void;
  compact?: boolean;
}) {
  return (
    <div>
      {onModeChange && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-muted-foreground">미리보기</div>
          <div className="inline-flex rounded-lg border border-border bg-muted p-1">
            {[
              ["message", "메시지"],
              ["kakao", "카카오톡"],
              ["email", "이메일"],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => onModeChange(value as "message" | "kakao" | "email")} className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${mode === value ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
            ))}
          </div>
        </div>
      )}
      <div className={`relative mx-auto aspect-[1179/2556] shrink-0 overflow-hidden bg-gradient-to-b from-slate-700 via-slate-950 to-black shadow-2xl ring-1 ring-slate-500/40 ${compact ? "w-[210px] rounded-[2.2rem] p-[5px]" : "w-[260px] rounded-[2.8rem] p-[6px]"}`}>
        <div className="absolute -left-1 top-24 h-14 w-1 rounded-l bg-slate-800" />
        <div className="absolute -right-1 top-32 h-20 w-1 rounded-r bg-slate-800" />
        <div className={`relative flex h-full flex-col overflow-hidden bg-white ${compact ? "rounded-[1.9rem]" : "rounded-[2.35rem]"}`}>
          <div className="absolute left-1/2 top-3 z-30 flex h-6 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black shadow-lg">
            <span className="mr-2 h-1.5 w-7 rounded-full bg-slate-700" />
            <span className="h-2 w-2 rounded-full bg-slate-800 ring-1 ring-slate-600" />
          </div>
          <div className={`flex items-center justify-between px-6 pb-2 pt-4 text-[11px] font-bold ${mode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-slate-50 text-slate-700"}`}>
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-3.5 rounded-sm border border-current" />
              <span className="h-2 w-3 rounded-sm bg-current" />
            </span>
          </div>
          <div className={`border-b border-black/5 px-5 py-3 text-center text-xs font-bold ${mode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-white text-slate-800"}`}>
            {mode === "message" ? "메시지" : mode === "kakao" ? "카카오톡" : "Mail"}
          </div>
          <div className={`h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 pb-10 ${mode === "message" ? "bg-white" : mode === "kakao" ? "bg-[#BACEDE]" : "bg-slate-50"}`}>
            {mode === "email" ? (
              <div className="min-h-full bg-white text-slate-900">
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">M</div>
                  <div className="text-sm font-bold">Gmail</div>
                </div>
                <div className="mb-3 text-base font-bold leading-snug">{title || "메시지 제목"}</div>
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
                <div className="whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-xs leading-relaxed text-foreground shadow-sm">{content || "메시지 내용을 입력하세요."}</div>
              </div>
            ) : (
              <>
                <div className="mb-2 text-[11px] text-muted-foreground">{mode === "message" ? "010-0000-0000" : "현대퓨처넷"}</div>
                <div className={`max-w-[185px] whitespace-pre-wrap p-3 text-sm leading-relaxed shadow-sm ${mode === "message" ? "ml-auto rounded-2xl bg-primary text-white" : "rounded-2xl rounded-tl-sm bg-[#FFF8C5]"}`}>
                  <div className={`mb-2 text-xs font-bold leading-snug ${mode === "message" ? "text-white" : "text-[#3A1D1D]"}`}>{title || "메시지 제목"}</div>
                  {content || "메시지 내용을 입력하세요."}
                </div>
                {mode === "kakao" && <div className="mt-2 max-w-[185px] rounded-xl bg-white p-2 text-center text-[11px] font-bold text-[#3A1D1D] shadow-sm">자세히 보기</div>}
              </>
            )}
          </div>
          <div className="absolute bottom-2.5 left-1/2 h-1.5 w-28 -translate-x-1/2 rounded-full bg-slate-900/85" />
        </div>
      </div>
    </div>
  );
}

export function TemplateFormFields({ form, setForm, onCancel, onSave, saveDisabled = false }: {
  form: TemplateFormState;
  setForm: React.Dispatch<React.SetStateAction<TemplateFormState>>;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  const [previewMode, setPreviewMode] = useState<"message" | "kakao" | "email">("message");
  const selectedChannels = form.channel.split(",").map(channel => channel.trim()).filter(Boolean);
  const toggleChannel = (channel: string) => {
    setForm(current => {
      const channels = current.channel.split(",").map(item => item.trim()).filter(Boolean);
      const next = channels.includes(channel) ? channels.filter(item => item !== channel) : [...channels, channel];
      return { ...current, channel: next.join(", ") };
    });
  };
  const toggleTag = (tag: string) => {
    setForm(current => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter(item => item !== tag) : [...current.tags, tag],
    }));
  };
  const tagOptions = MEMBER_TAGS.filter(tag => tag !== "전체 고객").slice(0, 24);

  return (
    <div className="space-y-4">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">템플릿명</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">채널</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CHANNEL_LABELS.map(channel => (
                <button key={channel} type="button" onClick={() => toggleChannel(channel)} className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors ${selectedChannels.includes(channel) ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                  {channel}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">카테고리</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none">
              {["이벤트", "혜택", "안내"].map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">광고여부</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MESSAGE_PURPOSES.map(purpose => {
                const Icon = purpose.icon;
                const selected = form.messagePurpose === purpose.id;
                return (
                  <button key={purpose.id} type="button" onClick={() => setForm(f => ({ ...f, messagePurpose: purpose.id }))} className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-bold transition-colors ${selected ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {purpose.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">태그</label>
            <div className="max-h-24 overflow-y-auto rounded-lg border border-border bg-muted p-2">
              <div className="flex flex-wrap gap-1.5">
                {tagOptions.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full border px-2 py-1 text-[11px] font-bold transition-colors ${form.tags.includes(tag) ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">메시지 내용</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} className="min-h-[220px] w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{form.content.length}자</span>
          </div>
        </div>
      </div>
      <TemplatePreview title={form.name} content={form.content} mode={previewMode} onModeChange={setPreviewMode} compact />
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Btn variant="outline" onClick={onCancel}>취소</Btn>
        <Btn disabled={saveDisabled || !form.name.trim() || !form.content.trim() || selectedChannels.length === 0} onClick={onSave}>저장</Btn>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

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

export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pages = Array.from({ length: Math.min(5, max) }, (_, index) => {
    const base = Math.min(Math.max(page - 2, 1), Math.max(max - 4, 1));
    return base + index;
  }).filter(p => p <= max);
  return (
    <div className="flex flex-col gap-3 px-3 py-3 border-t border-border bg-card sm:flex-row sm:items-center sm:justify-between sm:px-4">
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

export function AiReportDetail({ compact = false }: { compact?: boolean }) {
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

export function QueueStatusCard({ subtitle, onDetailClick }: { subtitle?: string; onDetailClick?: () => void }) {
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
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">실시간 발송 큐 상태</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {onDetailClick && (
          <button onClick={onDetailClick} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">상세 분석 <ChevronRight className="w-3 h-3" /></button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2 lg:grid-cols-4">
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

export function CostComparisonCard({ title = "비용 비교 현황", className = "", chartClassName = "h-[240px] lg:h-[220px] lg:min-h-0", data = routingSavingsData, xKey = "month" }: {
  title?: string;
  className?: string;
  chartClassName?: string;
  data?: { [key: string]: string | number; actual: number; baseline: number; saved?: number }[];
  xKey?: string;
}) {
  return (
    <div className={`bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-0 flex-col ${className}`}>
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

export function ChannelShareCard({ title = "채널별 발송 비중", className = "", data = channelPie }: {
  title?: string;
  className?: string;
  data?: { name: string; value: number; color: string }[];
}) {
  return (
    <div className={`bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-0 flex-col ${className}`}>
      <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      <div className="grid min-h-[205px] grid-cols-1 gap-2 sm:min-h-0 sm:flex-1 sm:grid-cols-[0.8fr_1fr]">
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

export function DailySendTrendCard({ title = "발송 & 성공 추이", gradientId = "dailySendsGrad", className = "", data = dailyTrend, xKey = "date" }: {
  title?: string;
  gradientId?: string;
  className?: string;
  data?: { [key: string]: string | number; sends: number; success: number }[];
  xKey?: string;
}) {
  return (
    <div className={`bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-0 flex-col ${className}`}>
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      <div className="h-[240px] lg:min-h-0 lg:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.map(row => ({ ...row, successRate: row.sends > 0 ? Number(((row.success / row.sends) * 100).toFixed(1)) : 0 }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1843FA" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#1843FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="count" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
            <YAxis yAxisId="rate" orientation="right" domain={[90, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v: number, name: string) => name === "성공률" ? [`${v.toFixed(1)}%`, name] : [v.toLocaleString() + "건", name]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area yAxisId="count" type="monotone" dataKey="sends" stroke="#1843FA" fill={`url(#${gradientId})`} strokeWidth={2} name="발송" />
            <Area yAxisId="count" type="monotone" dataKey="success" stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 3" name="성공" />
            <Line yAxisId="rate" type="monotone" dataKey="successRate" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} name="성공률" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
