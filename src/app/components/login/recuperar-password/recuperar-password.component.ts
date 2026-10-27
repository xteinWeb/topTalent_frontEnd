import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

// Recuperación de contraseña de usuarios internos (Talento Humano, Gerencia, líderes de área)
@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['../login.component.css']
})
export class RecuperarPasswordComponent implements OnInit {
  usuario = '';
  codigo = '';
  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  infoMessage = '';
  showCodigoStep = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.usuario = this.route.snapshot.queryParams['usuario'] || '';
  }

  solicitarCodigo(): void {
    if (!this.usuario.trim()) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.solicitarRecuperacion(this.usuario.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        this.infoMessage = res.message;
        this.showCodigoStep = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'No se pudo enviar el código. Inténtelo de nuevo.';
      }
    });
  }

  restablecer(): void {
    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.restablecerPassword(this.usuario.trim(), this.codigo.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        // Misma redirección por rol que el login
        this.router.navigate([this.authService.isLiderArea() ? '/mi-panel' : '/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'No se pudo restablecer la contraseña.';
      }
    });
  }

  volver(): void {
    this.showCodigoStep = false;
    this.codigo = '';
    this.errorMessage = '';
    this.infoMessage = '';
  }
}
