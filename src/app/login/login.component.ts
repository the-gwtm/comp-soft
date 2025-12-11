import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../theme.service';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  providers: [ThemeService],
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  rememberMe = false;

  constructor(
    public themeService: ThemeService, 
    private router: Router,
    private apiService: ApiService
  ) { }

  onSubmit(): void {
    if(this.username.trim() === '' || this.password.trim() === '') {
      this.apiService.showMessage('error', 'Error', 'Please enter both username and password.');
      return;
    }else if(this.username !== 'admin' || this.password !== 'admin') {
      this.apiService.showMessage('error', 'Error', 'Invalid username or password.');
      return;
    }
    // Placeholder for authentication logic
    console.log('Login submitted', {
      username: this.username,
      password: this.password,
      rememberMe: this.rememberMe
    });
    this.router.navigate(['/dashboard']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
