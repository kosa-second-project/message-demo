import { useMemo, useState } from 'react';
import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import type { MessagePurpose, Template } from '../types';
import { createTemplateRows, getTemplateTags, uniqueTags } from '../domain';
import { MESSAGE_PURPOSES, getMessagePurposeMeta } from '../constants/messaging';
import { Badge, Btn, Modal, Pagination, TemplateFormFields } from '../components/shared';
import type { TemplateFormState } from '../components/shared';

export function TemplatesPage() {
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
                    {getTemplateTags(t).slice(0, 3).map((tag, index) => <span key={`${t.id}-${tag}-${index}`} className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{tag}</span>)}
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
                    {getTemplateTags(detailModal).length > 0 ? getTemplateTags(detailModal).map((tag, index) => <span key={`${detailModal.id}-${tag}-${index}`} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{tag}</span>) : <span className="text-xs font-semibold text-muted-foreground">없음</span>}
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
