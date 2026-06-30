export type Page =
  | "dashboard" | "send" | "templates" | "history" | "members"
  | "stats-overview" | "stats-channel" | "stats-routing" | "stats-member" | "stats-performance";
export type MessagePurpose = "advertising" | "informational";
export type StatsPage = Extract<Page, "stats-overview" | "stats-channel" | "stats-routing" | "stats-member" | "stats-performance">;
export type StatsPeriodPreset = "recent7" | "recent30" | "thisMonth" | "custom";
export type StatsGrain = "day" | "week" | "month";

export interface Template {
  id: number; name: string; channel: string; content: string; category: string; usageCount: number; updatedAt: string; tags?: string[];
  scope?: string; openRate?: number; clickRate?: number; optOutRate?: number; messagePurpose: MessagePurpose;
}
export interface Member {
  id: number; name: string; phone: string; type: string; smsConsent: boolean; kakaoConsent: boolean; emailConsent: boolean; rcsConsent: boolean; joinedAt: string; lastSend: string; tags?: string[];
}
export interface SendRecord {
  id: number; template: string; channel: string; targetType: string; count: number; success: number; fail: number; sentAt: string; status: string;
  cost: number; savedCost: number; affiliate: string; messagePurpose: MessagePurpose; failoverSteps: { label: string; requested: number; success: number; fail: number }[];
}
export interface StatsPeriod {
  preset: StatsPeriodPreset;
  start: string;
  end: string;
}
