/* Admin UI for building quiz JSON */

export function initAdmin() {
  const root = document.getElementById("app");
  showLogin(root, () => {
    const model = createEmptyModel();
    render(root, model);
  });
}

function showLogin(root, onOk) {
  root.innerHTML = `
  <section class="phone">
    <header class="header"><div class="brand">DOWEN QUIZ — Admin</div></header>
    <div class="content">
      <div class="card">
        <div class="adminRow"><label>Пароль</label><input class="input" id="pwd" type="password" placeholder="Введите пароль" /></div>
        <div class="adminRow"><button class="btn btn--next" id="loginBtn">Войти</button></div>
      </div>
    </div>
  </section>`;
  const tryLogin = () => {
    const value =
      /** @type {HTMLInputElement} */ (root.querySelector("#pwd")).value || "";
    if (value === "DOWEN") {
      onOk();
    } else {
      alert("Неверный пароль");
    }
  };
  root.querySelector("#pwd").addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryLogin();
  });
  root.querySelector("#loginBtn").addEventListener("click", tryLogin);
}

function createEmptyModel() {
  return {
    title: "New Quiz",
    questions: [],
    messages: [
      {
        min: 0,
        max: 0,
        text: "Неплохо! Попробуйте ещё раз — получится лучше.",
      },
      { min: 1, max: 2, text: "Хороший результат! Ещё немного практики." },
    ],
  };
}

function render(root, model) {
  root.innerHTML = `
  <section class="phone">
    <header class="header"><div class="brand">DOWEN QUIZ — Admin</div></header>
    <div class="content">
      <div class="card">
        <div class="adminRow">
          <label>Название</label>
          <input class="input" id="title" value="${escapeHtml(model.title)}" />
        </div>

        <div class="adminRow">
          <button class="btn btn--next" id="addQuestion">Добавить вопрос</button>
        </div>

        <div id="questions">
          ${model.questions
            .map((q, idx) => renderQuestion(q, idx, model.questions.length))
            .join("")}
        </div>

        <h3 style="margin:14px 0 8px">Сообщения по результату</h3>
        <div id="messages">
          ${model.messages.map((m, i) => renderMessage(m, i)).join("")}
        </div>
        <div class="adminRow">
          <button class="btn btn--neutral" id="addMessage">Добавить сообщение</button>
        </div>

        <div class="adminRow buttonRow">
          <button class="btn btn--next" id="exportBtn">Экспорт JSON</button>
          <button class="btn btn--neutral" id="importBtn">Импорт из буфера</button>
        </div>

        <textarea id="output" class="codeArea" placeholder="Здесь появится JSON" readonly></textarea>
      </div>
    </div>
  </section>`;

  // bind events
  root.querySelector("#title").addEventListener("input", (e) => {
    model.title = e.target.value;
  });

  root.querySelector("#addQuestion").addEventListener("click", () => {
    model.questions.push(createEmptyQuestion());
    render(root, model);
  });

  root.querySelector("#addMessage").addEventListener("click", () => {
    model.messages.push({ min: 0, max: 0, text: "" });
    render(root, model);
  });

  root.querySelector("#exportBtn").addEventListener("click", () => {
    const json = JSON.stringify(model, null, 2);
    const output = root.querySelector("#output");
    output.value = json;
    try {
      navigator.clipboard && navigator.clipboard.writeText(json);
    } catch {}
  });

  root.querySelector("#importBtn").addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.questions))
        throw new Error("Invalid JSON");
      Object.assign(model, data);
      render(root, model);
    } catch (err) {
      console.error("[import]", err);
      alert("Не удалось импортировать JSON из буфера обмена");
    }
  });

  // per-question handlers
  model.questions.forEach((q, idx) =>
    bindQuestionHandlers(root, model, q, idx)
  );
  // per-message handlers
  model.messages.forEach((m, i) => bindMessageHandlers(root, model, m, i));
}

function createEmptyQuestion() {
  return {
    text: "Чья это лягушка?",
    image: "",
    choices: [
      { text: "Славик", comment: "" },
      { text: "Вика", comment: "" },
      { text: "Денис", comment: "" },
      { text: "Руслан", comment: "" },
    ],
    correctIndex: 0,
  };
}

function renderQuestion(q, idx, total) {
  return `
  <div class="qCard" data-q="${idx}">
    <div class="adminRow"><label>Вопрос ${idx + 1}</label></div>
    <div class="adminRow"><label>Текст</label><input class="input" data-qtext value="${escapeHtml(
      q.text || ""
    )}" /></div>
    <div class="adminRow"><label>Изображение (URL)</label><input class="input" data-qimg value="${escapeHtml(
      q.image || ""
    )}" /></div>
    <div class="adminRow imgPreviewRow">
      <div class="imgPreview" data-qimg-preview-wrap style="display:none">
        <img alt="preview" data-qimg-preview src="" />
      </div>
    </div>
    <!-- Correct answer is selected via radio buttons in choices below -->
    <div class="adminRow"><label>Порядок</label><input type="range" min="1" max="${Math.max(
      1,
      total
    )}" value="${
    idx + 1
  }" class="input" data-qorder /><span aria-hidden="true">#${
    idx + 1
  }</span></div>
    <div class="choices">
      ${q.choices
        .map((c, i) => renderChoiceEditor(c, idx, i, q.correctIndex))
        .join("")}
    </div>
    <div class="adminRow"><button class="btn btn--wrong" data-qremove>Удалить вопрос</button></div>
    <hr style="opacity:.2;margin:12px 0"/>
  </div>`;
}

