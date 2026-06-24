const channels = ["SMS", "LMS", "알림톡", "RCS"];
const companies = ["현대백화점", "현대홈쇼핑", "한섬", "현대퓨처넷"];
const tagPool = ["VIP", "VVIP", "최근구매", "휴면위험", "앱사용자", "오프라인방문", "20대", "30대", "40대", "카카오동의", "SMS동의", "RCS동의", "생일월", "멤버십", "쿠폰반응", "신규가입", "패션관심", "리빙관심", "서울권", "부산권"];

const state = {
  route: "dashboard",
  selectedTags: ["VIP", "최근구매", "카카오동의"],
  templates: [],
  members: [],
  history: [],
  templatePage: 1,
  memberPage: 1,
  historyPage: 1,
  analyticsTab: "overview",
  visibleMemberIds: [],
  aiJobs: [
    { id: "proof", name: "오타 검사", model: "small-ko-proof", status: "대기", progress: 0, result: "-" },
    { id: "policy", name: "광고/수신거부", model: "small-policy-ad", status: "대기", progress: 0, result: "-" },
    { id: "risk", name: "민감/사회 이슈", model: "small-risk-ko", status: "대기", progress: 0, result: "-" },
    { id: "privacy", name: "개인정보/마스킹", model: "small-privacy-ko", status: "대기", progress: 0, result: "-" },
    { id: "channel", name: "채널 길이/비용", model: "small-channel-fit", status: "대기", progress: 0, result: "-" },
    { id: "fatigue", name: "발송 피로도", model: "small-frequency", status: "대기", progress: 0, result: "-" },
    { id: "tone", name: "브랜드 톤", model: "small-tone-hi", status: "대기", progress: 0, result: "-" },
  ],
};

const pageTitles = {
  dashboard: "대시보드",
  send: "메시지 보내기",
  templates: "템플릿",
  members: "회원",
  history: "전송 기록",
  analytics: "통계",
};

document.addEventListener("DOMContentLoaded", () => {
  seedData();
  bindEvents();
  renderAll();
});

function seedData() {
  state.templates = Array.from({ length: 640 }, (_, index) => {
    const channel = channels[index % channels.length];
    const company = companies[index % companies.length];
    const tag = tagPool[index % tagPool.length];
    return {
      id: index + 1,
      name: `${company} ${tag} 템플릿 ${index + 1}`,
      channel,
      tags: [tag, company],
      body: `[${company}] {{고객명}}님께 안내드립니다.\n${tag} 대상 혜택이 준비되었습니다.\n수신거부: 080-000-0000`,
      updatedAt: `2026-06-${String((index % 23) + 1).padStart(2, "0")}`,
      owner: ["CRM", "마케팅운영", "멤버십", "브랜드"][index % 4],
    };
  });

  state.members = Array.from({ length: 4820 }, (_, index) => ({
    id: `MBR${1000000 + index}`,
    name: ["김서현", "박지훈", "이도윤", "최민서"][index % 4],
    company: companies[index % companies.length],
    phone: `010-****-${String(1000 + (index * 37) % 9000).padStart(4, "0")}`,
    tags: [tagPool[index % tagPool.length], tagPool[(index + 4) % tagPool.length]],
    sms: index % 7 !== 0,
    lms: index % 5 !== 0,
    kakao: index % 4 !== 0,
    rcs: index % 6 !== 0,
  }));

  state.history = Array.from({ length: 1250 }, (_, index) => {
    const channel = channels[index % channels.length];
    const target = 18000 + ((index * 731) % 240000);
    const fail = Math.floor(target * ([0.014, 0.028, 0.036, 0.059][index % 4]));
    return {
      id: `DLV${900000 + index}`,
      name: `${companies[index % companies.length]} ${tagPool[index % tagPool.length]} 캠페인`,
      channel,
      target,
      success: target - fail,
      fail,
      status: ["발송 완료", "예약 완료", "발송 중", "대체 발송 중"][index % 4],
      click: Math.floor(target * (0.03 + (index % 6) * 0.008)),
      conversion: Math.floor(target * (0.008 + (index % 5) * 0.003)),
    };
  });
}

