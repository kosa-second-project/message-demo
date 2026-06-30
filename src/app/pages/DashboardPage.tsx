import { BarChart3, CheckCircle2, ChevronRight, Send, Users, Zap } from 'lucide-react';
import type { Page } from '../types';
import { HISTORY, formatWon } from '../domain';
import { Badge, ChannelShareCard, CostComparisonCard, DailySendTrendCard, QueueStatusCard, StatCard } from '../components/shared';

export function DashboardPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="총 발송 건수" value="892,451" icon={<Send className="w-4 h-4" />} color="blue" />
        <StatCard label="발송 성공률/실패 현황" value="98.7% / 165건" icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <StatCard label="활성 고객 수 (일반, 신규)" value="198,341" icon={<Users className="w-4 h-4" />} color="violet" />
        <StatCard label="실제 청구 비용" value={formatWon(18700000)} icon={<BarChart3 className="w-4 h-4" />} color="amber" />
        <StatCard label="스마트 라우팅 절감 현황" value={formatWon(5500000)} icon={<Zap className="w-4 h-4" />} color="green" />
      </div>

      <QueueStatusCard subtitle="대량 발송 엔진의 현재 처리 흐름입니다." onDetailClick={() => setPage("stats-routing")} />

      <div className="grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <CostComparisonCard className="lg:col-span-2" chartClassName="h-[240px] lg:min-h-0 lg:flex-1" />
        <ChannelShareCard />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <div className="bg-card rounded-xl border border-border p-4 lg:min-h-0 lg:overflow-hidden">
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
        <DailySendTrendCard className="min-h-[260px] lg:min-h-0" title="일별 발송 추이" gradientId="dashboardDailySendsGrad" />
      </div>
    </div>
  );
}
