import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AppService } from '../../../../services/app.service';
import { AuthService } from '../../../../services/auth.service';
import { NgIf, NgFor } from '@angular/common';

interface Particle {
  style: string;
}

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
})
export class SigninPage implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  showPassword = false;
  particles: Particle[] = [];

  constructor(
    private fb: FormBuilder,
    private appService: AppService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.appService
      .auth()
      .subscribe({
        next: (auth) => this.router.navigate(['/admin/cars']),
        error: () => {
          this.authService.logout();
        }
      });
  }

  ngOnInit() {
    this.createParticles();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  createParticles() {
    for (let i = 0; i < 20; i++) {
      const particle: Particle = {
        style: `
          position: absolute;
          width: ${Math.random() * 4 + 2}px;
          height: ${Math.random() * 4 + 2}px;
          background: var(--lion-gold);
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
          animation-delay: ${Math.random() * 2}s;
          opacity: ${Math.random() * 0.5 + 0.3};
        `
      };
      this.particles.push(particle);
    }
  }

  signin() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.appService.signin(this.form.value).subscribe({
      next: (res) => {
        this.authService.setToken(res.AUTH_KEY);
        this.router.navigate(['/admin/cars']);
      },
      error: () => {
        this.error = 'Неверный логин или пароль';
        this.loading = false;
      },
    });
  }
}