function bindEvents() {
  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    document.body.classList.remove("locked");
    document.getElementById("loginView").style.display = "none";
    document.getElementById("appView").setAttribute("aria-hidden", "false");
    setTimeout(drawTrendChart, 60);
  });

  document.body.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) setRoute(routeButton.dataset.route);
  });

  document.getElementById("channelSelect").addEventListener("change", updateAudience);
  document.getElementById("sendTemplateSearch").addEventListener("input", renderTemplateSelect);
  document.getElementById("templateSelect").addEventListener("change", applyTemplate);
  document.getElementById("tagSearch").addEventListener("input", renderTags);
  document.getElementById("messageBody").addEventListener("input", () => {
    updateAudience();
    renderTemplatePreview();
  });
  document.getElementById("recommendCopy").addEventListener("click", recommendCopy);
  document.getElementById("runAi").addEventListener("click", runAiJobs);
  document.getElementById("sendForm").addEventListener("submit", scheduleSend);

  document.getElementById("templateSearch").addEventListener("input", () => {
    state.templatePage = 1;
    renderTemplates();
  });
  document.getElementById("addTemplate").addEventListener("click", addTemplate);

  document.getElementById("memberSearch").addEventListener("input", () => {
    state.memberPage = 1;
    renderMembers();
  });
  document.getElementById("applyVisibleMembers").addEventListener("click", () => applyMemberBulk("visible"));
  document.getElementById("applyFilteredMembers").addEventListener("click", () => applyMemberBulk("filtered"));
  document.getElementById("selectVisibleMembers").addEventListener("change", (event) => {
    document.querySelectorAll("[data-select-member]").forEach((checkbox) => {
      checkbox.checked = event.target.checked;
    });
  });
  ["excelUpload", "csvUpload", "jsonUpload"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (event) => handleUpload(event, id));
  });

  document.getElementById("historySearch").addEventListener("input", () => {
    state.historyPage = 1;
    renderHistory();
  });

  document.getElementById("analyticsTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-analytics]");
    if (!button) return;
    state.analyticsTab = button.dataset.analytics;
    document.querySelectorAll("[data-analytics]").forEach((item) => item.classList.toggle("active", item === button));
    renderAnalytics();
  });

  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalBackdrop").addEventListener("click", (event) => {
    if (event.target.id === "modalBackdrop") closeModal();
  });

  window.addEventListener("resize", () => {
    clearTimeout(window.chartTimer);
    window.chartTimer = setTimeout(() => {
      drawTrendChart();
      drawAnalyticsChart();
    }, 120);
  });
}

function renderAll() {
  renderTemplateSelect();
  renderTags();
  renderAiJobs();
  renderTemplates();
  renderMembers();
  renderHistory();
  renderAnalytics();
  applyTemplate();
}

function setRoute(route) {
  state.route = route;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === route));
  document.querySelectorAll("nav button").forEach((button) => button.classList.toggle("active", button.dataset.route === route));
  document.getElementById("pageTitle").textContent = pageTitles[route];
  if (route === "dashboard") setTimeout(drawTrendChart, 60);
  if (route === "analytics") setTimeout(drawAnalyticsChart, 60);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTemplateSelect() {
  const query = document.getElementById("sendTemplateSearch")?.value.trim() || "";
  const rows = state.templates.filter((template) => !query || `${template.name} ${template.tags.join(" ")} ${template.body}`.includes(query)).slice(0, 200);
  const previousValue = document.getElementById("templateSelect").value;
  document.getElementById("templateSelect").innerHTML = rows
    .map((template) => `<option value="${template.id}">${template.name} · ${template.channel}</option>`)
    .join("");
  if (rows.some((template) => String(template.id) === previousValue)) {
    document.getElementById("templateSelect").value = previousValue;
  }
  document.getElementById("sendTemplateResults").innerHTML = rows.slice(0, 8).map((template) => `
    <button type="button" class="template-result ${String(template.id) === document.getElementById("templateSelect").value ? "active" : ""}" data-pick-template="${template.id}">
      <strong>${template.name}</strong>
      <small>${template.channel} · ${template.tags.join(", ")} · ${template.updatedAt}</small>
    </button>
  `).join("");
  document.querySelectorAll("[data-pick-template]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("templateSelect").value = button.dataset.pickTemplate;
      applyTemplate();
      renderTemplateSelect();
    });
  });
  if (rows.length) applyTemplate();
}

function applyTemplate() {
  const id = Number(document.getElementById("templateSelect").value || state.templates[0].id);
  const template = state.templates.find((item) => item.id === id) || state.templates[0];
  document.getElementById("channelSelect").value = template.channel;
  document.getElementById("messageBody").value = template.body;
  updateAudience();
  renderTemplatePreview();
}

