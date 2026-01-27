/**
 * Animations Module
 * Handles scroll animations and visual effects
 */

export function initAnimations() {
  // Scroll-triggered animations
  initScrollAnimations();

  // Staggered animations for lists/grids
  initStaggerAnimations();
}

/**
 * Initialize scroll-triggered fade-in animations
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        // Stop observing once animated (animate only once)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with animation classes
  document.querySelectorAll('[data-animate], .animate-on-scroll').forEach(el => {
    // Add initial state (opacity 0, transform)
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

    observer.observe(el);
  });
}

/**
 * Initialize staggered animations for grid/list items
 */
function initStaggerAnimations() {
  const grids = document.querySelectorAll('[data-stagger]');

  grids.forEach(grid => {
    const items = grid.children;
    const delay = parseInt(grid.dataset.stagger) || 100; // Default 100ms delay

    Array.from(items).forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = `opacity 0.5s ease-out ${index * delay}ms, transform 0.5s ease-out ${index * delay}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          Array.from(entry.target.children).forEach(item => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(grid);
  });
}

/**
 * Add animated class styles when element becomes visible
 */
document.addEventListener('DOMContentLoaded', () => {
  // Add CSS for animated state
  const style = document.createElement('style');
  style.textContent = `
    .animated {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
});
