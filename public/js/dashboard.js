import { ApiService } from "./apiService.js";
import { formatCurrency, calculateDaysRemaining } from "./dataFormatters.js";

export function initDashboard() {
  const closeBtn = document.getElementById("close-dashboard");
  const overlay = document.getElementById("dashboard-overlay");

  closeBtn?.addEventListener("click", closeDashboard);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeDashboard();
  });
}

export function showDashboard(user) {
  const authModal = document.getElementById("auth-modal");
  if (authModal) {
    authModal.classList.remove("active");
  }

  const dashboard = document.getElementById("dashboard-overlay");

  document.getElementById("dashboard-name").textContent = user.full_name;
  document.getElementById("dashboard-phone").textContent = user.phone;
  document.getElementById("dashboard-national-id").textContent =
    user.national_id;
  document.getElementById("dashboard-email").textContent = user.email;

  updateDashboard(user.id);
  dashboard.style.display = "block";
  document.body.classList.add("dashboard-open");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export async function updateDashboard(userId) {
  try {
    const user = await ApiService.getUser(userId);
    const loan = await ApiService.getActiveLoan(userId);
    const savings = await ApiService.getSavings(userId);

    // Update user info...
    document.getElementById("dashboard-name").textContent =
      user.full_name || "Unknown";
    document.getElementById("dashboard-phone").textContent =
      user.phone || "Not provided";
    document.getElementById("dashboard-national-id").textContent =
      user.national_id;
    document.getElementById("dashboard-email").textContent =
      user.email || "Not provided";

    // Calculate loan limits
    const savingsBalance = savings.balance || 0;
    const maxLoanLimit = savingsBalance * 3.33; // 333% of savings
    const currentLoanAmount = loan?.amount || 0;
    const availableLimit = Math.max(0, maxLoanLimit - currentLoanAmount);

    // Calculate next loan availability
    let nextLoanAvailability = "0";
    if (loan?.status === "pending") {
      nextLoanAvailability = "7";
    } else if (loan?.status === "active") {
      // Assuming loan term is in days
      const termEndDate = new Date(loan.created_at);
      termEndDate.setDate(termEndDate.getDate() + (loan.term || 30));
      const daysLeft = Math.ceil(
        (termEndDate - new Date()) / (1000 * 60 * 60 * 24),
      );
      nextLoanAvailability = daysLeft > 0 ? `${daysLeft} days` : "Now";
    }

    // Update loan info
    const loanInfo = document.getElementById("active-loan-info");
    if (loan && (loan.status === "active" || loan.status === "pending")) {
      loanInfo.innerHTML = `
          <h4>${loan.status === "pending" ? "Pending" : "Active"} Loan</h4>
          <p>Amount: ${formatCurrency(loan.amount)}</p>
          <p>Term: ${loan.term} days</p>
          <p>Status: ${loan.status}</p>`;
    } else {
      loanInfo.innerHTML = '<p class="no-loan">No active loans</p>';
    }

    // Update savings and limits
    document.getElementById("savings-amount").textContent =
      formatCurrency(savingsBalance);
    document.getElementById("available-limit").textContent =
      formatCurrency(availableLimit);
    document.getElementById("next-loan-days").textContent =
      nextLoanAvailability;
  } catch (error) {
    console.error("Dashboard error", error);
  }
}

function closeDashboard() {
  document.getElementById("dashboard-overlay").style.display = "none";
  document.body.classList.remove("dashboard-open");
}
