import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-requisitos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requisitos.component.html'
})
export class PerfilRequisitosComponent {
  @Input() formacion: string = '';
  @Output() formacionChange = new EventEmitter<string>();

  @Input() experiencia: string = '';
  @Output() experienciaChange = new EventEmitter<string>();

  @Input() conocimientos_basicos: string[] = [''];
  @Output() conocimientos_basicosChange = new EventEmitter<string[]>();

  @Input() competencias: string[] = [''];
  @Output() competenciasChange = new EventEmitter<string[]>();

  addConocimiento(): void {
    this.conocimientos_basicos.push('');
    this.conocimientos_basicosChange.emit(this.conocimientos_basicos);
  }

  removeConocimiento(index: number): void {
    this.conocimientos_basicos.splice(index, 1);
    this.conocimientos_basicosChange.emit(this.conocimientos_basicos);
  }

  addCompetencia(): void {
    this.competencias.push('');
    this.competenciasChange.emit(this.competencias);
  }

  removeCompetencia(index: number): void {
    this.competencias.splice(index, 1);
    this.competenciasChange.emit(this.competencias);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
