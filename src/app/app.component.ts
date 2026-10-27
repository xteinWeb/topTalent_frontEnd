import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { SeoService } from './services/seo.service';
import { filter, map, startWith } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  showNavbar$: Observable<boolean>;
  menuAbierto = false;
  userMenuAbierto = false;

  constructor(public authService: AuthService, private router: Router, seoService: SeoService) {
    seoService.init();

    const isNotPublicRoute$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const url = this.router.url;
        return url !== '/' &&
               !url.startsWith('/ofertas') &&
               !url.startsWith('/oferta') &&
               !url.startsWith('/postular') &&
               !url.startsWith('/candidato') &&
               !url.startsWith('/prefiltro') &&
               !url.startsWith('/recuperar-password') &&
               !url.startsWith('/login');
      })
    );

    this.showNavbar$ = combineLatest([this.authService.isLoggedIn$, isNotPublicRoute$]).pipe(
      map(([isLoggedIn, isNotPublic]) => isLoggedIn && isNotPublic)
    );
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get iniciales(): string {
    const nombre: string = this.currentUser?.nombre || this.currentUser?.username || '';
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase() || '?';
  }

  get rolLegible(): string {
    if (this.authService.isSuperAdmin()) return 'Superadmin';
    const rol = this.currentUser?.role?.toUpperCase();
    if (rol === 'GERENCIA') return 'Gerencia';
    if (rol === 'LIDER_AREA') return 'Líder de área';
    if (rol === 'TALENTO_HUMANO' || rol === 'TALENTO') return 'Talento Humano';
    return rol || '';
  }

  // Cierra el menú de usuario al hacer clic fuera de él
  @HostListener('document:click')
  cerrarMenus(): void {
    this.userMenuAbierto = false;
  }

  logout(): void {
    this.userMenuAbierto = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
