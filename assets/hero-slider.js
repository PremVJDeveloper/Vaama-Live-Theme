class HeroSlider {
  constructor(sliderElement) {
    this.slider = sliderElement;
    this.sectionId = sliderElement.dataset.sectionId;
    this.slidesContainer = document.getElementById(`hero-slides-${this.sectionId}`);
    this.controlsContainer = document.getElementById(`hero-controls-${this.sectionId}`);
    this.autoplayToggle = document.getElementById(`autoplay-toggle-${this.sectionId}`);
    this.autoplayText = document.getElementById(`autoplay-text-${this.sectionId}`);
    
    // Get settings from data attributes
    this.autoplayEnabled = this.slider.dataset.autoplayEnabled === 'true';
    this.autoplaySpeed = parseInt(this.slider.dataset.autoplaySpeed) || 5000;
    this.showAutoplayToggle = this.slider.dataset.showAutoplayToggle === 'true';
    
    // Get slide data from JSON
    this.slides = this.getSlideData();
    
    this.currentSlide = 0;
    this.autoplayInterval = null;
    this.isAutoplayActive = this.autoplayEnabled;
    this.isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    this.init();
  }

  getSlideData() {
    const slideDataElement = document.getElementById(`slide-data-${this.sectionId}`);
    if (slideDataElement) {
      try {
        return JSON.parse(slideDataElement.textContent);
      } catch (e) {
        console.error('Error parsing slide data:', e);
      }
    }
    
    // Fallback default slides
    return [
      {
        desktopSrc: window.shopifyFallbackDesktop,
        mobileSrc: window.shopifyFallbackMobile,
        alt: "Default slide 1"
      },
      {
        desktopSrc: window.shopifyFallbackDesktop,
        mobileSrc: window.shopifyFallbackMobile,
        alt: "Default slide 2"
      }
    ];
  }

  init() {
    this.createSlides();
    this.bindEvents();
    if (this.isAutoplayActive) this.startAutoplay();
    this.updateAutoplayToggle();
  }

  createSlides() {
    this.slides.forEach((slide, index) => {
      // Create slide element
      const slideElement = document.createElement('div');
      slideElement.className = `hero-slider__slide ${index === 0 ? 'active' : ''}`;
      
      const src = this.isMobile ? slide.mobileSrc : slide.desktopSrc;
      slideElement.innerHTML = `<img src="${src}" alt="${slide.alt}" loading="lazy">`;
      
      this.slidesContainer.appendChild(slideElement);
      
      // Create indicator
      const indicator = document.createElement('button');
      indicator.className = `hero-slider__btn ${index === 0 ? 'active' : ''}`;
      indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
      indicator.addEventListener('click', () => this.goToSlide(index));
      this.controlsContainer.appendChild(indicator);
    });
  }

  bindEvents() {
    // Navigation buttons
    this.slider.querySelector('.next').addEventListener('click', () => this.nextSlide());
    this.slider.querySelector('.prev').addEventListener('click', () => this.prevSlide());
    
    // Autoplay toggle
    if (this.autoplayToggle) {
      this.autoplayToggle.addEventListener('click', () => this.toggleAutoplay());
    }
    
    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoplay();
      } else if (this.isAutoplayActive) {
        this.startAutoplay();
      }
    });
    
    // Responsive handling
    window.addEventListener('resize', () => {
      const newIsMobile = window.matchMedia("(max-width: 768px)").matches;
      
      if (newIsMobile !== this.isMobile) {
        this.isMobile = newIsMobile;
        this.updateSlideImages();
      }
    });
  }

  updateSlideImages() {
    this.slidesContainer.querySelectorAll('.hero-slider__slide img').forEach((img, index) => {
      const slide = this.slides[index];
      if (slide) {
        img.src = this.isMobile ? slide.mobileSrc : slide.desktopSrc;
      }
    });
  }

  goToSlide(index) {
    // Update slides
    this.slidesContainer.querySelectorAll('.hero-slider__slide').forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    
    // Update indicators
    this.controlsContainer.querySelectorAll('.hero-slider__btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
    
    this.currentSlide = index;
    this.resetAutoplay();
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  startAutoplay() {
    if (this.isAutoplayActive && this.slides.length > 1) {
      this.autoplayInterval = setInterval(() => this.nextSlide(), this.autoplaySpeed);
    }
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  resetAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  toggleAutoplay() {
    this.isAutoplayActive = !this.isAutoplayActive;
    this.updateAutoplayToggle();
    
    if (this.isAutoplayActive) {
      this.startAutoplay();
    } else {
      this.stopAutoplay();
    }
  }

  updateAutoplayToggle() {
    if (this.autoplayText) {
      this.autoplayText.textContent = this.isAutoplayActive ? 'ON' : 'OFF';
    }
  }
}

// Initialize all hero sliders on the page
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.hero-slider[data-section-id]').forEach(sliderElement => {
    new HeroSlider(sliderElement);
  });
});