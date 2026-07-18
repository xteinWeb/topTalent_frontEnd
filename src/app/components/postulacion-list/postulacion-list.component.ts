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
        // Parsear respuesta_ia si viene como string
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
          return item;
        });

        // Ordenar de mayor a menor por puntaje de IA
        const sortedData = parsedData.sort((a, b) => {
          const scoreA = a.respuesta_ia?.puntaje ?? -1;
          const scoreB = b.respuesta_ia?.puntaje ?? -1;
          return scoreB - scoreA;
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

  onVacanteFilterChange(): void {
    this.loadPostulaciones();
  }

  viewDetails(postulacion: Postulacion): void {
    this.selectedCandidate = postulacion;
  }

  closeDetails(): void {
    this.selectedCandidate = undefined;
  }

  downloadResume(filename: string | undefined): void {
    if (!filename) return;
    const url = this.postulacionService.getDownloadUrl(filename);
    window.open(url, '_blank');
  }
}
