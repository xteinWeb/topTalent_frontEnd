import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostulacionService, Postulacion } from '../../services/postulacion.service';
import { VacanteService, Vacante } from '../../services/vacante.service';

@Component({
  selector: 'app-postulacion-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './postulacion-list.component.html',
  styleUrls: ['./postulacion-list.component.css']
})
export class PostulacionListComponent implements OnInit {
  postulaciones: Postulacion[] = [];
  filteredPostulaciones: Postulacion[] = [];
  vacantes: Vacante[] = [];
  selectedVacanteId: string = '';
  loading: boolean = true;
  errorMsg: string = '';
  ejecutandoValidacion: boolean = false;
  validacionErrorMsg: string = '';

  // Modal / Detail view
  selectedCandidate?: Postulacion;

  constructor(
    private route: ActivatedRoute,
    private postulacionService: PostulacionService,
    private vacanteService: VacanteService
  ) { }

  ngOnInit(): void {
    this.loadVacantes();

    // Check if we are filtering by vacancy from route parameters
    this.route.params.subscribe(params => {
      if (params['vacanteId']) {
        this.selectedVacanteId = params['vacanteId'];
      }
      this.loadPostulaciones();
    });
  }

  loadVacantes(): void {
    this.vacanteService.getVacantes().subscribe({
      next: (data) => {
        this.vacantes = data;
      },
      error: (err) => {
        console.error('Error al cargar vacantes:', err);
      }
    });
  }

  loadPostulaciones(): void {
    this.loading = true;
    this.errorMsg = '';

    const request$ = this.selectedVacanteId
      ? this.postulacionService.getPostulacionesPorVacante(this.selectedVacanteId)
      : this.postulacionService.getPostulaciones();

    request$.subscribe({
      next: (data) => {
        // Parsear respuesta_ia y json_analisis_ia si vienen como string
        const parsedData = data.map(item => {
          const rawRespuesta = item.respuesta_ia as any;
          if (rawRespuesta && typeof rawRespuesta === 'string') {
            const jsonStr = rawRespuesta.trim();

            try {
              item.respuesta_ia = JSON.parse(jsonStr);
            } catch (e) {
              // Intento de autoreparación si falta la llave de cierre
              if (jsonStr.startsWith('{') && !jsonStr.endsWith('}')) {
                try {
                  item.respuesta_ia = JSON.parse(jsonStr + '\n}');
                } catch (retryError) {
                  console.error('Error al intentar reparar y parsear respuesta_ia:', retryError);
                  item.respuesta_ia = undefined;
                }
              } else {
                console.error('Error al parsear respuesta_ia:', e);
                item.respuesta_ia = undefined;
              }
            }
          }

          const rawAnalisis = item.json_analisis_ia as any;
          if (rawAnalisis && typeof rawAnalisis === 'string') {
            try {
              item.json_analisis_ia = JSON.parse(rawAnalisis);
            } catch (e) {
              console.error('Error al parsear json_analisis_ia:', e);
              item.json_analisis_ia = undefined;
            }
          }

          return item;
        });

        // Orden por posición (1 = mejor ubicado), agrupado por vacante.
        // Sin posición asignada (null/undefined) se considera descartado y va al final.
        const sortedData = parsedData.sort((a, b) => {
          const vacanteCompare = (a.vacante_titulo || '').localeCompare(b.vacante_titulo || '');
          if (vacanteCompare !== 0) return vacanteCompare;

          const posA = a.posicion ?? null;
          const posB = b.posicion ?? null;
          if (posA === null && posB === null) return 0;
          if (posA === null) return 1;
          if (posB === null) return -1;
          return posA - posB;
        });
        this.postulaciones = sortedData;
        this.filteredPostulaciones = sortedData;
        console.log('Candidatos cargados y procesados:', sortedData);
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al obtener la lista de postulaciones. Intente de nuevo.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Estado de la posición: con número asignado ("ranked"), revisada en segunda
  // validación pero sin quedar rankeada ("descartado"), o aún sin revisar ("pendiente").
  getEstadoPosicion(item: Postulacion): 'ranked' | 'descartado' | 'pendiente' {
    if (item.posicion !== null && item.posicion !== undefined) return 'ranked';
    return item.segunda_validacion ? 'descartado' : 'pendiente';
  }

  // Estadísticas de la vacante filtrada: viables (1ra evaluación IA), viables que
  // además quedaron rankeados en la segunda validación, y descartados en la segunda validación.
  getStatViables(): number {
    return this.filteredPostulaciones.filter(p => p.respuesta_ia?.resultado === 'VIABLE').length;
  }

  getStatViablesConValidacion(): number {
    return this.filteredPostulaciones.filter(p => p.respuesta_ia?.resultado === 'VIABLE' && this.getEstadoPosicion(p) === 'ranked').length;
  }

  getStatDescartados(): number {
    return this.filteredPostulaciones.filter(p => this.getEstadoPosicion(p) === 'descartado').length;
  }

  onVacanteFilterChange(): void {
    this.loadPostulaciones();
  }

  ejecutarValidacion(): void {
    if (!this.selectedVacanteId || this.ejecutandoValidacion) return;

    this.ejecutandoValidacion = true;
    this.validacionErrorMsg = '';

    this.postulacionService.ejecutarValidacion(this.selectedVacanteId).subscribe({
      next: () => {
        this.ejecutandoValidacion = false;
        this.loadPostulaciones();
      },
      error: (err) => {
        this.ejecutandoValidacion = false;
        this.validacionErrorMsg = 'Error al ejecutar la validación: ' + (err.error?.error || err.message);
        console.error(err);
      }
    });
  }

  viewDetails(postulacion: Postulacion): void {
    this.selectedCandidate = postulacion;
  }

  // Guards against legacy records that were saved with the literal text "undefined"
  // (from template-literal interpolation of missing fields before it was fixed).
  cleanText(val: any): string {
    if (val === undefined || val === null) return '';
    const str = String(val).trim();
    if (!str || str.toLowerCase().split(/\s+/).every(w => w === 'undefined' || w === 'de')) return '';
    return str;
  }

  closeDetails(): void {
    this.selectedCandidate = undefined;
  }

  downloadResume(filename: string | undefined): void {
    if (!filename) return;
    const url = this.postulacionService.getDownloadUrl(filename);
    window.open(url, '_blank');
  }

  downloadHojaVidaCorporativa(postulacion: Postulacion): void {
    if (!postulacion.candidato_id) return;
    const url = this.postulacionService.getHojaVidaCorporativaUrl(
      postulacion.candidato_id,
      postulacion.vacante_titulo || '',
      postulacion.fecha_postulacion || ''
    );
    window.open(url, '_blank');
  }
}
