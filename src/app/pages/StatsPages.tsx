import { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock, Download, MessageSquare, RefreshCw, Send, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart as RePieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StatsPeriod } from '../types';
import { buildChannelCostData, buildChannelShareData, buildChannelTrendData, buildFallbackStageData, buildNewMemberSeriesData, buildPerformanceSeriesData, buildRoutingSeriesData, buildSendTrendData, channelCostData, channelPie, clampNumber, fallbackDonutData, formatWon, getStatsGrain, getStatsGrainLabel, getStatsPeriodDays, getStatsPeriodLabel, hourlyClickData, templatePerformanceTop, weekdayClickData } from '../domain';
import { Btn, ChannelShareCard, CostComparisonCard, DailySendTrendCard, QueueStatusCard, StatCard, StatsPeriodControl } from '../components/shared';

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

export function StatsOverview({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
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
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="총 발송" value={totalSends.toLocaleString()} sub={getStatsPeriodLabel(period)} trend={{ val: "+12.4%", up: true, label: "이전 기간 대비" }} icon={<Send className="w-4 h-4" />} color="blue" />
        <StatCard label="평균 성공률" value={`${((totalSuccess / totalSends) * 100).toFixed(1)}%`} sub={`실패 ${(totalSends - totalSuccess).toLocaleString()}건`} trend={{ val: "+0.2%p", up: true, label: "이전 기간 대비" }} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <StatCard label="기간 평균 발송" value={Math.round(totalSends / days).toLocaleString()} sub="일 평균 기준" icon={<Activity className="w-4 h-4" />} color="violet" />
        <StatCard label="실제 청구 비용" value={formatWon(totalCost)} sub="선택 기간 누적" trend={{ val: "+8.1%", up: false, label: "이전 기간 대비" }} icon={<Target className="w-4 h-4" />} color="amber" />
        <StatCard label="스마트 라우팅 절감" value={formatWon(totalSaved)} sub="최대 비용 대비" icon={<RefreshCw className="w-4 h-4" />} color="green" />
      </div>
      <QueueStatusCard />
      <div className="grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
          <h3 className="text-sm font-bold mb-3">{grainLabel} 채널별 발송 현황</h3>
          <div className="h-[240px] lg:min-h-0 lg:flex-1">
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
        <div className="grid gap-3 lg:min-h-0 lg:grid-rows-2">
          <DailySendTrendCard title={`${grainLabel} 발송 & 성공 추이`} gradientId="statsDailySendsGrad" data={sendTrendData} xKey="label" />
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">Fallback 채널별 성공률</h3>
              <span className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold text-muted-foreground">{grainLabel}</span>
            </div>
            <div className="h-[240px] lg:min-h-0 lg:flex-1">
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

export function StatsChannel({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
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
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {channelSummaryMetrics.map(metric => (
          <div key={metric.label} className="bg-card rounded-xl border border-border p-3">
            <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
            <div className="text-lg font-bold text-foreground">{metric.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{metric.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <div className="grid gap-3 lg:min-h-0 lg:grid-rows-2">
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
            <h3 className="text-sm font-bold mb-3">채널별 성공률/실패율 비교</h3>
            <div className="h-[240px] lg:min-h-0 lg:flex-1">
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
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
            <h3 className="text-sm font-bold mb-3">{grainLabel} 채널별 추이</h3>
            <div className="h-[240px] lg:min-h-0 lg:flex-1">
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
        <div className="grid gap-3 lg:min-h-0 lg:grid-rows-[0.9fr_1.1fr]">
          <ChannelShareCard data={channelShareData} />
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border"><h3 className="text-sm font-bold">채널별 비용 및 평균 단가</h3></div>
            <div className="space-y-2 p-3 md:hidden">
              {periodChannelCostData.map(row => (
                <div key={row.channel} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-foreground">{row.channel}</div>
                    <div className="text-xs font-bold text-emerald-600">{row.successRate}% 성공</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><div className="text-muted-foreground">발송량</div><div className="font-bold">{row.sends.toLocaleString()}건</div></div>
                    <div><div className="text-muted-foreground">실패율</div><div className="font-bold text-red-500">{row.failRate}%</div></div>
                    <div><div className="text-muted-foreground">총 비용</div><div className="font-bold">{formatWon(row.cost)}</div></div>
                    <div><div className="text-muted-foreground">평균 단가</div><div className="font-bold">{row.unit}원</div></div>
                  </div>
                </div>
              ))}
            </div>
            <table className="hidden w-full text-sm md:table">
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
export function StatsRouting({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
  const routingData = useMemo(() => buildRoutingSeriesData(period), [period]);
  const actualCost = routingData.reduce((sum, row) => sum + row.actual, 0);
  const baselineCost = routingData.reduce((sum, row) => sum + row.baseline, 0);
  const savedCost = routingData.reduce((sum, row) => sum + row.saved, 0);
  const fallbackSwitches = Math.round(getStatsPeriodDays(period) * 185);
  const grainLabel = getStatsGrainLabel(getStatsGrain(period));
  return (
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="실제 청구 비용" value={formatWon(actualCost)} sub="선택 기간 누적" icon={<Target className="w-4 h-4" />} color="amber" />
        <StatCard label="최대 비용" value={formatWon(baselineCost)} sub="동일 물량 기준" icon={<TrendingUp className="w-4 h-4" />} color="violet" />
        <StatCard label="기간 절감액" value={formatWon(savedCost)} sub={`절감률 ${((savedCost / baselineCost) * 100).toFixed(1)}%`} trend={{ val: "+22.1%", up: true, label: "이전 기간 대비" }} icon={<Zap className="w-4 h-4" />} color="green" />
        <StatCard label="대체 발송 전환" value={fallbackSwitches.toLocaleString()} sub="전환율 1.9%" trend={{ val: "+0.4%p", up: true, label: "이전 기간 대비" }} icon={<RefreshCw className="w-4 h-4" />} color="blue" />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:shrink-0 lg:grid-cols-2">
        <CostComparisonCard title={`${grainLabel} 비용 비교 현황`} data={routingData} xKey="label" />
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
          <h3 className="text-sm font-bold mb-3">{grainLabel} 절감액 추이</h3>
          <div className="h-[240px] lg:h-[220px] lg:min-h-0">
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

export function StatsMember({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
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
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatsPeriodControl period={period} onChange={onPeriodChange} />
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 고객" value={totalMembers.toLocaleString()} sub="분석 가능 고객" icon={<Users className="w-4 h-4" />} color="amber" />
        <StatCard label="일반 고객" value={Math.round(totalMembers * 0.644).toLocaleString()} sub="주요 발송 대상" icon={<Users className="w-4 h-4" />} color="blue" />
        <StatCard label="신규 고객" value={newMembers.toLocaleString()} sub={`${days}일 누적 가입`} trend={{ val: "+3.9%", up: true, label: "이전 기간 대비" }} icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <StatCard label="휴면 고객" value="23,420" sub="6개월 이상 미활동" trend={{ val: "-284명", up: true, label: "이전 기간 대비" }} icon={<Clock className="w-4 h-4" />} color="violet" />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:shrink-0 lg:grid-cols-2">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
          <h3 className="text-sm font-bold mb-3">{grainLabel} 신규 고객 가입자 수</h3>
          <div className="h-[240px] lg:h-[220px] lg:min-h-0">
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
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
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

export function StatsPerformance({ period, onPeriodChange }: { period: StatsPeriod; onPeriodChange: (period: StatsPeriod) => void }) {
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
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <StatsPeriodControl period={period} onChange={onPeriodChange} compact />
          <select value={performanceChannel} onChange={event => setPerformanceChannel(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground">
            {["카카오 친구톡", "카카오 알림톡", "SMS", "LMS", "RCS"].map(option => <option key={option}>{option}</option>)}
          </select>
        </div>
        <StatsReportActions period={period} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="선택 채널" value={performanceChannel} sub="채널별 데이터 표시" icon={<MessageSquare className="w-4 h-4" />} color="blue" />
        <StatCard label="평균 클릭률" value={`${averageClickRate.toFixed(1)}%`} sub="업계 평균 8.2%" trend={{ val: "+0.8%p", up: true, label: "이전 기간 대비" }} icon={<Target className="w-4 h-4" />} color="green" />
        <StatCard label="전환율" value={`${averageConversionRate.toFixed(1)}%`} sub="선택 기간 평균" trend={{ val: "+0.6%p", up: true, label: "이전 기간 대비" }} icon={<TrendingUp className="w-4 h-4" />} color="violet" />
        <StatCard label="수신 거부율" value={`${optOutRate.toFixed(2)}%`} sub="업계 평균 0.41%" trend={{ val: "-0.02%p", up: true, label: "이전 기간 대비" }} icon={<CheckCircle2 className="w-4 h-4" />} color="amber" />
      </div>
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[280px] flex-col lg:min-h-0 lg:flex-[1.1]">
        <h3 className="text-sm font-bold mb-3">{grainLabel} 성과 지표 추이</h3>
        <div className="h-[240px] lg:min-h-0 lg:flex-1">
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
      <div className="grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
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
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
          <h3 className="text-sm font-bold mb-3">요일별 클릭률</h3>
          <div className="h-[240px] lg:min-h-0 lg:flex-1">
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
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex min-h-[260px] flex-col lg:min-h-0">
          <h3 className="text-sm font-bold mb-3">시간별 클릭률</h3>
          <div className="h-[240px] lg:min-h-0 lg:flex-1">
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