function renderTemplatePreview() {
  const id = Number(document.getElementById("templateSelect").value || state.templates[0].id);
  const template = state.templates.find((item) => item.id === id) || state.templates[0];
  const body = document.getElementById("messageBody").value.replaceAll("{{고객명}}", "김서현");
  document.getElementById("templatePreview").innerHTML = `
    <strong>${template.name}</strong>
    <small>${template.channel} · ${template.owner} · ${template.updatedAt}</small>
    <div class="detail-text">${body}</div>
  `;
}

function renderTags() {
  const query = document.getElementById("tagSearch").value.trim();
  const tags = query
    ? tagPool.filter((tag) => tag.includes(query)).slice(0, 10)
    : state.selectedTags;
  const similar = relatedTags(query).filter((tag) => !state.selectedTags.includes(tag)).slice(0, 8);
  const picker = document.getElementById("tagPicker");
  picker.innerHTML = tags.map((tag) => `<button type="button" class="tag-chip ${state.selectedTags.includes(tag) ? "active" : ""}" data-tag="${tag}">${tag}</button>`).join("");
  document.getElementById("tagSuggestions").innerHTML = query
    ? similar.map((tag) => `<button type="button" data-suggest-tag="${tag}">${tag}</button>`).join("")
    : "<small>태그명을 검색하면 관련 태그가 표시됩니다.</small>";
  document.querySelectorAll("[data-tag], [data-suggest-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag || button.dataset.suggestTag;
      state.selectedTags = state.selectedTags.includes(tag)
        ? state.selectedTags.filter((item) => item !== tag)
        : [...state.selectedTags, tag];
      renderTags();
      updateAudience();
    });
  });
}

function relatedTags(query) {
  if (!query) return [];
  const dictionary = {
    VIP: ["VVIP", "쿠폰반응", "최근구매", "멤버십"],
    앱: ["앱사용자", "쿠폰반응", "최근구매"],
    카카오: ["카카오동의", "SMS동의", "RCS동의"],
    휴면: ["휴면위험", "쿠폰반응", "재방문"],
    구매: ["최근구매", "VIP", "쿠폰반응"],
  };
  const matched = Object.entries(dictionary).find(([key]) => query.includes(key));
  const fromDictionary = matched ? matched[1] : [];
  const fromText = tagPool.filter((tag) => tag.includes(query) || [...query].some((char) => tag.includes(char)));
  return [...new Set([...fromDictionary, ...fromText])].filter((tag) => tagPool.includes(tag));
}

function updateAudience() {
  const channel = document.getElementById("channelSelect").value;
  const base = 380000 + state.selectedTags.length * 146000;
  const excluded = Math.floor(base * (channel === "RCS" ? 0.18 : 0.07));
  const target = base - excluded;
  const unit = channel === "SMS" ? 20 : channel === "LMS" ? 45 : channel === "알림톡" ? 18 : 38;
  document.getElementById("audienceCount").textContent = `${target.toLocaleString("ko-KR")}명`;
  document.getElementById("excludedCount").textContent = `${excluded.toLocaleString("ko-KR")}명`;
  document.getElementById("costEstimate").textContent = `${(target * unit).toLocaleString("ko-KR")}원`;
}

function renderAiJobs() {
  document.getElementById("aiJobs").innerHTML = state.aiJobs.map((job) => `
    <article class="ai-job">
      <div class="ai-job-head">
        <span>${job.name}</span>
        <span class="status ${job.status === "실행중" ? "wait" : ""}">${job.status}</span>
      </div>
      <div class="progress"><i style="--value:${job.progress}%"></i></div>
      <small>${job.model} · ${job.result}</small>
    </article>
  `).join("");
}

function runAiJobs() {
  document.getElementById("aiReport").innerHTML = "<small>분석 작업을 실행 중입니다.</small>";
  state.aiJobs.forEach((job, index) => {
    job.status = "실행중";
    job.progress = 8;
    job.result = "queued";
    renderAiJobs();
    const timer = setInterval(() => {
      job.progress = Math.min(100, job.progress + 18 + index * 3);
      if (job.progress >= 100) {
        clearInterval(timer);
        job.status = "완료";
        job.result = ["오타 0건", "필수 표기 확인", "주의 1건", "개인정보 없음", "LMS 적합", "빈도 정상", "톤 적합"][index];
      }
      renderAiJobs();
      if (state.aiJobs.every((item) => item.status === "완료")) renderAiReport();
    }, 260 + index * 90);
  });
}

