import { AuthService } from "./auth.js";
import { showDashboard } from "./dashboard.js";
import { showError } from "./uiHelpers.js";
import { setCurrentUser, hasActiveSession } from "./userState.js";

export function initAuth() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const authTabs = document.querySelectorAll(".auth-tab");
  const authForms = document.querySelectorAll(".auth-form");



  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      authTabs.forEach((t) => t.classList.remove("active"));
      authForms.forEach((f) => f.classList.remove("active"));
      tab.classList.add("active");
      const formId = `${tab.dataset.tab}-form`;
      document.getElementById(formId).classList.add("active");
    });
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const user = await AuthService.login({
        phone: document.getElementById("login-phone").value,
        password: document.getElementById("login-password").value,
      });
      setCurrentUser(user);
      loginForm.reset();
      showDashboard(user);
    } catch (error) {
      showError(error.message);
    }
  });

  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const userData = {
        fullName: document.getElementById("signup-name").value.trim(),
        phone: document.getElementById("signup-phone").value.trim(),
        nationalId: document.getElementById("signup-national-id").value.trim(),
        email: document.getElementById("signup-email").value.trim() || null,
        password: document.getElementById("signup-password").value,
      };
      const { userId } = await AuthService.register(userData);
      const user = { ...userData, id: userId };
      setCurrentUser(user);
      signupForm.reset();
      showDashboard(user);
    } catch (error) {
      showError(error.message);
    }
  });
}
