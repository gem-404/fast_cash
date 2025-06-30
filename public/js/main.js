import { initModals } from './modalController.js';
import { initAuth } from './authController.js';
import { initDashboard } from './dashboard.js';
import { initLoanApp } from './loanController.js';
import { initSavings } from './savingsController.js';
import { clearCurrentUser, hasActiveSession, getCurrentUser } from './userState.js';


function manageResponsiveElements() {
  const elements = {
    mobileNav: document.querySelector('.mobile-nav'),
    mobileHeader: document.querySelector('.mobile-header'),
    desktopNav: document.querySelector('.desktop-nav')
  };
  
  const isMobile = window.innerWidth < 993; // 992px and below is mobile
  
  // Toggle mobile elements
  if (elements.mobileNav) {
    elements.mobileNav.style.display = isMobile ? 'block' : 'none';
  }
  
  if (elements.mobileHeader) {
    elements.mobileHeader.style.display = isMobile ? 'block' : 'none';
  }
  
  // Optional: Toggle desktop nav in reverse
  if (elements.desktopNav) {
    elements.desktopNav.style.display = isMobile ? 'none' : 'flex';
  }
}

// Initialize and set up resize listener
function initResponsiveManager() {
  manageResponsiveElements();
  window.addEventListener('resize', manageResponsiveElements);
}

function initApp() {
    // Check for active session first
    if (hasActiveSession()) {
        const user = getCurrentUser();
        showDashboard(user);
        // Hide auth modal if it's visible
        document.getElementById('auth-modal').style.display = 'none';
    } else {
        // Show auth modal if no session exists
        document.getElementById('auth-modal').style.display = 'flex';
    }

    // Initialize all controllers
    initAuth();
    initLoanApp();
    initDashboard();
}

// Add logout functionality
document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearCurrentUser();
    window.location.reload(); // Refresh to show auth modal
});

// document.addEventListener('DOMContentLoaded', initApp);

document.addEventListener('DOMContentLoaded', () => {
  initResponsiveManager();
  initModals();
  initAuth();
  initDashboard();
  initLoanApp();
  initSavings();
});

