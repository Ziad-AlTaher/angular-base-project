import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceCard } from '../../../core/models/service-card.model';

@Component({
    selector: 'app-service-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './service-card.html',
    styleUrl: './service-card.css'
})
export class ServiceCardComponent {
    @Input({ required: true }) card!: ServiceCard;
    @Input() clickable = true;

    @Output() cardClick = new EventEmitter<ServiceCard>();

    onCardClick(): void {
        if (this.clickable) {
            this.cardClick.emit(this.card);
        }
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'assets/images/placeholder-book.svg';
    }
}
