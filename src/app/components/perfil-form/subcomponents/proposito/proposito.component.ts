import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-proposito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proposito.component.html'
})
export class PerfilPropositoComponent {
  @Input() proposito: string = '';
  @Output() propositoChange = new EventEmitter<string>();

  @Input() autoridad: string = '';
  @Output() autoridadChange = new EventEmitter<string>();
}
