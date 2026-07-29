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
  loading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private candidatoService: CandidatoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/ofertas';
  }

  onSubmit(): void {
    if (!this.email || !this.password || !this.confirmPassword) return;

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.candidatoService.registro(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Ocurrió un error al registrar el usuario.';
        console.error(err);
      }
    });
  }
}
