import { useState } from 'react';
import { BarChart3, CheckCircle2, ChevronRight, Clock, Loader2, Send, Users, Zap } from 'lucide-react';
import type { Page } from '../types';
import { HISTORY, QUEUE_STATUS, formatWon, templatePerformanceTop } from '../domain';
import { Badge, ChannelShareCard, CostComparisonCard, DailySendTrendCard, Modal, QueueStatusCard, StatCard } from '../components/shared';

export function DashboardPage({ setPage }: { setPage: (p: Page) => void }) {
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const queueItems = [
    { id: "Q-2401", title: "6월 여름 할인 이벤트", channel: "카카오톡", status: "발송 중", progress: 72, requested: 284391, processed: 204762 },
    { id: "Q-2402", title: "포인트 소멸 안내", channel: "LMS", status: "대기", progress: 0, requested: 92841, processed: 0 },
    { id: "Q-2403", title: "생일 축하 메시지", channel: "SMS", status: "완료", progress: 100, requested: 1284, processed: 1284 },
    { id: "Q-2404", title: "신규 가입 환영", channel: "카카오톡", status: "실패", progress: 91, requested: 341, processed: 338 },
  ];
  const queueTotal = QUEUE_STATUS.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="총 발송 건수" value="892,451" icon={<Send className="w-4 h-4" />} color="blue" />
        <StatCard label="발송 성공률 / 실패 현황" value="98.7% / 165건" icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <StatCard label="활성 고객 수 (일반, 신규)" value="198,341" icon={<Users className="w-4 h-4" />} color="violet" />
        <StatCard label="실제 청구 비용" value={formatWon(18700000)} icon={<BarChart3 className="w-4 h-4" />} color="amber" />
        <StatCard label="스마트 라우팅 절감 현황" value={formatWon(5500000)} icon={<Zap className="w-4 h-4" />} color="green" />
      </div>

      <QueueStatusCard subtitle="대량 발송 요청이 현재 처리 흐름입니다." onDetailClick={() => setQueueModalOpen(true)} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <CostComparisonCard className="lg:col-span-2" chartClassName="h-[240px]" />
        <ChannelShareCard />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">최근 전송 기록</h3>
            <button onClick={() => setPage("history")} className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">전체보기 <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-1.5">
            {HISTORY.slice(0, 3).map(record => (
              <div key={record.id} className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-foreground">{record.template}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{record.sentAt} · {record.targetType}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-bold text-foreground">{record.count.toLocaleString()}건</div>
                  <Badge text={record.status} variant={record.status === "완료" ? "green" : "amber"} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <DailySendTrendCard className="min-h-[260px]" title="일별 발송 추이" gradientId="dashboardDailySendsGrad" />
        <div className="flex min-h-[260px] flex-col overflow-hidden rounded-xl border border-border bg-card p-3">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">템플릿별 성과 Top 5</h3>
            </div>
            <button onClick={() => setPage("stats-performance")} className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline">전체보기 <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            {templatePerformanceTop.slice(0, 5).map((template, index) => (
              <div key={template.name} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-1.5 last:border-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-foreground" title={template.name}>{template.name}</span>
                    {template.source === "AI 템플릿" && <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">AI</span>}
                  </div>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-3 text-right text-[11px] font-semibold">
                  <div>
                    <div className="text-muted-foreground">클릭률</div>
                    <div className="text-xs font-bold text-foreground">{template.click}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">전환율</div>
                    <div className="text-xs font-bold text-foreground">{template.conversion === null ? "-" : `${template.conversion}%`}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={queueModalOpen} onClose={() => setQueueModalOpen(false)} title="실시간 발송 큐 상태" wide>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {QUEUE_STATUS.map(item => {
              const rate = (item.count / queueTotal) * 100;
              return (
                <div key={item.label} className="rounded-lg border border-border bg-muted/45 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  </div>
                  <div className="text-lg font-bold text-foreground">{item.count.toLocaleString()}건</div>
                  <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{rate.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>큐 처리 흐름</span>
              <span>총 {queueTotal.toLocaleString()}건</span>
            </div>
            <div className="flex h-5 overflow-hidden rounded-full bg-muted">
              {QUEUE_STATUS.map(item => (
                <div key={item.label} className={item.color} style={{ width: `${Math.max(3, (item.count / queueTotal) * 100)}%` }} />
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="rounded-lg border border-border p-3">
              <div className="mb-3 text-xs font-bold text-muted-foreground">처리 단계</div>
              {[
                ["요청 접수", "완료"],
                ["대상 검증", "완료"],
                ["채널 라우팅", "진행 중"],
                ["발송 처리", "진행 중"],
                ["결과 집계", "대기"],
              ].map(([label, status], index) => (
                <div key={label} className="flex gap-2 pb-3 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${status === "완료" ? "bg-emerald-500 text-white" : status === "진행 중" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}>{index + 1}</span>
                    {index < 4 && <span className="h-5 w-px bg-border" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{label}</div>
                    <div className="text-[11px] font-semibold text-muted-foreground">{status}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-muted/45 px-4 py-3 text-xs font-bold text-muted-foreground">현재 큐 작업</div>
              <div className="divide-y divide-border">
                {queueItems.map(item => (
                  <div key={item.id} className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-foreground">{item.title}</div>
                        <div className="mt-0.5 text-xs font-semibold text-muted-foreground">{item.id} · {item.channel} · {item.requested.toLocaleString()}건</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${item.status === "완료" ? "bg-emerald-50 text-emerald-600" : item.status === "실패" ? "bg-red-50 text-red-500" : item.status === "대기" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"}`}>
                        {item.status === "발송 중" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                        {item.status}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>{item.processed.toLocaleString()}건 처리</span>
                      <span>{item.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
