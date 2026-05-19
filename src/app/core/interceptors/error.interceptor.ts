import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from '../services/error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error;
      // 後端回傳 HTML（如 Express 404 頁）時，改顯示狀態碼避免原始 HTML 外露
      const isHtml = typeof body === 'string' && body.trimStart().startsWith('<');
      errorService.report(isHtml ? `HTTP ${error.status} 伺服器錯誤` : (body ?? error), req.url);
      return throwError(() => error);
    })
  );
};