function renderChoiceEditor(c, qIdx, cIdx, correctIndex) {
  return `
    <div class="choiceEdit" data-q="${qIdx}" data-c="${cIdx}">
      <label>
        <input type="radio" name="q-${qIdx}-correct" data-correct-radio ${
          correctIndex === cIdx ? "checked" : ""
        } />
        #${cIdx}
      </label>
      <input class="input" placeholder="Текст" data-ctext value="${escapeHtml(
        c.text || ""
      )}" />
      <input class="input" placeholder="Комментарий (опц.)" data-ccomment value="${escapeHtml(
        c.comment || ""
      )}" />
    </div>
  `;
}

function bindQuestionHandlers(root, model, q, idx) {
  const scope = root.querySelector(`[data-q="${idx}"]`);
  scope.querySelector("[data-qtext]").addEventListener("input", (e) => {
    q.text = e.target.value;
  });
  const imgInput = scope.querySelector("[data-qimg]");
  const previewWrap = scope.querySelector("[data-qimg-preview-wrap]");
  const previewImg = scope.querySelector("[data-qimg-preview]");
  const hidePreview = () => {
    if (previewWrap) previewWrap.style.display = "none";
    if (previewImg) previewImg.removeAttribute("src");
  };
  const showPreview = (url) => {
    if (previewImg) previewImg.src = url;
    if (previewWrap) previewWrap.style.display = "";
  };
  const tryUpdatePreview = () => {
    const url = /** @type {HTMLInputElement} */ (imgInput).value.trim();
    if (!url) {
      hidePreview();
      return;
    }
    const testImg = new Image();
    testImg.onload = () => showPreview(url);
    testImg.onerror = hidePreview;
    testImg.src = url;
  };
  imgInput.addEventListener("input", (e) => {
    q.image = e.target.value;
    tryUpdatePreview();
  });
  // correct answer via radio buttons
  scope.querySelectorAll('[data-correct-radio]').forEach((el, i) => {
    el.addEventListener('change', () => { q.correctIndex = i; });
  });
  scope.querySelector("[data-qremove]").addEventListener("click", () => {
    model.questions.splice(idx, 1);
    render(root, model);
  });

  const orderEl = scope.querySelector("[data-qorder]");
  if (orderEl) {
    orderEl.addEventListener("input", (e) => {
      const val = Number(e.target.value) || idx + 1;
      const label = orderEl.nextElementSibling;
      if (label) label.textContent = `#${val}`;
    });
    orderEl.addEventListener("change", (e) => {
      const newPos = Math.max(
        0,
        Math.min(
          model.questions.length - 1,
          (Number(e.target.value) || idx + 1) - 1
        )
      );
      if (newPos === idx) return;
      const [item] = model.questions.splice(idx, 1);
      model.questions.splice(newPos, 0, item);
      render(root, model);
    });
  }

  q.choices.forEach((c, cIdx) => {
    const cs = scope.querySelector(`[data-q="${idx}"][data-c="${cIdx}"]`);
  });
  scope.querySelectorAll("[data-ctext]").forEach((el, i) =>
    el.addEventListener("input", (e) => {
      q.choices[i].text = e.target.value;
    })
  );
  scope.querySelectorAll("[data-ccomment]").forEach((el, i) =>
    el.addEventListener("input", (e) => {
      q.choices[i].comment = e.target.value;
    })
  );

  tryUpdatePreview();
}

function renderMessage(m, i) {
  return `
    <div class="msgCard" data-m="${i}">
      <div class="msgRow msgRow--range">
        <label>min</label>
        <input type="number" class="input" data-min value="${m.min}" />
        <label>max</label>
        <input type="number" class="input" data-max value="${m.max}" />
      </div>
      <div class="msgRow">
        <textarea class="input msgTextArea" data-text placeholder="Текст сообщения...">${escapeHtml(
          m.text || ""
        )}</textarea>
      </div>
      <div class="msgRow">
        <button class="btn btn--wrong" data-remove>Удалить</button>
      </div>
    </div>
  `;
}

function bindMessageHandlers(root, model, m, i) {
  const scope = root.querySelector(`[data-m="${i}"]`);
  scope.querySelector("[data-min]").addEventListener("input", (e) => {
    m.min = Number(e.target.value) || 0;
  });
  scope.querySelector("[data-max]").addEventListener("input", (e) => {
    m.max = Number(e.target.value) || 0;
  });
  scope.querySelector("[data-text]").addEventListener("input", (e) => {
    m.text = e.target.value;
  });
  scope.querySelector("[data-remove]").addEventListener("click", () => {
    model.messages.splice(i, 1);
    render(root, model);
  });
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"]+/g,
    (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[s])
  );
}
