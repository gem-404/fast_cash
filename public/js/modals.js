// modals.js - Handles all informational modals

export function initInfoModals() {
  // Initialize Privacy Policy Modal
  const privacyModal = document.getElementById('privacy-modal');
  if (privacyModal) {
    const showPrivacyLinks = document.querySelectorAll('.show-privacy-modal');
    const closePrivacyBtn = privacyModal.querySelector('.close-modal');
    const closePrivacyFooterBtn = privacyModal.querySelector('.close-privacy-modal');

    showPrivacyLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      });
    });

    closePrivacyBtn?.addEventListener('click', () => {
      privacyModal.style.display = 'none';
      document.body.style.overflow = '';
    });

    closePrivacyFooterBtn?.addEventListener('click', () => {
      privacyModal.style.display = 'none';
      document.body.style.overflow = '';
    });

    privacyModal.addEventListener('click', (e) => {
      if (e.target === privacyModal) {
        privacyModal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  // Initialize Rates & Fees Modal
  const ratesModal = document.getElementById('rates-modal');
  if (ratesModal) {
    const showRatesLinks = document.querySelectorAll('.show-rates-modal');
    const closeRatesBtn = ratesModal.querySelector('.close-modal');
    const closeRatesFooterBtn = ratesModal.querySelector('.close-rates-modal');

    showRatesLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        ratesModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
      });
    });

    closeRatesBtn?.addEventListener('click', () => {
      ratesModal.style.display = 'none';
      document.body.style.overflow = '';
    });

    closeRatesFooterBtn?.addEventListener('click', () => {
      ratesModal.style.display = 'none';
      document.body.style.overflow = '';
    });

    ratesModal.addEventListener('click', (e) => {
      if (e.target === ratesModal) {
        ratesModal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  // Initialize Terms & Conditions Modal
  const termsModal = document.getElementById('terms-modal');
  if (termsModal) {
    const showTermsLinks = document.querySelectorAll('.show-terms-modal');
    const closeTermsBtn = termsModal.querySelector('.close-modal');
    const closeTermsFooterBtn = termsModal.querySelector('.close-terms-modal');

    showTermsLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
      });
    });

    closeTermsBtn?.addEventListener('click', () => {
      termsModal.style.display = 'none';
      document.body.style.overflow = '';
    });

    closeTermsFooterBtn?.addEventListener('click', () => {
      console.log("hello fuckers!");
      termsModal.style.display = 'none';
      document.body.style.overflow = '';
    });

    termsModal.addEventListener('click', (e) => {
      if (e.target === termsModal) {
        termsModal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  // Close all modals when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => {
        if (modal.style.display === 'block') {
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }
  });
}
