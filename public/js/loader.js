document.addEventListener('DOMContentLoaded', async function() {
    const app = document.getElementById('app');
    
    // Load and inject HTML partials
    const templates = await Promise.all([
        fetch('partials/header.html').then(r => r.text()),
        fetch('partials/dashboard.html').then(r => r.text()),
        fetch('partials/loan-application.html').then(r => r.text()),
        fetch('partials/main.html').then(r => r.text()),
        fetch('partials/footer.html').then(r => r.text()),
        fetch('partials/auth-modal.html').then(r => r.text()),
        fetch('partials/savings-modal.html').then(r => r.text()),
        fetch('partials/success-modal.html').then(r => r.text()),
        fetch('partials/terms-modal.html').then(r => r.text())
    ]);
    
    app.innerHTML = templates.join('');
    
    // Now load and execute your scripts in order
    const scripts = [
        'js/apiService.js',
        'js/loanService.js', 
        'js/auth.js',
        'js/main.js'
    ];
    
    for (const src of scripts) {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'module';
        document.body.appendChild(script);
    }

});
