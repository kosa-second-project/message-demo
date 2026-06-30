import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, Clock, Eye, FileText, Search, Send, Sparkles, X } from 'lucide-react';
import type { Member, MessagePurpose, Template } from '../types';
import { MEMBER_TAGS, createMemberRows, createTemplateRows, formatWon, getTemplateTags, memberMatchesTargetTag, uniqueTags } from '../domain';
import { CHANNELS, MESSAGE_PURPOSES, PERSONAL_FIELDS, getMessagePurposeMeta } from '../constants/messaging';
import { AiReportDetail, Badge, Btn, Modal, SpecPin, TemplateFormFields } from '../components/shared';
import type { TemplateFormState } from '../components/shared';

export function SendMessagePageWizard() {
  const members = useMemo(() => createMemberRows(), []);
  const templates = useMemo(() => createTemplateRows(), []);
  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [targetConfirmed, setTargetConfirmed] = useState(false);
  const [targetMatchMode, setTargetMatchMode] = useState<"OR" | "AND">("OR");
  const [tagSearch, setTagSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [checkedMembers, setCheckedMembers] = useState<number[]>([]);
  const [includedMembers, setIncludedMembers] = useState<Member[]>([]);
  const [excludedMembers, setExcludedMembers] = useState<Member[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateTargetFilters, setTemplateTargetFilters] = useState<string[]>([]);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("전체");
  const [templateChannelFilter, setTemplateChannelFilter] = useState("전체");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(templates[0]?.id ?? 0);
  const [messageTitle, setMessageTitle] = useState(templates[0]?.name ?? "");
  const [messageDraft, setMessageDraft] = useState(templates[0]?.content ?? "");
  const [messagePurpose, setMessagePurpose] = useState<MessagePurpose>("advertising");
  const [previewMode, setPreviewMode] = useState<"message" | "kakao" | "email">("message");
  const [selectedChannel, setSelectedChannel] = useState("kakao");
  const [channelSettingsOpen, setChannelSettingsOpen] = useState(true);
  const [channelPriority, setChannelPriority] = useState(["kakao"]);
  const [sendType, setSendType] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("2026-06-26");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [failoverEnabled, setFailoverEnabled] = useState(true);
  const previewMessage = messageDraft
    .replaceAll("#{이름}", "고객님")
    .replaceAll("#{포인트}", "0")
    .replaceAll("#{주문번호}", "주문번호 없음")
    .replaceAll("#{쿠폰명}", "10% 할인 쿠폰")
    .replaceAll("#{쿠폰만료일}", "2026-06-30")
    .replaceAll("#{등급}", "VIP")
    .replaceAll("#{매장명}", "더현대 서울")
    .replaceAll("#{배송예정일}", "2026-06-28")
    .replaceAll("#{추천상품}", "여름 신상품");
  const [marketingCopies, setMarketingCopies] = useState<string[]>([]);
  const [marketingPromptOpen, setMarketingPromptOpen] = useState(false);
  const [marketingPrompt, setMarketingPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<null | { title: string; reason: string; audience: string; template: string; channel: string; message: string }>(null);
  const [aiResult, setAiResult] = useState(false);
  const [aiReportOpen, setAiReportOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplateForm, setSaveTemplateForm] = useState<TemplateFormState>({ name: "", channel: "문자", content: "", category: "이벤트", messagePurpose: "advertising", scope: "전사 공통", tags: [] });
  const [aiJobs, setAiJobs] = useState([
    { name: "오타·맞춤법", model: "small-ko-proof", status: "대기", result: "-" },
    { name: "광고 표기", model: "small-policy-ad", status: "대기", result: "-" },
    { name: "민감 표현", model: "small-risk-ko", status: "대기", result: "-" },
    { name: "개인정보·마스킹", model: "small-privacy-ko", status: "대기", result: "-" },
    { name: "채널 길이", model: "small-channel-fit", status: "대기", result: "-" },
    { name: "발송 피로도", model: "small-frequency", status: "대기", result: "-" },
  ]);

  const selectedTemplate = templates.find(template => template.id === selectedTemplateId);
  const previewTitle = messageTitle.trim() || selectedTemplate?.name || "메시지 제목";
  const selectedMessagePurpose = MESSAGE_PURPOSES.find(purpose => purpose.id === messagePurpose) ?? MESSAGE_PURPOSES[0];
  const SelectedMessagePurposeIcon = selectedMessagePurpose.icon;
  const hasTargetSelected = selectedTags.length > 0;
  const canShowTargetMembers = targetConfirmed && hasTargetSelected;
  const targetSignature = selectedTags.join("|");
  const targetInitializedRef = useRef(false);
  const visibleTags = (tagSearch ? MEMBER_TAGS.filter(tag => tag.includes(tagSearch)) : MEMBER_TAGS).slice(0, 36);
  const targetMatchedMembers = useMemo(() => {
    if (!hasTargetSelected) return [];
    return members.filter(member => {
    const tagMatch = selectedTags.includes("전체 고객") || (
      targetMatchMode === "AND"
        ? selectedTags.every(tag => memberMatchesTargetTag(member, tag))
        : selectedTags.some(tag => memberMatchesTargetTag(member, tag))
    );
    const hasReceivableChannel = member.smsConsent || member.kakaoConsent || member.emailConsent;
    return tagMatch && hasReceivableChannel;
    });
  }, [hasTargetSelected, members, selectedTags, targetMatchMode]);
  const candidateMembers = useMemo(() => targetMatchedMembers.filter(member => {
    const memberTags = member.tags ?? [];
    return !memberSearch || member.name.includes(memberSearch) || member.phone.includes(memberSearch) || memberTags.some(tag => tag.includes(memberSearch));
  }), [memberSearch, targetMatchedMembers]);
  const visibleMembers = candidateMembers.slice(0, 32);
  const filteredTemplates = templates.filter(template => {
    const tags = getTemplateTags(template);
    const keywordMatch = !templateSearch || template.name.includes(templateSearch) || template.content.includes(templateSearch) || template.channel.includes(templateSearch) || tags.some(tag => tag.includes(templateSearch));
    const targetMatch = templateTargetFilters.length === 0 || templateTargetFilters.every(tag => tags.includes(tag));
    const categoryMatch = templateCategoryFilter === "전체" || template.category === templateCategoryFilter || tags.includes(templateCategoryFilter);
    const channelMatch = templateChannelFilter === "전체" || template.channel === templateChannelFilter;
    return keywordMatch && targetMatch && categoryMatch && channelMatch;
  });
  const visibleTemplates = filteredTemplates.slice(0, 10);
  const templateTargetOptions = uniqueTags(templates.flatMap(getTemplateTags)).slice(0, 8);
  const templateCategoryOptions = ["전체", ...Array.from(new Set(templates.map(template => template.category)))];
  const templateChannelOptions = ["전체", ...Array.from(new Set(templates.map(template => template.channel)))];
  const visiblePersonalFields = PERSONAL_FIELDS.filter(([label]) => ["고객명", "주문번호", "쿠폰명"].includes(label));
  const allVisibleMembersChecked = visibleMembers.length > 0 && visibleMembers.every(member => checkedMembers.includes(member.id));
  const checkedMemberRows = members.filter(member => checkedMembers.includes(member.id));
  const selectedRecipientCount = checkedMembers.length || targetMatchedMembers.length;
  const estimatedTarget = selectedTags.includes("전체 고객") && checkedMembers.length === 0 ? 284391 : Math.max(selectedRecipientCount, targetMatchedMembers.length * 1370);
  const messageMode = messageDraft.length > 90 ? "LMS" : "SMS";
  const selectedChannelMeta = CHANNELS.find(channel => channel.id === selectedChannel);
  const channelUnitCost = (channelId: string) => channelId === "text" ? messageMode === "LMS" ? 30 : 10 : channelId === "kakao" ? 7 : channelId === "email" ? 3 : 8;
  const unitCost = !selectedChannel ? 0 : channelUnitCost(selectedChannel);
  const estimatedCost = estimatedTarget * unitCost;
  const baselineCost = estimatedTarget * (messageMode === "LMS" ? 30 : 10);
  const estimatedSaving = Math.max(0, baselineCost - estimatedCost);
  const channelAudienceBase = checkedMembers.length > 0 ? checkedMemberRows : targetMatchedMembers;
  const channelAudienceRatio = (channelId: string) => {
    if (channelAudienceBase.length === 0) return 1;
    const reachableCount = channelAudienceBase.filter(member => {
      if (channelId === "text") return member.smsConsent;
      if (channelId === "kakao") return member.kakaoConsent;
      if (channelId === "email") return member.emailConsent;
      return member.smsConsent || member.kakaoConsent || member.emailConsent;
    }).length;
    return Math.max(0.08, reachableCount / channelAudienceBase.length);
  };
  const getChannelEstimate = (channelId: string) => {
    const count = Math.round(estimatedTarget * channelAudienceRatio(channelId));
    const cost = count * channelUnitCost(channelId);
    return { count, cost };
  };
  const selectedChannelSummary = channelPriority
    .map(channelId => CHANNELS.find(channel => channel.id === channelId)?.label)
    .filter(Boolean)
    .join(" > ");
  const selectedChannelLabels = channelPriority
    .map(channelId => CHANNELS.find(channel => channel.id === channelId)?.label)
    .filter(Boolean);
  const aiComplete = aiJobs.every(job => job.status === "완료") && aiResult;
  const messageStepReady = messageDraft.trim().length > 0 && !!selectedChannel && aiComplete;
  const canSend = targetConfirmed && selectedTags.length > 0 && messageStepReady;
  const stepMeta = ["수신자 선택", "메시지 작성", "검토 및 발송"];
  const stepReady = [
    targetConfirmed && selectedTags.length > 0,
    messageStepReady,
    canSend,
  ];
  const nextDisabledReason = step === 1 && !stepReady[0]
    ? hasTargetSelected ? "태그 조건을 확인해야 고객 목록과 다음 단계로 이동할 수 있습니다." : "수신자를 먼저 선택해 주세요."
    : step === 2 && !messageDraft.trim()
      ? "메시지를 작성해 주세요."
      : step === 2 && !selectedChannel
        ? "채널을 선택해 주세요."
        : step === 2 && !aiComplete
          ? "AI 검사를 완료해야 검토 및 발송으로 이동할 수 있습니다."
          : "";
  const canGoToStep = (value: number) => value === 1 || stepReady.slice(0, value - 1).every(Boolean);

  useEffect(() => {
    if (!targetInitializedRef.current) {
      targetInitializedRef.current = true;
      return;
    }
    setCheckedMembers([]);
    setIncludedMembers([]);
    setExcludedMembers([]);
    setMemberSearch("");
    setTargetConfirmed(false);
  }, [hasTargetSelected, targetMatchMode, targetSignature]);

  const toggleTag = (tag: string) => {
    if (targetConfirmed) return;
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
  };
  const confirmTarget = () => {
    if (!hasTargetSelected) return;
    setTargetConfirmed(true);
  };
  const editTarget = () => {
    setTargetConfirmed(false);
    setCheckedMembers([]);
    setMemberSearch("");
  };
  const selectAllSearchedMembers = () => {
    if (!canShowTargetMembers) return;
    setCheckedMembers(candidateMembers.map(member => member.id));
  };
  const clearSelectedMembers = () => {
    setCheckedMembers([]);
  };
  const toggleVisibleMembers = () => {
    if (!canShowTargetMembers) return;
    const visibleIds = visibleMembers.map(member => member.id);
    setCheckedMembers(prev => allVisibleMembersChecked ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])));
  };
  const toggleTemplateTargetFilter = (tag: string) => {
    setTemplateTargetFilters(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
  };
  const toggleChannelPriority = (channelId: string) => {
    setChannelPriority(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      setSelectedChannel(next[0] ?? "");
      return next;
    });
  };
  const insertVariable = (value: string) => setMessageDraft(prev => `${prev}${prev.endsWith(" ") || prev.length === 0 ? "" : " "}${value}`);
  const recommendMarketingCopy = () => {
    const prompt = marketingPrompt.trim();
    const copies = [
      "[현대퓨처넷] #{이름}님, 지금 #{등급} 고객님께 준비된 #{쿠폰명}이 도착했습니다. #{쿠폰만료일} 전에 혜택을 확인해 주세요.",
      "[현대퓨처넷] #{이름}님을 위한 #{추천상품} 혜택을 준비했습니다. 가까운 #{매장명} 또는 앱에서 특별 혜택을 만나보세요.",
      "[현대퓨처넷] #{이름}님, 보유 포인트 #{포인트}P와 함께 사용할 수 있는 혜택이 있습니다. 오늘 추천 상품을 확인해 보세요.",
    ];
    setMarketingCopies(prompt ? copies.map(copy => `${copy}\n요청사항: ${prompt}`) : copies);
    setMarketingPromptOpen(false);
  };
  const toggleMemberCheck = (id: number) => {
    setCheckedMembers(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
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
    const manual: Member = { id: Date.now(), name: manualName, phone: manualPhone, type: "수동", smsConsent: true, kakaoConsent: true, emailConsent: true, rcsConsent: false, joinedAt: "-", lastSend: "-", tags: ["수동 추가"] };
    setIncludedMembers(prev => mergeMembers(prev, [manual]));
    setManualName("");
    setManualPhone("");
  };
  const pickTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setMessageTitle(template.name);
    setMessageDraft(template.content);
  };
  const openSaveTemplate = () => {
    setSaveTemplateForm({
      name: messageTitle.trim() || (selectedTemplate ? `${selectedTemplate.name} 복사본` : "새 메시지 템플릿"),
      channel: selectedChannelLabels.length > 0 ? selectedChannelLabels.join(", ") : selectedChannelMeta?.label ?? "SMS",
      content: messageDraft,
      category: selectedTemplate?.category ?? "이벤트",
      messagePurpose,
      scope: selectedTemplate?.scope ?? "전사 공통",
      tags: selectedTags.length > 0 ? selectedTags : selectedTemplate ? getTemplateTags(selectedTemplate) : [],
    });
    setSaveTemplateOpen(true);
  };
  const runAiPlan = () => {
    setAiLoading(true);
    window.setTimeout(() => {
      const template = templates.find(item => getTemplateTags(item).includes("최근구매")) ?? templates[0];
      const message = "[현대퓨처넷] #{이름}님, 최근 관심 상품 기준으로 선별한 우수고객 혜택이 준비되었습니다. 앱에서 쿠폰과 사용 기간을 확인해 주세요. 수신거부 080-000-0000";
      setAiPlan({
        title: "최근구매 고객 재구매 캠페인",
        reason: "최근구매·카카오 동의·일반 태그 조합의 예상 반응률이 가장 높습니다.",
        audience: "일반, 최근구매, 카카오 동의",
        template: template.name,
        channel: "카카오톡",
        message,
      });
      setSelectedTags(["일반", "최근구매", "카카오 동의"]);
      setMessagePurpose("advertising");
      setSelectedChannel("kakao");
      setSelectedTemplateId(template.id);
      setMessageTitle("최근구매 고객 재구매 캠페인");
      setMessageDraft(message);
      setCheckedMembers(members.filter(member => member.tags?.includes("최근구매") && member.kakaoConsent).slice(0, 12).map(member => member.id));
      setTargetConfirmed(true);
      setStep(2);
      setAiLoading(false);
    }, 1200);
  };
  const runAiCheck = () => {
    setAiResult(false);
    setAiReportOpen(false);
    setAiJobs(jobs => jobs.map(job => ({ ...job, status: "실행중", result: "queued" })));
    aiJobs.forEach((job, index) => {
      window.setTimeout(() => {
        setAiJobs(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, status: "완료", result: ["정상", messagePurpose === "advertising" ? "광고성 표기 확인" : "정보성 기준 확인", "위험 없음", "마스킹 필요 없음", messageDraft.length > 90 ? "LMS 권장" : "SMS 가능", "빈도 정상"][index] } : item));
        if (index === aiJobs.length - 1) {
          setAiResult(true);
          setAiReportOpen(true);
        }
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:h-full xl:grid-cols-[360px_1fr]">
      <div className="rounded-xl border border-border bg-card p-4 flex min-h-0 flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold">태그 선택</h3>
          </div>
        </div>
        <div className="space-y-3 min-h-0 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={tagSearch} onChange={event => setTagSearch(event.target.value)} disabled={targetConfirmed} placeholder="태그 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground">조건</div>
          </div>
          <div className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1">
            {(["OR", "AND"] as const).map(option => (
              <button key={option} disabled={targetConfirmed} onClick={() => setTargetMatchMode(option)} className={`px-3 py-1.5 rounded-md text-xs font-bold disabled:cursor-not-allowed ${targetMatchMode === option ? targetConfirmed ? "bg-card text-muted-foreground" : "bg-primary text-white" : "text-muted-foreground hover:bg-card"}`}>
                {option === "OR" ? "하나라도 포함" : "모두 포함"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-muted p-2">
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map(tag => (
                <button key={tag} disabled={targetConfirmed} onClick={() => toggleTag(tag)} className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:cursor-not-allowed ${selectedTags.includes(tag) ? targetConfirmed ? "border-primary/35 bg-primary/15 text-primary" : "border-primary bg-primary text-white" : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className={`rounded-lg border px-3 py-2 ${targetConfirmed ? "border-primary/25 bg-primary/10" : "border-primary/20 bg-primary/5"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-primary">현재 태그</span>
              <span className="text-[11px] font-bold text-muted-foreground">{hasTargetSelected ? `${targetMatchedMembers.length.toLocaleString()}명 후보` : "태그 미선택"}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedTags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} disabled={targetConfirmed} className={`rounded-full px-2 py-1 text-[11px] font-bold disabled:cursor-not-allowed ${targetConfirmed ? "bg-primary/15 text-primary" : "bg-primary text-white"}`}>
                  {tag} ×
                </button>
              ))}
              {selectedTags.length === 0 && <span className="text-xs font-semibold text-muted-foreground">태그를 선택해 주세요.</span>}
            </div>
          </div>
          <div className="flex justify-end">
            {targetConfirmed ? (
              <button
                onClick={editTarget}
                title="태그 조건을 변경하려면 수정 버튼을 누르세요. 수정 중에는 고객 목록이 확인 전까지 숨겨집니다."
                className="h-9 shrink-0 rounded-lg border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                수정
              </button>
            ) : (
              <button onClick={confirmTarget} disabled={!hasTargetSelected} className="h-9 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                확인
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="h-full min-h-0">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border bg-muted p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="고객명, 번호, 태그 검색" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none" />
            </div>
            <button onClick={selectAllSearchedMembers} disabled={!canShowTargetMembers || candidateMembers.length === 0} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">
              검색 결과 선택
            </button>
            <button onClick={clearSelectedMembers} disabled={checkedMembers.length === 0} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-bold text-muted-foreground hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40">
              선택 해제
            </button>
          </div>
          <div className="border-b border-border bg-card px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground">
                {canShowTargetMembers ? `태그 후보 ${targetMatchedMembers.length.toLocaleString()}명` : hasTargetSelected ? "태그 확인 대기" : "태그 미선택"}
              </span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700">
                현재 표시 {canShowTargetMembers ? candidateMembers.length.toLocaleString() : "0"}명
              </span>
              <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary">
                직접 선택 {checkedMembers.length.toLocaleString()}명
              </span>
              {checkedMemberRows.slice(0, 5).map(member => (
                <span key={member.id} className="rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                  {member.name}
                </span>
              ))}
              {checkedMemberRows.length > 5 && <span className="text-[11px] font-semibold text-muted-foreground">+{checkedMemberRows.length - 5}명</span>}
            </div>
          </div>
          {canShowTargetMembers && <div className="hidden overflow-x-auto border-b border-border md:block">
            <div className="grid min-w-[760px] grid-cols-[36px_0.8fr_1fr_0.45fr_2.2fr_0.45fr_0.45fr_0.45fr] gap-3 bg-muted/60 px-3 py-2 text-xs font-bold text-muted-foreground">
            <button type="button" onClick={toggleVisibleMembers} className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${allVisibleMembersChecked ? "border-primary bg-primary text-white" : "border-border bg-card text-transparent hover:border-primary"}`}>
              <Check className="h-3.5 w-3.5" />
            </button>
            <span>고객명</span>
            <span>번호</span>
            <span>유형</span>
            <span>태그</span>
            <span>문자</span>
            <span>카카오</span>
            <span>이메일</span>
            </div>
          </div>}
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="space-y-2 p-3 md:hidden">
              {canShowTargetMembers && visibleMembers.map(member => {
                const checked = checkedMembers.includes(member.id);
                return (
                  <label key={member.id} className={`block rounded-xl border p-3 transition-colors ${checked ? "border-primary bg-accent" : "border-border bg-card"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-white" : "border-border text-transparent"}`}>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <input className="sr-only" type="checkbox" checked={checked} onChange={() => toggleMemberCheck(member.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-foreground">{member.name}</span>
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{member.type}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{member.phone}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(member.tags ?? []).slice(0, 4).map((tag, index) => <span key={`${member.id}-${tag}-${index}`} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] font-bold">
                          <span className={member.smsConsent ? "text-emerald-600" : "text-red-400"}>SMS {member.smsConsent ? "동의" : "거부"}</span>
                          <span className={member.kakaoConsent ? "text-emerald-600" : "text-red-400"}>카카오 {member.kakaoConsent ? "동의" : "거부"}</span>
                          <span className={member.emailConsent ? "text-emerald-600" : "text-red-400"}>이메일 {member.emailConsent ? "동의" : "거부"}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
              {canShowTargetMembers && visibleMembers.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-8 text-center text-xs font-semibold text-muted-foreground">
                  조건에 맞는 고객이 없습니다.
                </div>
              )}
            </div>
            <div className="hidden md:block">
            {canShowTargetMembers && visibleMembers.map(member => {
              const checked = checkedMembers.includes(member.id);
              return (
                <label key={member.id} className="grid min-w-[760px] grid-cols-[36px_0.8fr_1fr_0.45fr_2.2fr_0.45fr_0.45fr_0.45fr] gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-blue-50/60 cursor-pointer transition-colors">
                  <span className={`relative flex h-5 w-5 items-center justify-center rounded border transition-colors ${checked ? "border-primary bg-primary text-white" : "border-border bg-card text-transparent"}`}>
                    <Check className="h-3.5 w-3.5" />
                    <input className="sr-only" type="checkbox" checked={checked} onChange={() => toggleMemberCheck(member.id)} />
                  </span>
                  <span className="text-xs font-bold">{member.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{member.phone}</span>
                  <span className="text-xs text-muted-foreground">{member.type}</span>
                  <div className="flex min-w-0 gap-1 overflow-hidden whitespace-nowrap">
                    {(member.tags ?? []).slice(0, 5).map(tag => <span key={tag} className="shrink-0 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}
                  </div>
                  <span>{member.smsConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</span>
                  <span>{member.kakaoConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</span>
                  <span>{member.emailConsent ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}</span>
                </label>
              );
            })}
            </div>
            {canShowTargetMembers && visibleMembers.length === 0 && (
              <div className="hidden px-3 py-8 text-center text-xs text-muted-foreground md:block">수신 가능한 채널이 있는 고객만 표시됩니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChannelSettings = () => (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={() => setChannelSettingsOpen(prev => !prev)} className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-bold">채널 선택</h3>
          <p className="mt-1 text-xs text-muted-foreground">{selectedChannelSummary || "채널 미선택"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 px-1 text-xs font-bold text-muted-foreground">
            {channelSettingsOpen ? "접기" : "더보기"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${channelSettingsOpen ? "rotate-180" : ""}`} />
          </span>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-out ${channelSettingsOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map(channel => {
              const priority = channelPriority.indexOf(channel.id) + 1;
              const selected = priority > 0;
              return (
                <button key={channel.id} onClick={() => toggleChannelPriority(channel.id)} className={`relative rounded-lg border p-2.5 text-left transition-colors ${selected ? "cursor-pointer border-primary bg-accent shadow-sm" : "cursor-pointer border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${selected ? "bg-primary text-white" : "bg-muted text-primary"}`}>
                      <channel.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${priority > 0 ? "border-primary bg-primary text-white" : "border-border bg-muted text-muted-foreground"}`}>
                        {priority || "+"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="truncate text-xs font-bold">{channel.label}</div>
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{channelUnitCost(channel.id)}원/건</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{channel.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessage = () => (
    <div className="flex min-h-full flex-col gap-4">
      {renderChannelSettings()}
      <div className="grid grid-cols-1 gap-4 xl:h-[640px] xl:shrink-0 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card xl:min-h-0">
          <div className="min-h-[236px] p-5 border-b border-border">
            <div className="mb-3 flex min-h-[36px] items-center">
              <h3 className="text-sm font-bold">템플릿 검색</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={templateSearch} onChange={event => setTemplateSearch(event.target.value)} placeholder="템플릿명, 채널, 문구 검색" className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={templateCategoryFilter} onChange={event => setTemplateCategoryFilter(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
                {templateCategoryOptions.map(option => <option key={option}>{option}</option>)}
              </select>
              <select value={templateChannelFilter} onChange={event => setTemplateChannelFilter(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
                {templateChannelOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {templateTargetOptions.map(tag => (
                <button key={tag} onClick={() => toggleTemplateTargetFilter(tag)} className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-bold ${templateTargetFilters.includes(tag) ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-primary/25 bg-blue-50 px-3 py-2">
              <div className="text-[11px] font-bold text-primary">선택한 템플릿</div>
              <div className="mt-1 truncate text-xs font-bold text-blue-950">{selectedTemplate ? selectedTemplate.name : "직접 작성"}</div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {visibleTemplates.map(template => (
              <button key={template.id} onClick={() => pickTemplate(template)} className={`block w-full cursor-pointer text-left px-4 py-3 border-b border-border last:border-0 ${selectedTemplateId === template.id ? "bg-accent" : "bg-card"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold truncate">{template.name}</span>
                  <Badge text={template.channel} variant="blue" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.content.replace(/\n/g, " ")}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {getTemplateTags(template).slice(0, 3).map((tag, index) => <span key={`${template.id}-${tag}-${index}`} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{tag}</span>)}
                </div>
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border bg-muted text-xs text-muted-foreground">
            {filteredTemplates.length.toLocaleString()}건 검색됨
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col rounded-xl border border-border bg-card p-4 sm:p-5 xl:min-h-0">
          <div className="mb-4 flex min-h-[36px] flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold">메시지 작성</h3>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button title="템플릿 저장" onClick={openSaveTemplate} className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-accent sm:flex-none">
              <FileText className="w-3.5 h-3.5" /> 템플릿 저장
            </button>
            <button title="AI 문구 추천" onClick={() => setMarketingPromptOpen(true)} className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary/90 sm:flex-none">
              <Sparkles className="w-3.5 h-3.5" /> AI 문구 추천
            </button>
            <button title="AI 검사" onClick={runAiCheck} disabled={!messageDraft || aiJobs.some(job => job.status === "실행중")} className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
              <CheckCircle2 className="w-3.5 h-3.5" /> AI 검사
            </button>
            </div>
          </div>
          {marketingCopies.length > 0 && (
            <div className="mb-3 rounded-xl border border-border bg-muted p-3">
              <div className="mb-2 text-xs font-bold text-muted-foreground">AI 추천 문구</div>
              <div className="space-y-2">
                {marketingCopies.map(copy => (
                  <button key={copy} onClick={() => { setMessageDraft(copy); setSelectedTemplateId(0); }} className="block w-full rounded-lg bg-card px-3 py-2 text-left text-xs leading-relaxed text-foreground">
                    {copy}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(aiJobs.some(job => job.status === "실행중") || aiComplete) && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {aiJobs.slice(0, 3).map(job => (
                <Badge key={job.name} text={`${job.name} ${job.status}`} variant={job.status === "완료" ? "green" : job.status === "실행중" ? "amber" : "default"} />
              ))}
              {aiComplete && (
                <button onClick={() => setAiReportOpen(true)} className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm">
                  <Eye className="h-3 w-3" /> 리포트 보기
                </button>
              )}
            </div>
          )}
          <div className="mb-3">
            <div className="mb-2 text-xs font-bold text-muted-foreground">광고여부</div>
            <div className="grid grid-cols-2 gap-2">
              {MESSAGE_PURPOSES.map(purpose => {
                const Icon = purpose.icon;
                const selected = messagePurpose === purpose.id;
                return (
                  <button key={purpose.id} onClick={() => setMessagePurpose(purpose.id)} className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors ${selected ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {purpose.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-3">
            <div className="mb-2 text-xs font-bold text-muted-foreground">개인화 항목</div>
            <div className="flex flex-wrap gap-2">
            {visiblePersonalFields.map(([label, value]) => (
              <button key={value} onClick={() => insertVariable(value)} className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground">{label}</button>
            ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="mb-2 text-xs font-bold text-muted-foreground">제목</div>
            <input value={messageTitle} onChange={event => { setMessageTitle(event.target.value); setSelectedTemplateId(0); }} placeholder="메시지 제목을 입력하세요" className="w-full rounded-lg border border-border bg-input-background px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="mb-2 text-xs font-bold text-muted-foreground">내용</div>
          <textarea value={messageDraft} onChange={event => { setMessageDraft(event.target.value); setSelectedTemplateId(0); }} className="min-h-[220px] flex-1 w-full px-3.5 py-2.5 rounded-lg border border-border bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 xl:min-h-0" />
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="mb-3 flex min-h-[34px] flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold">미리보기</h3>
            <div className="inline-flex rounded-lg border border-border bg-muted p-1">
              {[
                ["message", "메시지"],
                ["kakao", "카카오톡"],
                ["email", "이메일"],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setPreviewMode(value as "message" | "kakao" | "email")} className={`px-2.5 py-1.5 rounded-md text-xs font-bold ${previewMode === value ? "bg-primary text-white" : "text-muted-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="mb-2 flex justify-end">
            <Badge text={selectedMessagePurpose.label} variant={selectedMessagePurpose.color} />
          </div>
          <div className="relative mx-auto aspect-[1179/2556] w-full max-w-[220px] shrink-0 overflow-hidden rounded-[2.35rem] bg-gradient-to-b from-slate-700 via-slate-950 to-black p-[5px] shadow-2xl ring-1 ring-slate-500/40 2xl:max-w-[230px]">
            <div className="absolute -left-1 top-24 h-14 w-1 rounded-l bg-slate-800" />
            <div className="absolute -right-1 top-32 h-20 w-1 rounded-r bg-slate-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-white">
              <div className="absolute left-1/2 top-3 z-30 flex h-6 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black shadow-lg">
                <span className="mr-2 h-1.5 w-7 rounded-full bg-slate-700" />
                <span className="h-2 w-2 rounded-full bg-slate-800 ring-1 ring-slate-600" />
              </div>
              <div className={`flex items-center justify-between px-6 pb-2 pt-4 text-[11px] font-bold ${previewMode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-slate-50 text-slate-700"}`}>
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-3.5 rounded-sm border border-current" />
                  <span className="h-2 w-3 rounded-sm bg-current" />
                </span>
              </div>
              <div className={`border-b border-black/5 px-5 py-3 text-center text-xs font-bold ${previewMode === "kakao" ? "bg-[#F7E600] text-[#3A1D1D]" : "bg-white text-slate-800"}`}>
                {previewMode === "message" ? "메시지" : previewMode === "kakao" ? "카카오톡" : "Mail"}
              </div>
              <div className={`h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 pb-10 ${previewMode === "message" ? "bg-white" : previewMode === "kakao" ? "bg-[#BACEDE]" : "bg-slate-50"}`}>
                {previewMode === "email" ? (
                  <div className="min-h-full bg-white text-slate-900">
                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">M</div>
                      <div className="text-sm font-bold">Gmail</div>
                    </div>
                    <div className="mb-3 text-base font-bold leading-snug">{previewTitle}</div>
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
                    <div className="whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-xs leading-relaxed text-foreground shadow-sm">{previewMessage}</div>
                    <div className="mt-4 flex gap-2">
                      <button className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground">답장</button>
                      <button className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground">전달</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-[11px] text-muted-foreground">{previewMode === "message" ? "010-0000-0000" : "현대퓨처넷"}</div>
                    <div className={`max-w-[185px] p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${previewMode === "message" ? "ml-auto rounded-2xl bg-primary text-white" : "rounded-2xl rounded-tl-sm bg-[#FFF8C5]"}`}>
                      <div className={`mb-2 text-xs font-bold leading-snug ${previewMode === "message" ? "text-white" : "text-[#3A1D1D]"}`}>{previewTitle}</div>
                      {previewMessage}
                    </div>
                    {previewMode === "kakao" && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5 max-w-[185px]">
                        <button className="rounded-lg bg-white px-2 py-2 text-[11px] font-bold text-[#3A1D1D]">쿠폰 확인</button>
                        <button className="rounded-lg bg-white px-2 py-2 text-[11px] font-bold text-[#3A1D1D]">상세 보기</button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="absolute bottom-2.5 left-1/2 h-1.5 w-28 -translate-x-1/2 rounded-full bg-slate-900/85" />
            </div>
          </div>
          {messageDraft.length > 90 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> SMS 길이를 초과해 LMS 기준 비용으로 계산될 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold">발송 방식</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={() => setSendType("now")} className={`cursor-pointer rounded-lg border px-3 py-3 text-left transition-colors ${sendType === "now" ? "border-primary bg-accent" : "border-border bg-card"}`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Clock className="h-4 w-4 text-primary" /> 즉시 발송
              </div>
            </button>
            <button onClick={() => setSendType("later")} className={`cursor-pointer rounded-lg border px-3 py-3 text-left transition-colors ${sendType === "later" ? "border-primary bg-accent" : "border-border bg-card"}`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <CalendarDays className="h-4 w-4 text-primary" /> 예약 발송
              </div>
            </button>
          </div>
          {sendType === "later" && (
            <div className="mt-3 rounded-xl border border-border bg-muted p-3">
              <div className="mb-2 text-xs font-bold text-muted-foreground">예약 일시</div>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  ["오늘 10:00", "2026-06-26", "10:00"],
                  ["오늘 14:00", "2026-06-26", "14:00"],
                  ["내일 09:00", "2026-06-27", "09:00"],
                ].map(([label, date, time]) => (
                  <button key={label} onClick={() => { setScheduleDate(date); setScheduleTime(time); }} className={`cursor-pointer rounded-lg border px-2 py-2 text-xs font-bold ${scheduleDate === date && scheduleTime === time ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="text-xs font-bold text-muted-foreground">
                  날짜
                  <input type="date" value={scheduleDate} onChange={event => setScheduleDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                </label>
                <label className="text-xs font-bold text-muted-foreground">
                  시간
                  <input type="time" value={scheduleTime} onChange={event => setScheduleTime(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold">비용 계산</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="text-xs font-bold text-muted-foreground">대상 인원</div>
              <div className="mt-2 text-xl font-bold">{estimatedTarget.toLocaleString()}명</div>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="text-xs font-bold text-muted-foreground">광고여부</div>
              <div className="mt-2 flex items-center gap-2 text-xl font-bold">
                <SelectedMessagePurposeIcon className="h-4 w-4 text-primary" />
                {selectedMessagePurpose.label}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="text-xs font-bold text-muted-foreground">채널</div>
              <div className="mt-2 space-y-1.5">
                {selectedChannelLabels.length > 0 ? selectedChannelLabels.map((label, index) => (
                  <div key={label} className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-white">{index + 1}</span>
                    <span>{label}</span>
                  </div>
                )) : <span className="text-xl font-bold">미선택</span>}
              </div>
            </div>
            <div className="rounded-xl border border-primary/20 bg-blue-50 p-4 text-blue-800">
              <div className="text-xs font-bold text-blue-600">예상 발송 비용</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatWon(estimatedCost)}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <div className="text-xs font-bold">예상 절감액</div>
              <div className="mt-2 text-2xl font-bold">{formatWon(estimatedSaving)}</div>
              <div className="mt-2 text-xs font-semibold">{formatWon(baselineCost)} - {formatWon(estimatedCost)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col gap-3 p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {stepMeta.map((label, index) => {
              const value = index + 1;
              const active = step === value;
              const done = step > value;
              const disabledStep = !canGoToStep(value);
              return (
                <button key={label} disabled={disabledStep} title={disabledStep ? "이전 단계를 먼저 완료해 주세요." : label} onClick={() => setStep(value)} className={`flex items-center gap-2 text-left ${disabledStep ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${active ? "bg-primary border-primary text-white" : done ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : value}
                  </span>
                  <span className={`whitespace-nowrap text-xs font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  {value < stepMeta.length && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-visible pr-0 lg:overflow-y-auto lg:pr-1">
        {step === 1 && renderRecipients()}
        {step === 2 && renderMessage()}
        {step === 3 && renderReview()}
      </div>

      <div className="border-t border-border bg-background/95 pt-3">
        <div className="flex items-center justify-between gap-3">
          <Btn variant="outline" disabled={step === 1} onClick={() => setStep(prev => Math.max(1, prev - 1))}>이전</Btn>
          <div />
          {step < stepMeta.length ? (
            <div className="relative flex items-center">
              {!stepReady[step - 1] && nextDisabledReason && (
                <div className="absolute bottom-full right-0 mb-2 max-w-[calc(100vw-2rem)] overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white shadow-lg md:max-w-none">
                  {nextDisabledReason}
                  <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-blue-700" />
                </div>
              )}
              <span title={!stepReady[step - 1] ? nextDisabledReason || "필수값을 완료해 주세요." : ""}>
                <Btn disabled={!stepReady[step - 1]} onClick={() => setStep(prev => Math.min(stepMeta.length, prev + 1))}>다음 <ChevronRight className="w-3.5 h-3.5" /></Btn>
              </span>
            </div>
          ) : (
            <Btn variant="success" disabled={!canSend} onClick={() => alert("발송 요청이 생성되었습니다.")}><Send className="w-3.5 h-3.5" /> 발송 요청</Btn>
          )}
        </div>
      </div>
      <Modal open={marketingPromptOpen} onClose={() => setMarketingPromptOpen(false)} title="AI 문구 추천" wide>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="text-sm font-bold text-foreground">추천 방향</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              캠페인 목적, 강조할 혜택, 톤앤매너를 입력하면 현재 선택한 대상과 채널 기준으로 문구를 추천합니다.
            </p>
          </div>
          <textarea
            value={marketingPrompt}
            onChange={event => setMarketingPrompt(event.target.value)}
            placeholder="예: VIP 고객 대상, 이번 주말 한정 혜택을 강조하고 너무 과장되지 않게 작성"
            className="min-h-[140px] w-full resize-none rounded-xl border border-border bg-input-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {["혜택 중심", "부드러운 톤", "긴급감 강조"].map(prompt => (
              <button
                key={prompt}
                onClick={() => setMarketingPrompt(prev => prev ? `${prev}, ${prompt}` : prompt)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setMarketingPromptOpen(false)}>취소</Btn>
            <Btn onClick={recommendMarketingCopy}><Sparkles className="w-3.5 h-3.5" /> 추천 생성</Btn>
          </div>
        </div>
      </Modal>
      <Modal open={aiReportOpen} onClose={() => setAiReportOpen(false)} title="AI 검사 리포트" wide>
        <AiReportDetail />
      </Modal>
      <Modal open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} title="템플릿 저장" wide>
        <TemplateFormFields
          form={saveTemplateForm}
          setForm={setSaveTemplateForm}
          onCancel={() => setSaveTemplateOpen(false)}
          onSave={() => { setSaveTemplateOpen(false); alert("템플릿이 저장되었습니다."); }}
        />
      </Modal>
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