function renderAiReport() {
  const text = document.getElementById("messageBody").value;
  const lengthType = text.length > 90 ? "LMS 전환 권장" : "SMS 가능";
  document.getElementById("aiReport").innerHTML = `
    <strong>간단 리포트</strong>
    <table class="mini-table">
      <tbody>
        <tr><td>문자 길이</td><td>${text.length}자 · ${lengthType}</td></tr>
        <tr><td>광고 정책</td><td>수신거부 문구 포함</td></tr>
        <tr><td>민감 표현</td><td>과장 표현 1건 주의</td></tr>
        <tr><td>개인정보</td><td>원문 개인정보 노출 없음</td></tr>
        <tr><td>발송 피로도</td><td>선택 태그 최근 7일 평균 2.1회</td></tr>
        <tr><td>수정 제안</td><td>혜택 조건과 만료일을 한 문장으로 명확히 표시</td></tr>
      </tbody>
    </table>
  `;
}

function recommendCopy() {
  const selected = state.selectedTags.join(", ");
  const channel = document.getElementById("channelSelect").value;
  const variants = [
    `[현대퓨처넷]\n{{고객명}}님께 맞춘 혜택이 준비되었습니다.\n앱에서 조건과 기간을 확인해 주세요.\n수신거부: 080-000-0000`,
    `[현대퓨처넷]\n{{고객명}}님, 최근 관심 상품 기준 혜택을 선별했습니다.\n오늘 앱에서 쿠폰을 확인해 주세요.\n수신거부: 080-000-0000`,
    `[현대퓨처넷]\n{{고객명}}님 전용 안내입니다.\n선호 매장 혜택과 사용 기간을 앱에서 확인할 수 있습니다.\n수신거부: 080-000-0000`,
  ];
  document.getElementById("aiReport").innerHTML = `
    <strong>추천 문구 생성</strong>
    <small>채널: ${channel}</small>
    <small>대상: ${selected}</small>
    <div class="recommend-list">
      ${variants.map((copy, index) => `<button type="button" data-recommend-copy="${index}">${copy.replaceAll("\n", "<br>")}</button>`).join("")}
    </div>
  `;
  document.querySelectorAll("[data-recommend-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("messageBody").value = variants[Number(button.dataset.recommendCopy)];
      renderTemplatePreview();
      updateAudience();
      showToast("추천 문구를 적용했습니다.");
    });
  });
}

function scheduleSend(event) {
  event.preventDefault();
  const templateName = document.getElementById("templateSelect").selectedOptions[0].textContent.split(" · ")[0];
  const channel = document.getElementById("channelSelect").value;
  const target = Number(document.getElementById("audienceCount").textContent.replace(/\D/g, ""));
  state.history.unshift({
    id: `DLV${Date.now()}`,
    name: templateName,
    channel,
    target,
    success: 0,
    fail: 0,
    status: "예약 완료",
    click: 0,
    conversion: 0,
  });
  renderHistory();
  showToast("전송 예약이 완료되었습니다.");
  setRoute("history");
}

function renderTemplates() {
  const query = document.getElementById("templateSearch").value.trim();
  const rows = state.templates.filter((item) => !query || `${item.name} ${item.tags.join(" ")} ${item.body}`.includes(query));
  renderPagedTable({
    rows,
    page: state.templatePage,
    pageSize: 10,
    tbodyId: "templateTable",
    paginationId: "templatePagination",
    setPage: (page) => {
      state.templatePage = page;
      renderTemplates();
    },
    row: (template) => `
      <tr data-template-row="${template.id}">
        <td><strong>${template.name}</strong><br><small>${template.body.slice(0, 48)}...</small></td>
        <td>${template.channel}</td>
        <td>${template.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}</td>
        <td>
          <button class="secondary" data-use-template="${template.id}">사용</button>
          <button class="secondary" data-ai-template="${template.id}">AI</button>
          <button class="secondary" data-edit-template="${template.id}">수정</button>
          <button class="secondary" data-delete-template="${template.id}">삭제</button>
        </td>
      </tr>
    `,
  });
  document.querySelectorAll("[data-template-row]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openTemplateDetail(Number(row.dataset.templateRow));
    });
  });
  document.querySelectorAll("[data-use-template]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setRoute("send");
      document.getElementById("templateSelect").value = button.dataset.useTemplate;
      applyTemplate();
    });
  });
  document.querySelectorAll("[data-ai-template]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      showToast("템플릿 AI 검사 작업을 생성했습니다.");
    });
  });
  document.querySelectorAll("[data-edit-template]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openTemplateEdit(Number(button.dataset.editTemplate));
    });
  });
  document.querySelectorAll("[data-delete-template]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.templates = state.templates.filter((item) => item.id !== Number(button.dataset.deleteTemplate));
      renderTemplateSelect();
      renderTemplates();
      showToast("템플릿을 삭제했습니다.");
    });
  });
}

