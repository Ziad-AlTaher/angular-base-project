import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from '../../../../core/base/base.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactMessage } from '../../../../core/models/contact-message.model';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.css'
})
export class ContactSectionComponent extends BaseComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);

  submitted = signal(false);

  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
  });

  /** Shorthand accessor for form controls */
  get f() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.contactForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.f).forEach(key => {
        this.f[key].markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    const formData: ContactMessage = this.contactForm.getRawValue();
    formData.address = formData.subject;
    this.contactService.create(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'success',
            detail: response.message || 'Message sent successfully!',
            life: 4000
          });
          this.contactForm.reset();
          this.submitted.set(false);
        },
        error: (err) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            detail: err.message || 'Something went wrong',
            life: 5000
          });
        }
      });
  }
}
