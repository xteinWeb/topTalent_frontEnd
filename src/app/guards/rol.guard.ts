import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Página de inicio según el rol: los líderes van a su panel; el resto, al dashboard.
export function inicioSegunRol(authService: AuthService): string {
  return authService.isLiderArea() ? '/mi-panel' : '/dashboard';
}

// Permite la ruta solo si el usuario cumple la condición de rol; si no, lo envía a su página de inicio.
// Se usa junto a authGuard, pero también manda al login a quien no ha iniciado sesión.
function permitirSi(condicion: (auth: AuthService) => boolean): CanActivateFn {
  return (): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if (!authService.isLoggedIn()) return router.createUrlTree(['/login']);
    return condicion(authService) ? true : router.createUrlTree([inicioSegunRol(authService)]);
  };
}

// Solo líderes de área
export const soloLiderGuard = permitirSi(auth => auth.isLiderArea());

// Talento Humano, Gerencia y Superadmin (todos menos los líderes)
export const sinLiderGuard = permitirSi(auth => !auth.isLiderArea());

// Talento Humano y Gerencia (incluye Superadmin)
export const thOGerenciaGuard = permitirSi(auth => auth.isTalentoHumano() || auth.isGerencia());

// Talento Humano (incluye Superadmin): gestión de usuarios
export const talentoHumanoGuard = permitirSi(auth => auth.isTalentoHumano());