function addTemplate() {
  const id = Math.max(...state.templates.map((template) => template.id)) + 1;
  state.templates.unshift({
    id,
    name: `신규 템플릿 ${id}`,
    channel: "SMS",
    tags: ["신규가입", "SMS동의"],
    body: "[현대퓨처넷]\n{{고객명}}님께 안내드립니다.\n수신거부: 080-000-0000",
    updatedAt: "2026-06-23",
    owner: "마케팅운영",
  });
  state.templatePage = 1;
  renderTemplateSelect();
  renderTemplates();
  showToast("템플릿을 추가했습니다.");
}

function openTemplateDetail(id) {
  const template = state.templates.find((item) => item.id === id);
  openModal("템플릿 상세", `
    <dl class="detail-grid">
      <dt>템플릿명</dt><dd>${template.name}</dd>
      <dt>채널</dt><dd>${template.channel}</dd>
      <dt>태그</dt><dd>${template.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}</dd>
      <dt>담당</dt><dd>${template.owner}</dd>
      <dt>수정일</dt><dd>${template.updatedAt}</dd>
    </dl>
    <div class="detail-text">${template.body}</div>
  `);
}

function openTemplateEdit(id) {
  const template = state.templates.find((item) => item.id === id);
  openModal("템플릿 수정", `
    <label>템플릿명 <input id="editTemplateName" value="${template.name}" /></label>
    <label>채널
      <select id="editTemplateChannel">
        ${channels.map((channel) => `<option ${channel === template.channel ? "selected" : ""}>${channel}</option>`).join("")}
      </select>
    </label>
    <label>내용 <textarea id="editTemplateBody" rows="8">${template.body}</textarea></label>
    <div class="actions">
      <button class="secondary" id="editTemplateAi">AI 검사</button>
      <button class="primary" id="saveTemplateEdit">저장</button>
    </div>
  `);
  document.getElementById("editTemplateAi").addEventListener("click", () => showToast("수정 중인 템플릿 AI 검사 완료"));
  document.getElementById("saveTemplateEdit").addEventListener("click", () => {
    template.name = document.getElementById("editTemplateName").value;
    template.channel = document.getElementById("editTemplateChannel").value;
    template.body = document.getElementById("editTemplateBody").value;
    template.updatedAt = "2026-06-23";
    renderTemplateSelect();
    renderTemplates();
    closeModal();
    showToast("템플릿을 수정했습니다.");
  });
}

function filteredMembers() {
  const query = document.getElementById("memberSearch").value.trim();
  return state.members.filter((member) => !query || `${member.id} ${member.name} ${member.company} ${member.tags.join(" ")}`.includes(query));
}

function renderMembers() {
  const rows = filteredMembers();
  renderPagedTable({
    rows,
    page: state.memberPage,
    pageSize: 10,
    tbodyId: "memberTable",
    paginationId: "memberPagination",
    setPage: (page) => {
      state.memberPage = page;
      renderMembers();
    },
    row: (member) => `
      <tr>
        <td><input type="checkbox" data-select-member="${member.id}" /></td>
        <td><strong>${maskName(member.name)}</strong><br><small>${member.id} · ${member.phone}</small></td>
        <td>${member.company}</td>
        <td>${member.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}</td>
        ${["sms", "lms", "kakao", "rcs"].map((key) => `<td><button class="switch ${member[key] ? "on" : ""}" data-member="${member.id}" data-key="${key}"></button></td>`).join("")}
        <td><button class="secondary" data-edit-member="${member.id}">수정</button></td>
      </tr>
    `,
    onPageRows: (pageRows) => {
      state.visibleMemberIds = pageRows.map((member) => member.id);
    },
  });
  document.getElementById("selectVisibleMembers").checked = false;
  document.querySelectorAll("[data-member]").forEach((button) => {
    button.addEventListener("click", () => {
      const member = state.members.find((item) => item.id === button.dataset.member);
      member[button.dataset.key] = !member[button.dataset.key];
      renderMembers();
    });
  });
  document.querySelectorAll("[data-edit-member]").forEach((button) => {
    button.addEventListener("click", () => openMemberEdit(button.dataset.editMember));
  });
}

