import { ApiService } from './apiService.js';
import { formatCurrency, calculateDaysRemaining } from './dataFormatters.js';


export function initDashboard() {
    const closeBtn = document.getElementById('close-dashboard');
    const overlay = document.getElementById('dashboard-overlay');
  
    closeBtn?.addEventListener('click', closeDashboard);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeDashboard();
    });
}

export function showDashboard(user) {

    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.remove('active');
    }

    const dashboard = document.getElementById('dashboard-overlay');

    document.getElementById('dashboard-name').textContent = user.full_name;
    document.getElementById('dashboard-phone').textContent = user.phone;
    document.getElementById('dashboard-national-id').textContent = user.national_id;
    document.getElementById('dashboard-email').textContent = user.email;

    updateDashboard(user.id);
    dashboard.style.display = 'block';
    document.body.classList.add('dashboard-open');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function updateDashboard(userId) {
    try {
      const user = await ApiService.getUser(userId);
      const loan = await ApiService.getActiveLoan(userId);
      const savings = await ApiService.getSavings(userId);
  
      document.getElementById('dashboard-name').textContent = user.full_name || 'Unknown';
      document.getElementById('dashboard-phone').textContent = user.phone || 'Not provided';
      document.getElementById('dashboard-national-id').textContent = user.national_id;
      document.getElementById('dashboard-email').textContent = user.email || 'Not provided';
  
      const loanInfo = document.getElementById('active-loan-info');
      if (loan) {
        loanInfo.innerHTML = `
          <h4>Active Loan</h4>
          <p>Amount: ${formatCurrency(loan.amount)}</p>
          <p>Term: ${loan.term} days</p>
          <p>Status: ${loan.status}</p>`;
      } else {
        loanInfo.innerHTML = '<p class="no-loan">No active loans</p>';
      }
  
      document.getElementById('savings-amount').textContent = formatCurrency(savings.balance || 0);
  
    } catch (error) {
      console.error("Dashboard error", error);
    }
}

function closeDashboard() {
    document.getElementById('dashboard-overlay').style.display = 'none';
    document.body.classList.remove('dashboard-open');
}
