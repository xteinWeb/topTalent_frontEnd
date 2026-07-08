import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-indicadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './indicadores.component.html'
})
export class PerfilIndicadoresComponent {
  @Input() indicadores: Array<{ nombre: string; nivel: string; formula: string }> = [
    { nombre: '', nivel: '', formula: '' }
  ];
  @Output() indicadoresChange = new EventEmitter<Array<{ nombre: string; nivel: string; formula: string }>>();

  addIndicador(): void {
    this.indicadores.push({ nombre: '', nivel: '', formula: '' });
    this.indicadoresChange.emit(this.indicadores);
  }

  removeIndicador(index: number): void {
    this.indicadores.splice(index, 1);
    this.indicadoresChange.emit(this.indicadores);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
