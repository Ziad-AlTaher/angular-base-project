import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSliderComponent } from './components/hero-slider/hero-slider';
import { ContactSectionComponent } from './components/contact-section/contact-section';
import { BaseComponent } from '../../core/base/base.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroSliderComponent, ContactSectionComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent extends BaseComponent { }