function openMemberEdit(id) {
  const member = state.members.find((item) => item.id === id);
  openModal("회원 정보 수정", `
    <dl class="detail-grid">
      <dt>회원</dt><dd>${maskName(member.name)} · ${member.id}</dd>
      <dt>전화번호</dt><dd>${member.phone}</dd>
      <dt>계열사</dt><dd>${member.company}</dd>
      <dt>태그</dt><dd>${member.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}</dd>
    </dl>
    <div class="bulk-bar">
      <label><input type="checkbox" id="editSms" ${member.sms ? "checked" : ""} /> SMS</label>
      <label><input type="checkbox" id="editLms" ${member.lms ? "checked" : ""} /> LMS</label>
      <label><input type="checkbox" id="editKakao" ${member.kakao ? "checked" : ""} /> 알림톡</label>
      <label><input type="checkbox" id="editRcs" ${member.rcs ? "checked" : ""} /> RCS</label>
    </div>
    <div class="actions"><button class="primary" id="saveMemberEdit">저장</button></div>
  `);
  document.getElementById("saveMemberEdit").addEventListener("click", () => {
    member.sms = document.getElementById("editSms").checked;
    member.lms = document.getElementById("editLms").checked;
    member.kakao = document.getElementById("editKakao").checked;
    member.rcs = document.getElementById("editRcs").checked;
    renderMembers();
    closeModal();
    showToast("회원 정보를 수정했습니다.");
  });
}

function applyMemberBulk(scope) {
  const field = document.getElementById("memberBulkField").value;
  const value = document.getElementById("memberBulkValue").value === "true";
  const checkedIds = [...document.querySelectorAll("[data-select-member]:checked")].map((item) => item.dataset.selectMember);
  const ids = checkedIds.length
    ? checkedIds
    : scope === "visible"
      ? state.visibleMemberIds
      : filteredMembers().map((member) => member.id);
  state.members.forEach((member) => {
    if (ids.includes(member.id)) member[field] = value;
  });
  renderMembers();
  showToast(`${ids.length.toLocaleString("ko-KR")}명 변경 완료`);
}

function handleUpload(event, id) {
  const file = event.target.files[0];
  if (!file) return;
  const type = id === "excelUpload" ? "Excel" : id === "csvUpload" ? "CSV" : "JSON";
  showToast(`${type} 파일 업로드 대기열에 추가됨: ${file.name}`);
  event.target.value = "";
}

function renderHistory() {
  const query = document.getElementById("historySearch").value.trim();
  const rows = state.history.filter((item) => !query || item.name.includes(query));
  renderPagedTable({
    rows,
    page: state.historyPage,
    pageSize: 10,
    tbodyId: "historyTable",
    paginationId: "historyPagination",
    setPage: (page) => {
      state.historyPage = page;
      renderHistory();
    },
    row: (item) => `
      <tr data-history-row="${item.id}">
        <td><strong>${item.name}</strong><br><small>${item.id}</small></td>
        <td>${item.channel}</td>
        <td>${item.target.toLocaleString("ko-KR")}</td>
        <td>${item.success.toLocaleString("ko-KR")}</td>
        <td>${item.fail.toLocaleString("ko-KR")}</td>
        <td><span class="status ${item.status.includes("중") || item.status.includes("예약") ? "wait" : ""}">${item.status}</span></td>
      </tr>
    `,
  });
  document.querySelectorAll("[data-history-row]").forEach((row) => {
    row.addEventListener("click", () => openHistoryDetail(row.dataset.historyRow));
  });
}

