document.addEventListener('DOMContentLoaded', function () {
  class OfferSlider {
    constructor(sliderElement) {
      this.slider = sliderElement;
      this.slides = this.slider.querySelectorAll('.offer-slide');
      this.dots = this.slider.querySelectorAll('.dot');
      this.prevBtn = this.slider.querySelector('.slider-prev');
      this.nextBtn = this.slider.querySelector('.slider-next');
      
      this.autoplay = this.slider.dataset.autoplay === 'true';
      this.autoplaySpeed = parseInt(this.slider.dataset.autoplaySpeed) || 3000;
      this.currentSlide = 0;
      this.totalSlides = this.slides.length;
      this.isTransitioning = false;
      this.autoplayInterval = null;
      
      this.init();
    }
    
    init() {
      // Show first slide
      this.showSlide(this.currentSlide);
      
      // Add event listeners
      this.addEventListeners();
      
      // Start autoplay if enabled
      if (this.autoplay && this.totalSlides > 1) {
        this.startAutoplay();
      }
    }
    
    addEventListeners() {
      // Navigation buttons
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => this.prevSlide());
      }
      
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => this.nextSlide());
      }
      
      // Dots navigation
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => this.goToSlide(index));
      });
      
      // Pause autoplay on hover
      this.slider.addEventListener('mouseenter', () => this.stopAutoplay());
      this.slider.addEventListener('mouseleave', () => {
        if (this.autoplay && this.totalSlides > 1) {
          this.startAutoplay();
        }
      });
      
      // Prevent rapid clicking
      this.slider.addEventListener('click', (e) => {
        if (this.isTransitioning) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }
    
    showSlide(index) {
      if (this.isTransitioning || index === this.currentSlide) return;
      
      this.isTransitioning = true;
      
      // Remove active classes
      this.slides.forEach(slide => slide.classList.remove('active'));
      this.dots.forEach(dot => dot.classList.remove('active'));
      
      // Add active classes
      this.slides[index].classList.add('active');
      this.dots[index].classList.add('active');
      
      this.currentSlide = index;
      
      // Enable transition completion
      setTimeout(() => {
        this.isTransitioning = false;
      }, 600); // Match CSS transition duration
    }
    
    nextSlide() {
      if (this.isTransitioning) return;
      
      const nextIndex = (this.currentSlide + 1) % this.totalSlides;
      this.showSlide(nextIndex);
      this.resetAutoplay();
    }
    
    prevSlide() {
      if (this.isTransitioning) return;
      
      const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
      this.showSlide(prevIndex);
      this.resetAutoplay();
    }
    
    goToSlide(index) {
      if (this.isTransitioning || index === this.currentSlide) return;
      
      this.showSlide(index);
      this.resetAutoplay();
    }
    
    startAutoplay() {
      this.stopAutoplay(); // Clear any existing interval
      
      if (this.autoplay && this.totalSlides > 1) {
        this.autoplayInterval = setInterval(() => {
          if (!this.isTransitioning) {
            this.nextSlide();
          }
        }, this.autoplaySpeed);
      }
    }
    
    stopAutoplay() {
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = null;
      }
    }
    
    resetAutoplay() {
      if (this.autoplay && this.totalSlides > 1) {
        this.stopAutoplay();
        this.startAutoplay();
      }
    }
  }
  
  // Initialize all sliders on the page
  const sliders = document.querySelectorAll('.offer-slider');
  sliders.forEach(slider => new OfferSlider(slider));
});
