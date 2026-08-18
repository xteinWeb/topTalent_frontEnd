import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-postulacion-preguntas-cargo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preguntas-cargo.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class PreguntasCargoComponent {
  @Input() preguntas: any[] = [];
  @Output() preguntasChange = new EventEmitter<any[]>();

  onRespuestaChange(): void {
    this.preguntasChange.emit(this.preguntas);
  }
}