function openHistoryDetail(id) {
  const item = state.history.find((entry) => entry.id === id);
  openModal("전송 상세", `
    <dl class="detail-grid">
      <dt>전송ID</dt><dd>${item.id}</dd>
      <dt>캠페인</dt><dd>${item.name}</dd>
      <dt>채널</dt><dd>${item.channel}</dd>
      <dt>대상</dt><dd>${item.target.toLocaleString("ko-KR")}명</dd>
      <dt>성공</dt><dd>${item.success.toLocaleString("ko-KR")}건</dd>
      <dt>실패</dt><dd>${item.fail.toLocaleString("ko-KR")}건</dd>
      <dt>클릭</dt><dd>${item.click.toLocaleString("ko-KR")}건</dd>
      <dt>전환</dt><dd>${item.conversion.toLocaleString("ko-KR")}건</dd>
      <dt>상태</dt><dd>${item.status}</dd>
    </dl>
  `);
}

function renderAnalytics() {
  const data = {
    overview: {
      labels: ["전달률", "클릭률", "수신거부", "예약량"],
      values: ["97.2%", "8.4%", "0.18%", "420만"],
      title: "경영 요약",
      table: [["이번 달 총 발송", "18,420,940"], ["전달 성공", "17,905,118"], ["대체 발송", "164,002"], ["정책 차단", "38,972"], ["예상 매출 기여", "12.8억"]],
    },
    channel: {
      labels: ["SMS 성공", "알림톡 성공", "RCS 클릭", "LMS 비용"],
      values: ["98.6%", "96.8%", "8.4%", "45원"],
      title: "채널 품질",
      table: [["SMS", "전달률 높음 · 비용 낮음"], ["LMS", "장문 안내 적합 · 비용 주의"], ["알림톡", "개인화 알림 적합 · 실패 시 대체 필요"], ["RCS", "클릭률 높음 · 동의 정합성 필요"], ["오류 집중", "번호 오류, 수신 거부, 채널 타임아웃"]],
    },
    segment: {
      labels: ["VIP 전환", "앱 클릭", "휴면 복귀", "개인화 상승"],
      values: ["11.8%", "9.2%", "4.1%", "+17%"],
      title: "세그먼트 전략",
      table: [["VIP", "쿠폰보다 선공개/한정 문구 반응"], ["앱사용자", "RCS 이미지 카드 클릭률 우수"], ["휴면위험", "만료일 강조 시 재방문 증가"], ["신규가입", "첫 구매 쿠폰 반응"], ["개인화 점수", "최근 행동 기반 문구가 일반 문구 대비 우수"]],
    },
    conversion: {
      labels: ["열람", "클릭", "쿠폰함", "구매"],
      values: ["63.8%", "14.2%", "8.1%", "2.9%"],
      title: "전환 퍼널",
      table: [["도달", "17,905,118"], ["열람", "11,424,984"], ["클릭", "2,542,526"], ["쿠폰함 진입", "1,450,314"], ["구매", "519,248"], ["이탈 구간", "클릭 후 쿠폰함 진입"]],
    },
    cost: {
      labels: ["월 비용", "전환당 비용", "절감 가능", "ROI"],
      values: ["4.2억", "1,484원", "5,180만원", "3.7배"],
      title: "비용 효율",
      table: [["SMS 단문화", "2,140만원 절감"], ["알림톡 1회 재시도 후 SMS", "820만원 절감"], ["저반응 세그먼트 제외", "1,530만원 절감"], ["RCS 고반응군 선별", "690만원 절감"], ["피로도 제한", "수신거부율 0.04%p 감소 예상"]],
    },
  }[state.analyticsTab];

  ["A", "B", "C", "D"].forEach((key, index) => {
    document.getElementById(`analyticsMetric${key}`).textContent = data.labels[index];
    document.getElementById(`analyticsValue${key}`).textContent = data.values[index];
  });

  document.getElementById("analyticsContent").innerHTML = `
    <article class="panel wide">
      <div class="panel-head"><h2>${data.title}</h2></div>
      <canvas id="analyticsCanvas" height="170"></canvas>
    </article>
    <article class="panel">
      <div class="panel-head"><h2>마케팅 판단 지표</h2></div>
      <table class="mini-table"><tbody>${data.table.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</tbody></table>
    </article>
    <article class="panel">
      <div class="panel-head"><h2>다음 액션</h2></div>
      <div class="campaign-list">
        <button>고반응 세그먼트 우선 발송</button>
        <button>실패율 높은 채널 대체 정책 확인</button>
        <button>저전환 캠페인 문구 재검사</button>
      </div>
    </article>
  `;
  setTimeout(drawAnalyticsChart, 60);
}

