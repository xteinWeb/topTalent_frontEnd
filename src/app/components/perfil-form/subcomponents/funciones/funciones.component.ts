import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-funciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funciones.component.html'
})
export class PerfilFuncionesComponent {
  @Input() funciones: string[] = [''];
  @Output() funcionesChange = new EventEmitter<string[]>();

  addFunc(): void {
    this.funciones.push('');
    this.funcionesChange.emit(this.funciones);
  }

  removeFunc(index: number): void {
    this.funciones.splice(index, 1);
    this.funcionesChange.emit(this.funciones);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
