import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { CandidatoService } from '../services/candidato.service';

// Endpoints que no llevan token: un 401 aquí es "credenciales incorrectas", no "sesión expirada"
const RUTAS_SIN_TOKEN = [
  '/auth/login', '/auth/recuperar', '/auth/restablecer', '/candidatos/login', '/candidatos/registro', '/candidatos/verificar',
  '/candidatos/recuperar', '/candidatos/restablecer'
];

// Adjunta el JWT correspondiente (admin o candidato) a cada petición hacia la API
// y cierra la sesión local cuando el backend responde 401 (token inválido o expirado).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  if (RUTAS_SIN_TOKEN.includes(path)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const candidatoService = inject(CandidatoService);
  const router = inject(Router);

  // Las rutas del candidato y el envío de una postulación usan la sesión del candidato; el resto, la administrativa
  const esRutaCandidato = path.startsWith('/candidatos/') || (path === '/postulaciones' && req.method === 'POST');
  const token = esRutaCandidato ? candidatoService.getToken() : authService.getToken();

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token) {
        if (esRutaCandidato) {
          candidatoService.logout();
          if (router.url.startsWith('/candidato/perfil')) {
            router.navigate(['/candidato/login'], { queryParams: { returnUrl: router.url } });
          }
        } else {
          authService.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
