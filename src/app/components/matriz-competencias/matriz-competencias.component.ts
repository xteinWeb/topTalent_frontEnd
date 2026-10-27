import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  CompetenciaService, Competencia, GrupoCargo, CategoriaCompetencia
} from '../../services/competencia.service';

// Copia editable: el peso se edita en porcentaje (8 = 8 %) y se convierte a fracción al guardar
interface FilaCompetencia extends Omit<Competencia, 'grupos'> {
  grupos: { [grupo: string]: { nivel_requerido: number; peso_pct: number } };
}

// Matriz de competencias ARTDECON: niveles y pesos por grupo de cargo.
// La consultan todos los usuarios internos; la editan Talento Humano y el superadministrador.
@Component({
  selector: 'app-matriz-competencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matriz-competencias.component.html',
  styleUrls: ['./matriz-competencias.component.css']
})
export class MatrizCompetenciasComponent implements OnInit {
  filas: FilaCompetencia[] = [];
  grupos: GrupoCargo[] = [];
  categorias: CategoriaCompetencia[] = [];
  principales = 5;
  grupoActivo = 'OPERARIO';

  puedeEditar = false;
  editando = false;
  cambiosPendientes = false;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  // Detalle (textos) de una competencia en el modal
  detalle: FilaCompetencia | null = null;
  detalleEsNueva = false;

  constructor(private competenciaService: CompetenciaService, private authService: AuthService) {}

  ngOnInit(): void {
    this.puedeEditar = this.authService.isTalentoHumano();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.competenciaService.getMatriz(this.puedeEditar).subscribe({
      next: (matriz) => {
        this.grupos = matriz.grupos;
        this.categorias = matriz.categorias;
        this.principales = matriz.principales_entrevista;
        this.filas = matriz.competencias.map(c => this.aFila(c));
        this.cargando = false;
        this.cambiosPendientes = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'No se pudo cargar la matriz de competencias.';
      }
    });
  }

  private aFila(c: Competencia): FilaCompetencia {
    const grupos: FilaCompetencia['grupos'] = {};
    for (const g of this.grupos) {
      const v = c.grupos[g.id] || { nivel_requerido: 3, peso: 0 };
      grupos[g.id] = { nivel_requerido: v.nivel_requerido, peso_pct: Math.round(v.peso * 10000) / 100 };
    }
    return { ...c, grupos };
  }

  private aCompetencia(f: FilaCompetencia): Competencia {
    const grupos: Competencia['grupos'] = {};
    for (const g of this.grupos) {
      grupos[g.id] = { nivel_requerido: Number(f.grupos[g.id].nivel_requerido), peso: Number(f.grupos[g.id].peso_pct) / 100 };
    }
    return { ...f, grupos };
  }

  // --- Vista ---
  get filasActivas(): FilaCompetencia[] {
    return this.filas.filter(f => f.activo);
  }

  // Las que se preguntarán en la entrevista del grupo activo (mismo desempate que el backend)
  get principalesDelGrupo(): Set<FilaCompetencia> {
    const orden = this.filasActivas
      .map((f, i) => ({ f, i }))
      .sort((a, b) =>
        b.f.grupos[this.grupoActivo].peso_pct - a.f.grupos[this.grupoActivo].peso_pct ||
        b.f.grupos[this.grupoActivo].nivel_requerido - a.f.grupos[this.grupoActivo].nivel_requerido ||
        a.i - b.i);
    return new Set(orden.slice(0, this.principales).map(x => x.f));
  }

  sumaPesos(grupo: string): number {
    return Math.round(this.filasActivas.reduce((t, f) => t + Number(f.grupos[grupo].peso_pct || 0), 0) * 100) / 100;
  }

  sumaCorrecta(grupo: string): boolean {
    return Math.abs(this.sumaPesos(grupo) - 100) < 0.05;
  }

  nombreCategoria(id: string): string {
    return this.categorias.find(c => c.id === id)?.nombre || id;
  }

  nombreGrupo(id: string): string {
    return this.grupos.find(g => g.id === id)?.nombre || id;
  }

  // --- Edición ---
  activarEdicion(): void {
    this.editando = true;
    this.mensaje = '';
  }

  marcarCambio(): void {
    this.cambiosPendientes = true;
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    if (this.cambiosPendientes && !confirm('Hay cambios sin guardar. ¿Descartarlos?')) return;
    this.editando = false;
    this.cargar();
  }

  guardar(): void {
    const malSumados = this.grupos.filter(g => !this.sumaCorrecta(g.id));
    if (malSumados.length > 0) {
      this.error = 'Los pesos deben sumar 100 % en cada grupo. Revise: ' +
        malSumados.map(g => `${g.nombre} (${this.sumaPesos(g.id)} %)`).join(', ') + '.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.competenciaService.guardarMatriz(this.filas.map(f => this.aCompetencia(f))).subscribe({
      next: (competencias) => {
        this.filas = competencias.map(c => this.aFila(c));
        this.guardando = false;
        this.editando = false;
        this.cambiosPendientes = false;
        this.mensaje = 'Matriz de competencias guardada.';
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.error || 'No se pudo guardar la matriz.';
      }
    });
  }

  abrirDetalle(fila: FilaCompetencia): void {
    this.detalle = fila;
    this.detalleEsNueva = false;
  }

  nuevaCompetencia(): void {
    const grupos: FilaCompetencia['grupos'] = {};
    this.grupos.forEach(g => grupos[g.id] = { nivel_requerido: 3, peso_pct: 0 });
    this.detalle = {
      categoria: 'TRANSVERSAL', nombre: '', definicion: '', conductas_observables: '', justificacion_peso: '',
      riesgo_organizacional: '', pregunta_seleccion: '', criterio_evaluacion: '', activo: true, grupos
    };
    this.detalleEsNueva = true;
  }

  cerrarDetalle(): void {
    if (this.detalleEsNueva && this.detalle && this.detalle.nombre.trim()) {
      this.filas.push(this.detalle);
      this.marcarCambio();
    } else if (!this.detalleEsNueva) {
      this.marcarCambio();
    }
    this.detalle = null;
  }

  descartarNueva(): void {
    this.detalle = null;
  }
}
