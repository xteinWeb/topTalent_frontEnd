import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService, ReporteIndicadores, FiltrosReporte, Tiempo } from '../../services/reporte.service';
import { guardarArchivoDescargado } from '../../utils/descargar-archivo';

// Reporte de indicadores de selección: embudo, tiempos del proceso y motivos, agrupados por área o por líder.
@Component({
  selector: 'app-reporte-indicadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-indicadores.component.html',
  styleUrls: ['./reporte-indicadores.component.css']
})
export class ReporteIndicadoresComponent implements OnInit {
  filtros: FiltrosReporte = { desde: '', hasta: '', agrupar: 'area' };
  reporte: ReporteIndicadores | null = null;
  cargando = false;
  descargando = false;
  error = '';

  // Atajos de período (días hacia atrás desde hoy)
  readonly atajos = [
    { etiqueta: '30 días', dias: 30 },
    { etiqueta: '90 días', dias: 90 },
    { etiqueta: 'Este año', dias: -1 }
  ];

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.aplicarAtajo(90);
  }

  private iso(d: Date): string {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  aplicarAtajo(dias: number): void {
    const hoy = new Date();
    const desde = dias < 0 ? new Date(hoy.getFullYear(), 0, 1) : new Date(hoy.getTime() - dias * 86400000);
    this.filtros.desde = this.iso(desde);
    this.filtros.hasta = this.iso(hoy);
    this.cargar();
  }

  cambiarAgrupacion(agrupar: 'area' | 'lider'): void {
    if (this.filtros.agrupar === agrupar) return;
    this.filtros.agrupar = agrupar;
    this.cargar();
  }

  cargar(): void {
    if (!this.filtros.desde || !this.filtros.hasta) return;
    if (this.filtros.desde > this.filtros.hasta) {
      this.error = 'La fecha "desde" no puede ser posterior a "hasta".';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.reporteService.getIndicadores(this.filtros).subscribe({
      next: (r) => {
        this.reporte = r;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'No se pudo cargar el reporte.';
      }
    });
  }

  descargarExcel(): void {
    this.descargando = true;
    this.reporteService.descargarExcel(this.filtros).subscribe({
      next: (res) => {
        this.descargando = false;
        guardarArchivoDescargado(res, `Indicadores_seleccion_${this.filtros.desde}_a_${this.filtros.hasta}.xlsx`);
      },
      error: () => {
        this.descargando = false;
        this.error = 'No se pudo generar el archivo de Excel.';
      }
    });
  }

  // --- Presentación ---
  // Ancho relativo de una barra frente al máximo de su gráfica (las barras comparten una sola escala)
  ancho(valor: number, maximo: number): number {
    return maximo > 0 ? Math.max((valor / maximo) * 100, valor > 0 ? 1.5 : 0) : 0;
  }

  get maxMotivo(): number {
    return Math.max(0, ...(this.reporte?.motivos || []).map(m => m.n));
  }

  textoTiempo(t: Tiempo): string {
    return t.promedio_dias === null ? '—' : `${t.promedio_dias.toLocaleString('es-CO')} días`;
  }

  textoMediciones(t: Tiempo, unidad: string): string {
    return t.mediciones === 0 ? 'Sin datos en el período' : `Promedio de ${t.mediciones} ${unidad}`;
  }

  etapa(grupo: { embudo: Array<{ id: string; n: number }> }, id: string): number {
    return grupo.embudo.find(e => e.id === id)?.n ?? 0;
  }
}
