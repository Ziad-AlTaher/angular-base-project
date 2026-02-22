import { Component, OnInit, OnDestroy, signal, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '../../../../core/base/base.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface Slide {
  id: number;
  image: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './hero-slider.html',
  styleUrl: './hero-slider.css'
})
export class HeroSliderComponent extends BaseComponent implements OnInit, OnDestroy {
  currentSlide = signal(0);
  slides: Slide[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80', // Replace with real images
      title: 'home.slider.slide1.title',
      description: 'home.slider.slide1.desc'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80',
      title: 'home.slider.slide2.title',
      description: 'home.slider.slide2.desc'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
      title: 'home.slider.slide3.title',
      description: 'home.slider.slide3.desc'
    }
  ];

  private intervalId: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    super();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoSlide();
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoSlide(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextSlide(): void {
    this.currentSlide.update(v => (v + 1) % this.slides.length);
  }

  prevSlide(): void {
    this.currentSlide.update(v => (v - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.stopAutoSlide();
    this.startAutoSlide(); // Restart timer on manual interaction
  }
}
