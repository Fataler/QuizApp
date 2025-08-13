/*
  Mobile Quiz SPA
  - Loads local JSON for now (can be swapped to network later)
  - Smooth UI transitions, touch-friendly
*/

const state = {
  questions: [],
  index: 0,
  selectedIndex: null,
  score: 0,
  finished: false,
};

const appRoot = document.getElementById("app");

async function loadQuiz() {
  try {
    const res = await fetch("./data/quiz.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load quiz.json");
    const data = await res.json();
    // Basic validation
    if (!Array.isArray(data.questions)) throw new Error("Invalid quiz format");
    state.questions = data.questions;
    state.messages = data.messages || [];
    render();
  } catch (err) {
    console.error("[loadQuiz]", err);
    appRoot.innerHTML = `<div class="phone"><div class="content"><p>Не удалось загрузить данные. Проверьте консоль.</p></div></div>`;
  }
}

function resetState() {
  state.index = 0;
  state.selectedIndex = null;
  state.score = 0;
  state.finished = false;
}

function onSelectChoice(choiceIndex) {
  if (state.finished) return;
  const question = state.questions[state.index];
  if (state.selectedIndex !== null) return; // prevent double click

  state.selectedIndex = choiceIndex;
  const isCorrect = question.correctIndex === choiceIndex;
  if (isCorrect) state.score += 1;
  animateButtonsFeedback(isCorrect);
  render();
}

function nextQuestion() {
  if (state.index < state.questions.length - 1) {
    state.index += 1;
    state.selectedIndex = null;
    render(true);
  } else {
    state.finished = true;
    render();
  }
}

function restart() {
  resetState();
  render(true);
}

function progressPercent() {
  const total = state.questions.length || 1;
  const current = Math.min(
    state.index + (state.selectedIndex !== null ? 1 : 0),
    total
  );
  return Math.round((current / total) * 100);
}

function getMessageForScore(score) {
  if (!Array.isArray(state.messages) || state.messages.length === 0) return "";
  // messages: [{min, max, text}]
  const total = state.questions.length;
  for (const m of state.messages) {
    const min = m.min ?? 0;
    const max = m.max ?? total;
    if (score >= min && score <= max) return m.text || "";
  }
  return "";
}

function render(animateEnter = false) {
  if (state.finished) {
    renderResult();
    return;
  }
  const q = state.questions[state.index];
  const total = state.questions.length;
  const current = state.index + 1;

  appRoot.innerHTML = `
  <section class="phone">
    <header class="header"><div class="brand">DOWEN QUIZ</div></header>
    <div class="progress" aria-label="Progress">
      <div class="progress__bar" style="width:${progressPercent()}%"></div>
    </div>
    <div class="content">
      <div class="card ${animateEnter ? "fade-enter" : ""}">
        ${
          q.image
            ? `<div class="media"><img alt="question image" src="${q.image}"></div>`
            : ""
        }
        ${
          q.text
            ? `<div class="question">Вопрос ${current} из ${total}: ${q.text}</div>`
            : `<div class="question">Вопрос ${current} из ${total}</div>`
        }
        <div class="answers" role="list">
          ${q.choices
            .map((choice, i) => renderChoice(q, i, state.selectedIndex))
            .join("")}
        </div>
      </div>
    </div>
    <footer class="footer">
      ${
        state.selectedIndex !== null
          ? `<button class=\"btn btn--next\" id=\"nextBtn\">Далее</button>`
          : ``
      }
    </footer>
  </section>`;

  if (animateEnter) requestAnimationFrame(() => addEnterAnimation());

  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.addEventListener("click", nextQuestion);

  document
    .querySelectorAll("[data-choice-index]")
    .forEach((el) => el.addEventListener("click", onChoiceClick));
}

function renderChoice(question, choiceIndex, selectedIndex) {
  const isSelected = selectedIndex === choiceIndex;
  const isAnswered = selectedIndex !== null;
  const isCorrectChoice = question.correctIndex === choiceIndex;

  const choice = question.choices[choiceIndex];
  const choiceText = typeof choice === "string" ? choice : choice.text ?? "";
  const choiceComment = typeof choice === "object" ? choice.comment : undefined;

  let variantClass = "btn--neutral";
  let icon = "";
  if (isAnswered) {
    if (isCorrectChoice) {
      variantClass = "btn--correct";
      icon = '<span class="choiceIcon">✓</span>';
    } else if (isSelected) {
      variantClass = "btn--wrong";
      icon = '<span class="choiceIcon">✕</span>';
    }
  }

  const comment =
    isAnswered && choiceComment
      ? `<div class="comment">${choiceComment}</div>`
      : "";

  return `
    <button class="btn ${variantClass}" data-choice-index="${choiceIndex}" ${
    isAnswered ? "disabled" : ""
  }>
      <span class="choiceRow">${icon}<span>${choiceText}</span></span>
      ${comment}
    </button>
  `;
}

function onChoiceClick(e) {
  const index = Number(e.currentTarget.getAttribute("data-choice-index"));
  onSelectChoice(index);
}

function addEnterAnimation() {
  const el = document.querySelector(".card.fade-enter");
  if (!el) return;
  el.classList.add("fade-enter-active");
  el.addEventListener(
    "transitionend",
    () => {
      el.classList.remove("fade-enter");
      el.classList.remove("fade-enter-active");
    },
    { once: true }
  );
}

function animateButtonsFeedback(isCorrect) {
  try {
    if (navigator.vibrate) navigator.vibrate(isCorrect ? 20 : [10, 30, 10]);
  } catch (_) {
    /* noop */
  }
}

function renderResult() {
  const total = state.questions.length;
  const msg = getMessageForScore(state.score);
  appRoot.innerHTML = `
  <section class="phone">
    <header class="header"><div class="brand">DOWEN QUIZ</div></header>
    <div class="progress"><div class="progress__bar" style="width:100%"></div></div>
    <div class="content">
      <div class="card result fade-enter">
        <h2>Ваш результат: ${state.score} / ${total}</h2>
        ${msg ? `<p>${msg}</p>` : ""}
      </div>
    </div>
    <footer class="footer">
      <button class="btn btn--next" id="shareBtn">Поделиться результатом</button>
    </footer>
  </section>`;
  requestAnimationFrame(() => addEnterAnimation());
  document.getElementById("shareBtn").addEventListener("click", shareResult);
}

export function initQuiz() {
  resetState();
  loadQuiz();
}

function shareResult() {
  const total = state.questions.length;
  const msg = getMessageForScore(state.score);
  const text = `Мой результат в DOWEN QUIZ: ${state.score}/${total}${
    msg ? ` — ${msg}` : ""
  }`;
  const shareData = { title: "DOWEN QUIZ", text };
  if (navigator.share) {
    navigator.share(shareData).catch((err) => console.warn("[share]", err));
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Текст скопирован в буфер обмена"))
      .catch(() => alert(text));
  } else {
    alert(text);
  }
}
