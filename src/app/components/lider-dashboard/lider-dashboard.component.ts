import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PostulacionService, Postulacion } from '../../services/postulacion.service';
import { EstadoPostulacionService, EstadoPostulacion } from '../../services/estado-postulacion.service';
import { AuthService, UserSession } from '../../services/auth.service';

// Panel del líder de área: candidatos de sus vacantes (las que solicitó o de los perfiles que tiene a cargo).
// El backend ya filtra por líder; esta vista es de solo lectura.
@Component({
  selector: 'app-lider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lider-dashboard.component.html',
  styleUrls: ['./lider-dashboard.component.css']
})
export class LiderDashboardComponent implements OnInit {
  currentUser: UserSession | null = null;
  postulaciones: Postulacion[] = [];
  estados: EstadoPostulacion[] = [];
  vacantes: Array<{ id: string; titulo: string; total: number }> = [];

  filtroVacante = '';
  filtroEstado = '';
  busqueda = '';

  loading = true;
  errorMsg = '';

  constructor(
    private postulacionService: PostulacionService,
    private estadoPostulacionService: EstadoPostulacionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorMsg = '';
    forkJoin({
      postulaciones: this.postulacionService.getPostulaciones(),
      estados: this.estadoPostulacionService.getEstados()
    }).subscribe({
      next: ({ postulaciones, estados }) => {
        this.postulaciones = postulaciones;
        this.estados = estados;
        this.vacantes = this.agruparVacantes(postulaciones);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando el panel del líder:', err);
        this.errorMsg = 'No se pudieron cargar los candidatos. Intente de nuevo.';
        this.loading = false;
      }
    });
  }

  private agruparVacantes(lista: Postulacion[]): Array<{ id: string; titulo: string; total: number }> {
    const mapa = new Map<string, { id: string; titulo: string; total: number }>();
    for (const p of lista) {
      const actual = mapa.get(p.vacante_id) || { id: p.vacante_id, titulo: p.vacante_titulo || 'Vacante', total: 0 };
      actual.total++;
      mapa.set(p.vacante_id, actual);
    }
    return [...mapa.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  }

  get filtradas(): Postulacion[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.postulaciones.filter(p =>
      (!this.filtroVacante || p.vacante_id === this.filtroVacante) &&
      (!this.filtroEstado || this.estadoDe(p) === this.filtroEstado) &&
      (!texto || (p.nombre_completo || '').toLowerCase().includes(texto) || (p.vacante_titulo || '').toLowerCase().includes(texto))
    );
  }

  // Conteo por estado sobre la vacante filtrada (si hay), en el orden del catálogo
  get conteoEstados(): Array<{ estado: EstadoPostulacion; total: number }> {
    const base = this.postulaciones.filter(p => !this.filtroVacante || p.vacante_id === this.filtroVacante);
    return this.estados
      .map(estado => ({ estado, total: base.filter(p => this.estadoDe(p) === estado.nombre).length }))
      .filter(item => item.total > 0 || item.estado.mostrar_en_pipeline);
  }

  get totalBase(): number {
    return this.postulaciones.filter(p => !this.filtroVacante || p.vacante_id === this.filtroVacante).length;
  }

  estadoDe(p: Postulacion): string {
    return p.estado_postulante || 'Postulado';
  }

  estiloEstado(nombre: string): { [k: string]: string } {
    const estado = this.estados.find(e => e.nombre === nombre);
    if (!estado) return {};
    return {
      color: estado.color_texto || '',
      'background-color': estado.color_fondo || '',
      'border-color': estado.color_borde || ''
    };
  }

  iconoEstado(nombre: string): string {
    return this.estados.find(e => e.nombre === nombre)?.icono || '';
  }

  alternarFiltroEstado(nombre: string): void {
    this.filtroEstado = this.filtroEstado === nombre ? '' : nombre;
  }
}
