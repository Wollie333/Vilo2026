/**
 * Navigation Module
 * Handles header navigation, mobile menu, and smooth scrolling
 */

export function initNavigation() {
  const header = document.getElementById('site-header');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');

  // Mobile menu toggle
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      if (mobileMenuBackdrop) {
        mobileMenuBackdrop.classList.remove('hidden');
      }
      document.body.style.overflow = 'hidden'; // Prevent scroll
    });
  }

  // Mobile menu close
  const closeMobileMenu = () => {
    if (mobileMenu) {
      mobileMenu.classList.remove('open');
    }
    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.classList.add('hidden');
    }
    document.body.style.overflow = ''; // Restore scroll
  };

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
  }

  // Close mobile menu on link click
  const mobileMenuLinks = mobileMenu?.querySelectorAll('a');
  mobileMenuLinks?.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Sticky header on scroll
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (header && !header.classList.contains('header-always-solid')) {
      if (currentScrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    lastScrollY = currentScrollY;
  });

  // Active link highlighting
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav__link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath === href || currentPath.endsWith(href))) {
      link.classList.add('active');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
