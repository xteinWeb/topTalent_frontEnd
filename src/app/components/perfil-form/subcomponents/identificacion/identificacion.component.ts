import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-identificacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './identificacion.component.html'
})
export class PerfilIdentificacionComponent {
  @Input() cargo: string = '';
  @Output() cargoChange = new EventEmitter<string>();

  @Input() area: string = '';
  @Output() areaChange = new EventEmitter<string>();

  @Input() contractual: string = '';
  @Output() contractualChange = new EventEmitter<string>();

  @Input() reporta_a: string = '';
  @Output() reporta_aChange = new EventEmitter<string>();

  @Input() supervisa: string = '';
  @Output() supervisaChange = new EventEmitter<string>();
}
