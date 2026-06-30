import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { VacanteService, Vacante } from '../../services/vacante.service';

@Component({
  selector: 'app-oferta-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './oferta-detalle.component.html',
  styleUrls: ['./oferta-detalle.component.css']
})
export class OfertaDetalleComponent implements OnInit {
  vacanteId: string = '';
  vacante?: Vacante;
  loading: boolean = true;
  errorMsg: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vacanteService: VacanteService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.vacanteId = params['id'];
      if (this.vacanteId) {
        this.loadVacante(this.vacanteId);
      } else {
        this.errorMsg = 'ID de la vacante no especificado.';
        this.loading = false;
      }
    });
  }

  loadVacante(id: string): void {
    this.loading = true;
    this.vacanteService.getVacante(id).subscribe({
      next: (data) => {
        this.vacante = data;
        if (data.estado === 'INACTIVA') {
          this.errorMsg = 'Esta oferta laboral ya no se encuentra disponible.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'No se pudo cargar el detalle de la oferta de empleo.';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
