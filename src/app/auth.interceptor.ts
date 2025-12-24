import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthState } from './auth-state';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthState);
  const token = auth.accessToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
