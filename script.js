// Enhanced JavaScript for smooth transitions, dark mode toggle, interactive elements, analytics tracking, and improved navigation functionality

// Smooth transitions
function smoothScroll(target) {
    document.querySelector(target).scrollIntoView({
        behavior: 'smooth'
    });
}

// Dark mode toggle
const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    const mode = document.body.classList.contains('dark-mode') ? 'Dark' : 'Light';
    localStorage.setItem('mode', mode);
};

// Check for saved mode
document.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('mode');
    if (savedMode === 'Dark') {
        document.body.classList.add('dark-mode');
    }
});

// Set up interactive elements
const interactiveElements = document.querySelectorAll('.interactive');
interactiveElements.forEach(element => {
    element.addEventListener('click', () => {
        element.classList.toggle('active');
    });
});

// Analytics tracking
const trackEvent = (event) => {
    console.log(`Event tracked: ${event}`);
    // Here you can integrate your analytics service
};

// Improved navigation functionality
const navLinks = document.querySelectorAll('a.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        smoothScroll(targetId);
        trackEvent(`Navigated to ${targetId}`);
    });
});
