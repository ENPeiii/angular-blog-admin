import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from '../services/error.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/google');

      if (error.status === 401 && !isAuthEndpoint) {
        authService.clearToken();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!isAuthEndpoint) {
        const body = error.error;
        const isHtml = typeof body === 'string' && body.trimStart().startsWith('<');
        errorService.report(isHtml ? `HTTP ${error.status} 伺服器錯誤` : (body ?? error), req.url);
      }

      return throwError(() => error);
    })
  );
};
