export function initModals() {
    initMobileMenu();
    const authModal = document.getElementById('auth-modal');

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            authModal?.classList.remove('active');
        });
    });

    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
    });

    document.querySelectorAll('.apply-now-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            authModal?.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal?.classList.contains('active')) {
            authModal.classList.remove('active');
        }
    });

}

function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const header = document.querySelector('header');
    let scrollTimer;

    // Toggle menu function
    const toggleMenu = (shouldOpen = null) => {
        const isOpening = shouldOpen ?? !mobileNav.classList.contains('active');
        mobileNav.classList.toggle('active', isOpening);
        mobileMenuBtn.innerHTML = isOpening 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    };

    // Toggle menu on button click
    mobileMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent this click from triggering document click
        toggleMenu();
    });

    // Close on scroll
    window.addEventListener('scroll', () => {
        if (mobileNav.classList.contains('active')) {
            header.classList.add('scrolling');
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                toggleMenu(false);
                header.classList.remove('scrolling');
            }, 200);
        }
    });

    // Close when clicking on links
    mobileNav?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggleMenu(false);
        });
    });

    // Close when clicking anywhere outside nav
    document.addEventListener('click', (e) => {
        const isClickInsideNav = mobileNav?.contains(e.target);
        const isClickOnMenuButton = mobileMenuBtn?.contains(e.target);
        
        if (mobileNav.classList.contains('active') && !isClickInsideNav && !isClickOnMenuButton) {
            toggleMenu(false);
        }
    });

    // Prevent clicks inside nav from closing it
    mobileNav?.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}


