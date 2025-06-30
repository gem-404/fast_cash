import { ApiService } from './apiService.js';
import { showError, showSuccess } from './uiHelpers.js';
import { getCurrentUser } from './userState.js';


export function initLoanApp() {
    // Initialize loan form submission
    const loanForm = document.getElementById('loan-form');
    loanForm?.addEventListener('submit', handleLoanSubmit);
    
    // Initialize new loan button from dashboard
    const newLoanBtn = document.getElementById('new-loan-btn');
    newLoanBtn?.addEventListener('click', () => {
	const user = getCurrentUser();
	if (user) {
		showLoanApplication(user);
	} else {
		showError('Please login first');
		document.getElementById('auth-modal').classList.add('active');
	}
    });
    
    // Initialize close button
    const closeBtn = document.querySelector('#loan-application-overlay .close-btn');
    closeBtn?.addEventListener('click', closeLoanModal);
}


async function handleLoanSubmit(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
	showError("Session Expired! Please Login Again.");
    }

    try {
        const loanData = {
            userId: user.id,
            amount: parseInt(document.getElementById('loan-amount').value),
            term: parseInt(document.getElementById('loan-term').value)
        };

        const result = await ApiService.applyForLoan(loanData.userId, loanData.amount, loanData.term);
        closeLoanModal();
        showSuccess('Loan application submitted successfully!');
        // Refresh dashboard data
        if (window.updateDashboard) {
            await window.updateDashboard(user.id);
        }
    } catch (error) {
        showError(error.message);
    }
}


function showLoanApplication(user) {
    document.getElementById('user-full-name').textContent = user.full_name;
    document.getElementById('user-phone').textContent = user.phone;
    document.getElementById('loan-application-overlay').style.display = 'flex';
    document.getElementById('loan-amount').focus();
}


function closeLoanModal() {
    document.getElementById('loan-application-overlay').style.display = 'none';
    document.getElementById('loan-form').reset();
}
