import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CandidatoService } from '../../../services/candidato.service';

@Component({
  selector: 'app-candidato-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './candidato-login.component.html',
  styleUrls: ['./candidato-login.component.css']
})
export class CandidatoLoginComponent implements OnInit {
  email = '';
  password = '';
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
    if (!this.email || !this.password) return;

    this.loading = true;
    this.errorMessage = '';

    this.candidatoService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Ocurrió un error al iniciar sesión.';
        console.error(err);
      }
    });
  }
}
