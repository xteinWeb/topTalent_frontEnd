import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-preguntas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preguntas.component.html'
})
export class PerfilPreguntasComponent {
  @Input() prompt: string = '';
  @Output() promptChange = new EventEmitter<string>();

  @Input() preguntas: any[] = [];
  @Output() preguntasChange = new EventEmitter<any[]>();

  @Input() generatingQuestions: boolean = false;
  @Output() generate = new EventEmitter<void>();

  addPregunta(): void {
    this.preguntas.push({
      id: 'P' + (this.preguntas.length + 1),
      categoria: 'Técnica',
      tipo: 'Abierta',
      titulo: '',
      pregunta: '',
      descripcion: '',
      peso: 1,
      obligatoria: true,
      tiempo_estimado_segundos: 120,
      rubrica_evaluacion: { insuficiente: '', aceptable: '', excelente: '' }
    });
    this.preguntasChange.emit(this.preguntas);
  }

  removePregunta(index: number): void {
    this.preguntas.splice(index, 1);
    this.preguntasChange.emit(this.preguntas);
  }

  addOpcion(preguntaIndex: number): void {
    if (!this.preguntas[preguntaIndex].opciones) {
      this.preguntas[preguntaIndex].opciones = [];
    }
    this.preguntas[preguntaIndex].opciones.push({ valor: '', etiqueta: '' });
    this.preguntasChange.emit(this.preguntas);
  }

  removeOpcion(preguntaIndex: number, opcionIndex: number): void {
    this.preguntas[preguntaIndex].opciones.splice(opcionIndex, 1);
    this.preguntasChange.emit(this.preguntas);
  }

  onTipoPreguntaChange(preguntaIndex: number): void {
    const preg = this.preguntas[preguntaIndex];
    if (preg.tipo === 'Cerrada') {
      if (!preg.opciones || preg.opciones.length === 0) {
        preg.opciones = [{ valor: 'Sí', etiqueta: 'Sí' }, { valor: 'No', etiqueta: 'No' }];
      }
      if (preg.rubrica_evaluacion) {
        delete preg.rubrica_evaluacion;
      }
    } else {
      preg.rubrica_evaluacion = { insuficiente: '', aceptable: '', excelente: '' };
      if (preg.opciones) {
        delete preg.opciones;
      }
    }
    this.preguntasChange.emit(this.preguntas);
  }
}
