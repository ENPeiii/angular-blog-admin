import { Injectable } from '@angular/core';

interface JwtPayload {
  sub: string;
  name: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'admin_token';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const payload = this.decodePayload();
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }

  getUser(): { email: string; name: string } | null {
    const payload = this.decodePayload();
    if (!payload) return null;
    return { email: payload.sub, name: payload.name };
  }

  private decodePayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}
