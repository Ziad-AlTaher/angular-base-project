import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../../core/base/base.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest, RegisterRequest } from '../../core/models/user.model';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { takeUntil } from 'rxjs';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslatePipe,
        InputTextModule,
        PasswordModule,
        ButtonModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './auth.html',
    styleUrl: './auth.css'
})
export class Auth extends BaseComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    /** URL to redirect to after successful login (set by authGuard) */
    private returnUrl: string = '/';

    activeTab = signal<'login' | 'register'>('login');
    submitted = signal(false);

    ngOnInit(): void {
        // Read the returnUrl query param passed by the auth guard
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    /** Login form */
    loginForm: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    /** Register form */
    registerForm: FormGroup = this.fb.group({
        fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    /** Shorthand for current form controls */
    get lf() { return this.loginForm.controls; }
    get rf() { return this.registerForm.controls; }

    switchTab(tab: 'login' | 'register'): void {
        this.activeTab.set(tab);
        this.submitted.set(false);
        this.error = null;
    }

    onLogin(): void {
        this.submitted.set(true);

        if (this.loginForm.invalid) {
            Object.keys(this.lf).forEach(key => this.lf[key].markAsTouched());
            return;
        }

        this.isLoading = true;
        const req: LoginRequest = this.loginForm.getRawValue();

        this.authService.login(req)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    this.messageService.add({
                        severity: 'success',
                        detail: 'Welcome back!',
                        life: 3000
                    });
                    setTimeout(() => this.router.navigateByUrl(this.returnUrl), 800);
                },
                error: (err) => {
                    this.isLoading = false;
                    const msg = err.message === 'INVALID_CREDENTIALS'
                        ? 'Invalid email or password'
                        : 'Something went wrong';
                    this.messageService.add({
                        severity: 'error',
                        detail: msg,
                        life: 4000
                    });
                }
            });
    }

    onRegister(): void {
        this.submitted.set(true);

        if (this.registerForm.invalid) {
            Object.keys(this.rf).forEach(key => this.rf[key].markAsTouched());
            return;
        }

        this.isLoading = true;
        const req: RegisterRequest = this.registerForm.getRawValue();

        this.authService.register(req)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    this.messageService.add({
                        severity: 'success',
                        detail: 'Account created successfully!',
                        life: 3000
                    });
                    setTimeout(() => this.router.navigateByUrl(this.returnUrl), 800);
                },
                error: (err) => {
                    this.isLoading = false;
                    const msg = err.message === 'EMAIL_EXISTS'
                        ? 'Email already registered'
                        : 'Something went wrong';
                    this.messageService.add({
                        severity: 'error',
                        detail: msg,
                        life: 4000
                    });
                }
            });
    }

    loginWithGoogle(): void {
        this.messageService.add({
            severity: 'info',
            detail: 'Google login coming soon!',
            life: 3000
        });
    }

    loginWithGitHub(): void {
        this.messageService.add({
            severity: 'info',
            detail: 'GitHub login coming soon!',
            life: 3000
        });
    }
}
