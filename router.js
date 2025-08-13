import { initQuiz } from "./app.js";
import { initAdmin } from "./admin.js";

function route() {
  const cleanPath = location.pathname.replace(/\/+/g, "/").replace(/\/$/, "");
  const hash = (location.hash || "").toLowerCase();
  if (cleanPath.toLowerCase().endsWith("/admin") || hash === "#/admin") {
    initAdmin();
  } else {
    initQuiz();
  }
}

route();
window.addEventListener("popstate", route);
window.addEventListener("hashchange", route);
