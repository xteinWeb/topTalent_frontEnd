import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';

@Component({
  selector: 'app-ofertas-publicas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ofertas-publicas-list.component.html',
  styleUrls: ['./ofertas-publicas-list.component.css']
})
export class OfertasPublicasListComponent implements OnInit {
  vacantes: Vacante[] = [];
  filteredVacantes: Vacante[] = [];
  selectedVacante: Vacante | null = null;

  // Search & Filter fields
  searchCargo: string = '';
  searchUbicacion: string = '';
  selectedModalidad: string = '';
  selectedContrato: string = '';

  loading: boolean = true;
  errorMsg: string = '';

  constructor(
    private vacanteService: VacanteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVacantes();
  }

  loadVacantes(): void {
    this.loading = true;
    this.vacanteService.getVacantesActivas().subscribe({
      next: (data) => {
        this.vacantes = data;
        this.filterVacantes();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar las ofertas de empleo disponibles.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterVacantes(): void {
    const termCargo = this.searchCargo.toLowerCase().trim();

    this.filteredVacantes = this.vacantes.filter(v => {
      return !termCargo || 
        v.titulo.toLowerCase().includes(termCargo) || 
        v.descripcion.toLowerCase().includes(termCargo) ||
        (v.perfil_cargo && v.perfil_cargo.toLowerCase().includes(termCargo));
    });

    if (this.filteredVacantes.length > 0) {
      if (!this.selectedVacante || !this.filteredVacantes.find(v => v.id === this.selectedVacante?.id)) {
        this.selectedVacante = this.filteredVacantes[0];
      }
    } else {
      this.selectedVacante = null;
    }
  }

  selectVacante(vacante: Vacante): void {
    if (window.innerWidth <= 768) {
      this.router.navigate(['/oferta', vacante.id]);
    } else {
      this.selectedVacante = vacante;
    }
  }

  setModalidadFilter(mod: string): void {
    this.selectedModalidad = this.selectedModalidad === mod ? '' : mod;
    this.filterVacantes();
  }

  setContratoFilter(con: string): void {
    this.selectedContrato = this.selectedContrato === con ? '' : con;
    this.filterVacantes();
  }

  clearFilters(): void {
    this.searchCargo = '';
    this.searchUbicacion = '';
    this.selectedModalidad = '';
    this.selectedContrato = '';
    this.filterVacantes();
  }

  compartirVacante(vacante: Vacante | null): void {
    if (!vacante || !vacante.id) return;
    const shareUrl = `${window.location.origin}/oferta/${vacante.id}`;
    const shareData = {
      title: `Vacante: ${vacante.titulo} - Artdecon`,
      text: `Te comparto esta oferta laboral en Artdecon: ${vacante.titulo}`,
      url: shareUrl
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        this.copiarAlPortapapeles(shareUrl);
      });
    } else {
      this.copiarAlPortapapeles(shareUrl);
    }
  }

  private copiarAlPortapapeles(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('¡Enlace de la vacante copiado al portapapeles!');
    }).catch(() => {
      // Fallback
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('¡Enlace de la vacante copiado al portapapeles!');
    });
  }
}
