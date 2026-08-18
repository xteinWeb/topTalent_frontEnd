import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CandidatoService } from '../../../services/candidato.service';

@Component({
  selector: 'app-candidato-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './candidato-registro.component.html',
  styleUrls: ['./candidato-registro.component.css']
})
export class CandidatoRegistroComponent implements OnInit {
  email = '';
  password = '';
  confirmPassword = '';
  verificationCode = '';
  showVerificationStep = false;
  loading = false;
  errorMessage = '';
  returnUrl = '';
  aceptoTratamientoDatos = false;
  showTratamientoDatosModal = false;

  constructor(
    private candidatoService: CandidatoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/ofertas';
  }

  openTratamientoDatosModal(event: Event): void {
    event.preventDefault();
    this.showTratamientoDatosModal = true;
  }

  closeTratamientoDatosModal(): void {
    this.showTratamientoDatosModal = false;
  }

  onSubmit(): void {
    if (!this.email || !this.password || !this.confirmPassword) return;

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.aceptoTratamientoDatos) {
      this.errorMessage = 'Debes aceptar el tratamiento de datos personales para registrarte.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.candidatoService.registro(this.email, this.password, this.aceptoTratamientoDatos).subscribe({
      next: (res) => {
        this.loading = false;
        this.showVerificationStep = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Ocurrió un error al registrar el usuario.';
        console.error(err);
      }
    });
  }

  verifyCode(): void {
    if (!this.verificationCode || this.verificationCode.trim().length !== 6) {
      this.errorMessage = 'Por favor ingresa el código de verificación de 6 dígitos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.candidatoService.verificarCodigo(this.email, this.verificationCode).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/candidato/perfil'], { queryParams: { returnUrl: this.returnUrl } });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'El código de verificación es incorrecto.';
        console.error(err);
      }
    });
  }
}
