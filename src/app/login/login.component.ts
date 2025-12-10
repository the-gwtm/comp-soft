import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../theme.service';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  providers: [ThemeService],
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;

  constructor(public themeService: ThemeService, private router: Router) { }

  onSubmit(): void {
    // Placeholder for authentication logic
    console.log('Login submitted', {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    });
    this.router.navigate(['/dashboard']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
