import { initQuiz } from "./app.js";
import { initAdmin } from "./admin.js";

function route() {
  const path = location.pathname.replace(/\/+/g, "/");
  if (path.endsWith("/admin")) {
    initAdmin();
  } else {
    initQuiz();
  }
}

route();
window.addEventListener("popstate", route);
