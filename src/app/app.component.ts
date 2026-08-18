import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
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

  constructor(private authService: AuthService, private router: Router) {
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
               !url.startsWith('/login');
      })
    );

    this.showNavbar$ = combineLatest([this.authService.isLoggedIn$, isNotPublicRoute$]).pipe(
      map(([isLoggedIn, isNotPublic]) => isLoggedIn && isNotPublic)
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
