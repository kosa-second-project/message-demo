import { useState } from 'react';
import { BarChart3, ChevronDown, FileText, History, LayoutDashboard, LogOut, Menu, MessageSquare, Send, Users } from 'lucide-react';
import type { Page, StatsPage, StatsPeriod } from '../types';
import { createDefaultStatsPeriods } from '../domain';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoryPage } from '../pages/HistoryPage';
import { MembersPage } from '../pages/MembersPage';
import { SendMessagePageWizard } from '../pages/SendMessagePage';
import { StatsChannel, StatsMember, StatsOverview, StatsPerformance, StatsRouting } from '../pages/StatsPages';
import { TemplatesPage } from '../pages/TemplatesPage';

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
  members: "고객 관리", "stats-overview": "발송 현황", "stats-channel": "채널 분석",
  "stats-routing": "비용 분석", "stats-member": "고객 분석", "stats-performance": "성과 분석",
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
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">김</div>
          <span className="hidden text-xs font-semibold text-foreground sm:inline">김민준</span>
        </div>
      </div>
    </header>
  );
}


export function MainLayout({ currentPage, setCurrentPage, onLogout }: {
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
      case "send": return null;
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
        <main className={`flex-1 min-w-0 overflow-y-auto overscroll-contain ${fitToViewport ? "lg:overflow-hidden" : ""}`}>
          <div className={currentPage === "send" ? "h-full" : "hidden"}>
            <SendMessagePageWizard />
          </div>
          {currentPage !== "send" && renderPage()}
        </main>
      </div>
    </div>
  );
}
