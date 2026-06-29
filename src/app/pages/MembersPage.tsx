import { useMemo, useState } from 'react';
import { Check, Download, Search, X } from 'lucide-react';
import type { Member } from '../types';
import { MEMBER_TAGS, createMemberRows, tagGroupLabel, uniqueTags } from '../domain';
import { Badge, Btn, Modal, Pagination } from '../components/shared';

export function MembersPage() {
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
