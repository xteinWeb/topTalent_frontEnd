import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompetenciaEvaluada } from '../../services/postulacion.service';

// Tabla de calificación 1-5 de la entrevista. Con la matriz ARTDECON muestra la pregunta, el nivel requerido,
// el peso y la brecha de cada competencia; con evaluaciones antiguas (10 factores fijos) solo nombre y descripción.
@Component({
  selector: 'app-evaluacion-competencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluacion-competencias.component.html',
  styleUrls: ['./evaluacion-competencias.component.css']
})
export class EvaluacionCompetenciasComponent {
  @Input() items: CompetenciaEvaluada[] = [];
  // Competencias de la matriz que aún no están en la evaluación (se pueden agregar como opcionales)
  @Input() opcionales: CompetenciaEvaluada[] = [];
  @Input() editable = true;
  @Output() cambio = new EventEmitter<void>();
  @Output() agregar = new EventEmitter<CompetenciaEvaluada>();
  @Output() quitar = new EventEmitter<CompetenciaEvaluada>();

  readonly escala = [1, 2, 3, 4, 5];
  abiertas = new Set<CompetenciaEvaluada>();
  seleccionOpcional = '';

  get conMatriz(): boolean {
    return this.items.some(i => i.peso !== undefined);
  }

  calificar(item: CompetenciaEvaluada, puntaje: number): void {
    if (!this.editable) return;
    item.puntuacion = puntaje;
    this.cambio.emit();
  }

  tieneBrecha(item: CompetenciaEvaluada): boolean {
    return item.nivel_requerido !== undefined && !!item.puntuacion && item.puntuacion < item.nivel_requerido;
  }

  alternarGuia(item: CompetenciaEvaluada): void {
    this.abiertas.has(item) ? this.abiertas.delete(item) : this.abiertas.add(item);
  }

  agregarOpcional(): void {
    const item = this.opcionales.find(o => o.competencia_id === this.seleccionOpcional);
    if (item) this.agregar.emit(item);
    this.seleccionOpcional = '';
  }

  pesoPct(item: CompetenciaEvaluada): string {
    return item.peso !== undefined ? `${Math.round(item.peso * 1000) / 10} %` : '';
  }
}
