import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacanteService, Vacante } from '../../services/vacante.service';
import { CandidatoService } from '../../services/candidato.service';

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
  completitudPorcentaje: number | null = null;
  candidatoNombre: string = '';

  constructor(
    private vacanteService: VacanteService,
    private candidatoService: CandidatoService,
    private router: Router
  ) {}

  isCandidatoLoggedIn(): boolean {
    return this.candidatoService.isLoggedIn();
  }

  getCandidatoEmail(): string {
    return this.candidatoService.getCurrentUser()?.email || '';
  }

  logoutCandidato(): void {
    this.candidatoService.logout();
    this.completitudPorcentaje = null;
    this.candidatoNombre = '';
    this.router.navigate(['/ofertas']);
  }

  ngOnInit(): void {
    this.loadVacantes();
    this.checkPerfilCompletitud();
  }

  checkPerfilCompletitud(): void {
    if (this.isCandidatoLoggedIn()) {
      this.candidatoService.getPerfil().subscribe({
        next: (profile) => {
          let nombre = '';
          let estudios: any[] = [];
          let experiencias: any[] = [];
          let idiomas: any[] = [];
          let habilidades: any = { tecnicas: [], interpersonales: [], otros: [] };
          let archivoNombre = profile.hv_archivo_nombre || '';

          let telefono = '';
          if (profile.perfil_completo_json) {
            let p = profile.perfil_completo_json;
            if (typeof p === 'string') {
              try { p = JSON.parse(p); } catch(e) {}
            }
            nombre = p.nombre_completo || '';
            telefono = p.telefono || '';
            estudios = p.estudios || [];
            experiencias = p.experiencias || [];
            idiomas = p.idiomas || [];
            habilidades = p.habilidades || { tecnicas: [], interpersonales: [], otros: [] };
          }

          this.candidatoNombre = nombre || this.getCandidatoEmail().split('@')[0];

          // Calcular porcentaje
          let puntos = 0;
          if (nombre.trim()) puntos += 10;
          if (profile.email && profile.email.trim()) puntos += 10;
          if (telefono.trim()) puntos += 10;
          if (archivoNombre) puntos += 10;

          if (estudios.length > 0) puntos += 20;
          if (experiencias.length > 0) puntos += 20;
          let habs = (habilidades.tecnicas.length > 0 || habilidades.interpersonales.length > 0 || habilidades.otros.length > 0);
          if (habs || idiomas.length > 0) puntos += 20;

          this.completitudPorcentaje = puntos;
        },
        error: (err) => console.error('Error al evaluar completitud:', err)
      });
    }
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
