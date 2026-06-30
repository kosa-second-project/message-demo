import { useMemo, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import type { MessagePurpose, SendRecord, StatsPeriod } from '../types';
import { HISTORY, TEMPLATES, createStatsPeriod, formatWon, getOrderedStatsPeriod } from '../domain';
import { CHANNEL_LABELS, MESSAGE_PURPOSES, getMessagePurposeMeta } from '../constants/messaging';
import { Badge, Btn, Modal, Pagination, StatsPeriodControl } from '../components/shared';

const buildFailoverFlow = (record: SendRecord) => {
  const labels = [`1차 ${record.channel}`, "2차 SMS 대체", "3차 이메일 대체"];
  const steps = record.failoverSteps.slice(0, 3);

  while (steps.length < 3) {
    const previousFail = steps.length === 0 ? record.count : steps[steps.length - 1].fail;
    const success = previousFail === 0 ? 0 : Math.max(0, previousFail - Math.max(1, Math.round(previousFail * (steps.length === 1 ? 0.08 : 0.03))));
    steps.push({
      label: labels[steps.length],
      requested: previousFail,
      success,
      fail: previousFail - success,
    });
  }

  return steps;
};

const getRecordTags = (record: SendRecord) => record.targetType.split(/[·,/]+/).map(tag => tag.trim()).filter(Boolean);

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("전체");
  const [period, setPeriod] = useState<StatsPeriod>(() => createStatsPeriod("recent30"));
  const [channelFilter, setChannelFilter] = useState("전체 채널");
  const [purposeFilter, setPurposeFilter] = useState<"전체 광고여부" | MessagePurpose>("전체 광고여부");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState("latest");
  const [selectedRecord, setSelectedRecord] = useState<SendRecord | null>(null);
  const [page, setPage] = useState(1);
  const orderedPeriod = getOrderedStatsPeriod(period);
  const updatePeriod = (nextPeriod: StatsPeriod) => {
    setPeriod(nextPeriod);
    setPage(1);
  };
  const tagOptions = useMemo(
    () => Array.from(new Set(HISTORY.flatMap(record => getRecordTags(record)))).sort((a, b) => a.localeCompare(b, "ko")),
    []
  );
  const toggleTagFilter = (tag: string) => {
    setTagFilters(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
    setPage(1);
  };
  const filtered = HISTORY.filter(r =>
    r.sentAt.slice(0, 10) >= orderedPeriod.start &&
    r.sentAt.slice(0, 10) <= orderedPeriod.end &&
    (filter === "전체" || r.status === filter) &&
    (channelFilter === "전체 채널" || r.channel === channelFilter) &&
    (purposeFilter === "전체 광고여부" || r.messagePurpose === purposeFilter) &&
    (tagFilters.length === 0 || getRecordTags(r).some(tag => tagFilters.includes(tag))) &&
    (r.template.includes(search) || r.channel.includes(search) || r.affiliate.includes(search) || getMessagePurposeMeta(r.messagePurpose).label.includes(search))
  );
  const sortedRecords = useMemo(() => {
    const next = [...filtered];
    next.sort((a, b) => {
      if (sortOrder === "oldest") return a.sentAt.localeCompare(b.sentAt) || a.id - b.id;
      if (sortOrder === "count") return b.count - a.count || b.sentAt.localeCompare(a.sentAt);
      if (sortOrder === "successRate") return (b.success / b.count) - (a.success / a.count) || b.sentAt.localeCompare(a.sentAt);
      if (sortOrder === "costSaved") return b.savedCost - a.savedCost || b.sentAt.localeCompare(a.sentAt);
      return b.sentAt.localeCompare(a.sentAt) || b.id - a.id;
    });
    return next;
  }, [filtered, sortOrder]);
  const pageSize = 10;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(sortedRecords.length / pageSize)));
  const pagedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
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
          <div className="flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 sm:max-w-[360px]">
            <span className="px-1 text-xs font-bold text-muted-foreground">태그</span>
            {tagOptions.map(tag => {
              const selected = tagFilters.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className={`rounded-full px-2 py-1 text-[11px] font-bold transition-all ${selected ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1); }} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground">
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="count">발송 많은순</option>
            <option value="successRate">성공률 높은순</option>
            <option value="costSaved">절감액 높은순</option>
          </select>
        </div>
        <Btn variant="outline" size="sm" disabled title="Excel 다운로드" className="shrink-0 whitespace-nowrap"><Download className="w-3.5 h-3.5" /> Excel 다운로드</Btn>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="space-y-2 p-3 md:hidden">
          {pagedRecords.map(r => (
            <button key={r.id} onClick={() => setSelectedRecord(r)} className="w-full rounded-xl border border-border bg-card p-3 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">{r.template}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.sentAt} · {r.affiliate}</div>
                </div>
                <Badge text={r.status} variant={r.status === "완료" ? "green" : r.status === "진행중" ? "amber" : "red"} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge text={r.channel} variant="blue" />
                <Badge text={getMessagePurposeMeta(r.messagePurpose).label} variant={getMessagePurposeMeta(r.messagePurpose).color} />
                {getRecordTags(r).map(tag => <span key={`${r.id}-${tag}`} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><div className="text-muted-foreground">발송</div><div className="font-bold">{r.count.toLocaleString()}</div></div>
                <div><div className="text-muted-foreground">성공/실패</div><div className="font-bold">{r.success.toLocaleString()} / {r.fail}</div></div>
                <div><div className="text-muted-foreground">절감</div><div className="font-bold text-emerald-600">{formatWon(r.savedCost)}</div></div>
              </div>
            </button>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[980px] w-full text-sm">
          <thead><tr className="bg-muted border-b border-border">
            {["발송일시", "템플릿", "채널", "광고여부", "태그", "발송", "성공", "실패", "성공률", "비용 절감", "상태"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>{pagedRecords.map(r => (
              <tr key={r.id} onClick={() => setSelectedRecord(r)} className={`border-b border-border transition-colors cursor-pointer ${selectedRecord?.id === r.id ? "bg-accent" : "hover:bg-blue-50/70"}`}>
                <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{r.sentAt}</td>
                <td className="px-4 py-3.5 text-xs font-semibold text-foreground">{r.template}</td>
                <td className="px-4 py-3.5"><Badge text={r.channel} variant="blue" /></td>
                <td className="px-4 py-3.5"><Badge text={getMessagePurposeMeta(r.messagePurpose).label} variant={getMessagePurposeMeta(r.messagePurpose).color} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex min-w-[96px] flex-wrap gap-1">
                    {getRecordTags(r).map(tag => <span key={`${r.id}-${tag}`} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
                  </div>
                </td>
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
        <Pagination page={currentPage} total={sortedRecords.length} pageSize={pageSize} onPage={setPage} />
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
                ["태그", getRecordTags(selectedRecord).join(", ")],
                ["총 발송", `${selectedRecord.count.toLocaleString()}건`],
                ["광고여부", getMessagePurposeMeta(selectedRecord.messagePurpose).label],
                ["성공", `${selectedRecord.success.toLocaleString()}건`],
                ["실패", `${selectedRecord.fail.toLocaleString()}건`],
                ["총 소요 비용", formatWon(selectedRecord.cost)],
                ["절감액", formatWon(selectedRecord.savedCost)],
                ["계열사", selectedRecord.affiliate],
                ["최종 도달률", `${(((selectedRecord.success + buildFailoverFlow(selectedRecord).slice(1).reduce((sum, step) => sum + step.success, 0)) / selectedRecord.count) * 100).toFixed(1)}%`],
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
                {buildFailoverFlow(selectedRecord).map((step, index) => (
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
