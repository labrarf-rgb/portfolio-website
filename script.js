document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    // Apply saved theme preference on load
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeToggle.setAttribute('aria-label', 'Toggle light mode');
        }
    }

    // Toggle theme mechanism
    themeToggle.addEventListener('click', () => {
        let theme = 'light';
        if (document.documentElement.getAttribute('data-theme') !== 'dark') {
            theme = 'dark';
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Toggle light mode' : 'Toggle dark mode');
    });

    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const response = await fetch('https://formspree.io/f/mlgvpwqy', {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            alert('Message sent!');
            contactForm.reset();
        } else {
            alert('Something went wrong. Please try again.');
        }
    });
});