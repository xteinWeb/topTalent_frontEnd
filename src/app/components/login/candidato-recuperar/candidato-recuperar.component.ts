import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CandidatoService } from '../../../services/candidato.service';

@Component({
  selector: 'app-candidato-recuperar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './candidato-recuperar.component.html',
  styleUrls: ['../candidato-login/candidato-login.component.css']
})
export class CandidatoRecuperarComponent implements OnInit {
  email = '';
  codigo = '';
  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  infoMessage = '';
  showCodigoStep = false;
  returnUrl = '';

  constructor(
    private candidatoService: CandidatoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/ofertas';
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  solicitarCodigo(): void {
    if (!this.email) return;

    this.loading = true;
    this.errorMessage = '';

    this.candidatoService.solicitarRecuperacion(this.email.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        this.infoMessage = res.message;
        this.showCodigoStep = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'No se pudo enviar el código. Intenta nuevamente.';
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

    this.candidatoService.restablecerPassword(this.email.trim(), this.codigo.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
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
