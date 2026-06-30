import { ChangeDetectionStrategy, Component, AfterViewInit, inject, NgZone, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

declare const google: {
  accounts: {
    id: {
      initialize: (config: object) => void;
      renderButton: (el: HTMLElement | null, config: object) => void;
    };
  };
};

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements AfterViewInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  isLoading = signal(false);
  error = signal<string | null>(null);

  ngAfterViewInit(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.ngZone.run(() => this.onGoogleCallback(response));
      },
    });
    google.accounts.id.renderButton(document.getElementById('google-signin-btn'), {
      theme: 'outline',
      size: 'large',
      width: 300,
      locale: 'zh-TW',
    });
  }

  private onGoogleCallback(response: { credential: string }): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http
      .post<{ token: string }>(`${environment.apiBaseUrl}/auth/google`, {
        credential: response.credential,
      })
      .subscribe({
        next: (res) => {
          this.authService.setToken(res.token);
          this.router.navigate(['/']);
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set('登入失敗，此 Google 帳號無管理員權限。');
        },
      });
  }
}
