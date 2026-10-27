import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiderArea } from '../../../../services/auth.service';
import { GRUPOS_CARGO } from '../../../../services/competencia.service';

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

  // Líder de área responsable: solo ve y solicita vacantes de los perfiles que tiene asignados
  @Input() liderId: string | null = null;
  @Output() liderIdChange = new EventEmitter<string | null>();
  @Input() lideres: LiderArea[] = [];

  // Grupo de cargo de la matriz de competencias: define qué competencias y pesos se evalúan en la entrevista
  @Input() grupoCargo: string | null = null;
  @Output() grupoCargoChange = new EventEmitter<string | null>();
  readonly gruposCargo = GRUPOS_CARGO;
}
