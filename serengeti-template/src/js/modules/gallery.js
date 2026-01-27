/**
 * Gallery Carousel Module
 * Handles image carousel functionality with auto-play and navigation
 */

export function initGallery() {
  const carousel = document.getElementById('gallery-carousel');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  let currentSlide = 0;
  let autoPlayInterval;

  // Show specific slide
  function showSlide(index) {
    // Wrap around
    if (index >= slides.length) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slides.length - 1;
    } else {
      currentSlide = index;
    }

    // Update slides
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });

    // Update dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  // Next slide
  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  // Previous slide
  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  // Auto-play functionality
  function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
  }

  // Event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      stopAutoPlay();
      startAutoPlay(); // Restart auto-play after manual navigation
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      stopAutoPlay();
      startAutoPlay(); // Restart auto-play after manual navigation
    });
  }

  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      stopAutoPlay();
      startAutoPlay(); // Restart auto-play after manual navigation
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!carousel) return;

    if (e.key === 'ArrowLeft') {
      prevSlide();
      stopAutoPlay();
      startAutoPlay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      stopAutoPlay();
      startAutoPlay();
    }
  });

  // Touch/swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold) {
      // Swipe left - next slide
      nextSlide();
      stopAutoPlay();
      startAutoPlay();
    } else if (touchEndX - touchStartX > swipeThreshold) {
      // Swipe right - previous slide
      prevSlide();
      stopAutoPlay();
      startAutoPlay();
    }
  }

  // Pause auto-play on hover
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);

  // Initialize
  showSlide(0);
  startAutoPlay();
}

/**
 * Image Lightbox Module
 * Opens images in a fullscreen lightbox with navigation
 */
export function initLightbox() {
  // Create lightbox HTML
  const lightboxHTML = `
    <div id="image-lightbox" class="fixed inset-0 bg-black/95 z-[100] hidden items-center justify-center">
      <!-- Close button -->
      <button id="lightbox-close" class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10">
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Previous button -->
      <button id="lightbox-prev" class="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Next button -->
      <button id="lightbox-next" class="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <!-- Image container -->
      <div class="max-w-7xl max-h-[90vh] mx-auto px-16">
        <img id="lightbox-image" src="" alt="" class="max-w-full max-h-[90vh] object-contain">
      </div>

      <!-- Image counter -->
      <div id="lightbox-counter" class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-lg"></div>
    </div>
  `;

  // Add lightbox to body
  document.body.insertAdjacentHTML('beforeend', lightboxHTML);

  const lightbox = document.getElementById('image-lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxCounter = document.getElementById('lightbox-counter');

  let currentImageIndex = 0;
  let images = [];

  // Find all gallery images with cursor-pointer class
  const galleryImages = document.querySelectorAll('img.cursor-pointer');

  if (galleryImages.length === 0) return;

  // Store image sources
  images = Array.from(galleryImages).map(img => ({
    src: img.src,
    alt: img.alt
  }));

  // Add click handlers to gallery images
  galleryImages.forEach((img, index) => {
    img.addEventListener('click', () => {
      openLightbox(index);
    });
  });

  function openLightbox(index) {
    currentImageIndex = index;
    updateLightboxImage();
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = '';
  }

  function updateLightboxImage() {
    const currentImage = images[currentImageIndex];
    lightboxImage.src = currentImage.src;
    lightboxImage.alt = currentImage.alt;
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
  }

  function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    updateLightboxImage();
  }

  function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    updateLightboxImage();
  }

  // Event listeners
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', showNextImage);
  lightboxPrev.addEventListener('click', showPrevImage);

  // Close on background click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      }
    }
  });
}
