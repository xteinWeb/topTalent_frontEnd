import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CandidatoService } from '../services/candidato.service';

export const candidatoAuthGuard: CanActivateFn = (route, state) => {
  const candidatoService = inject(CandidatoService);
  const router = inject(Router);

  if (candidatoService.isLoggedIn()) {
    return true;
  }

  // Redirect to candidato login with return URL
  router.navigate(['/candidato/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