function renderPagedTable({ rows, page, pageSize, tbodyId, paginationId, setPage, row, onPageRows }) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  if (onPageRows) onPageRows(pageRows);
  document.getElementById(tbodyId).innerHTML = pageRows.map(row).join("");
  document.getElementById(paginationId).innerHTML = paginationMarkup(rows.length, current, totalPages);
  document.querySelectorAll(`#${paginationId} [data-page]`).forEach((button) => {
    button.addEventListener("click", () => setPage(Number(button.dataset.page)));
  });
}

function paginationMarkup(total, page, totalPages) {
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => Math.max(1, Math.min(totalPages - 4, page - 2)) + index)
    .filter((item, index, arr) => item <= totalPages && arr.indexOf(item) === index);
  return `
    <span>${total.toLocaleString("ko-KR")}건 · ${page}/${totalPages}</span>
    <div class="page-buttons">
      <button data-page="${Math.max(1, page - 1)}">‹</button>
      ${pages.map((item) => `<button class="${item === page ? "active" : ""}" data-page="${item}">${item}</button>`).join("")}
      <button data-page="${Math.min(totalPages, page + 1)}">›</button>
    </div>
  `;
}

function maskName(name) {
  return name.length < 3 ? `${name[0]}*` : `${name[0]}*${name.at(-1)}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function openModal(title, html) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modalBackdrop").hidden = false;
}

function closeModal() {
  document.getElementById("modalBackdrop").hidden = true;
}

function drawTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas || !canvas.offsetWidth) return;
  drawMultiLine(canvas, [
    { label: "09", sms: 42, kakao: 58, rcs: 22 },
    { label: "10", sms: 51, kakao: 62, rcs: 28 },
    { label: "11", sms: 47, kakao: 70, rcs: 31 },
    { label: "12", sms: 64, kakao: 74, rcs: 29 },
    { label: "13", sms: 76, kakao: 84, rcs: 38 },
    { label: "14", sms: 58, kakao: 77, rcs: 42 },
  ], ["sms", "kakao", "rcs"], ["SMS", "알림톡", "RCS"]);
}

function drawAnalyticsChart() {
  const canvas = document.getElementById("analyticsCanvas");
  if (!canvas || !canvas.offsetWidth) return;
  drawMultiLine(canvas, [
    { label: "1", sent: 98, ok: 31, fail: 1 },
    { label: "2", sent: 97, ok: 46, fail: 3 },
    { label: "3", sent: 96, ok: 58, fail: 4 },
    { label: "4", sent: 94, ok: 84, fail: 6 },
    { label: "5", sent: 99, ok: 62, fail: 2 },
  ], ["sent", "ok", "fail"], ["성공", "반응", "실패"]);
}

function drawMultiLine(canvas, data, keys, labels) {
  const ctx = prepCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  const pad = 34;
  const max = Math.max(...data.flatMap((item) => keys.map((key) => item[key]))) + 8;
  drawGrid(ctx, width, height, pad);
  keys.forEach((key, keyIndex) => {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = getColors()[keyIndex];
    data.forEach((item, index) => {
      const x = pad + (index * (width - pad * 2)) / Math.max(1, data.length - 1);
      const y = height - pad - (item[key] / max) * (height - pad * 2);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  drawLabels(ctx, data, width, height, pad);
  drawLegend(ctx, labels, width);
}

function prepCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return ctx;
}

function drawGrid(ctx, width, height, pad) {
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--line");
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");
  ctx.font = "12px Pretendard, sans-serif";
  for (let i = 0; i < 4; i += 1) {
    const y = pad + (i * (height - pad * 2)) / 3;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }
}

function drawLabels(ctx, data, width, height, pad) {
  ctx.textAlign = "center";
  data.forEach((item, index) => {
    const x = pad + (index * (width - pad * 2)) / Math.max(1, data.length - 1);
    ctx.fillText(item.label, x, height - 10);
  });
}

function drawLegend(ctx, labels, width) {
  ctx.textAlign = "left";
  labels.forEach((label, index) => {
    const x = Math.max(34, width - 220 + index * 70);
    ctx.fillStyle = getColors()[index];
    ctx.fillRect(x, 12, 9, 9);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text");
    ctx.fillText(label, x + 13, 21);
  });
}

function getColors() {
  const styles = getComputedStyle(document.body);
  return [styles.getPropertyValue("--accent").trim(), styles.getPropertyValue("--blue").trim(), styles.getPropertyValue("--red").trim()];
}
