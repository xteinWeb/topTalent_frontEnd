import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-postulacion-idiomas-habilidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './idiomas-habilidades.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class IdiomasHabilidadesComponent {
  @Input() idiomas: any[] = [];
  @Output() idiomasChange = new EventEmitter<any[]>();

  @Input() habilidades: {
    tecnicas: string[];
    interpersonales: string[];
    otros: string[];
  } = { tecnicas: [], interpersonales: [], otros: [] };
  @Output() habilidadesChange = new EventEmitter<any>();

  listaIdiomas: string[] = ['Español', 'Inglés', 'Portugués', 'Alemán', 'Francés', 'Italiano', 'Mandarín', 'Otro'];

  nuevoIdioma: any = {
    idioma: '',
    nivel: 0
  };

  nuevaHerramienta: any = {
    nombre: '',
    tipo: '',
    nivel: 0
  };

  setStarRating(obj: any, rating: number): void {
    obj.nivel = rating;
  }

  addIdiomaRecord(): void {
    if (!this.nuevoIdioma.idioma || this.nuevoIdioma.nivel === 0) {
      alert('Por favor seleccione un idioma y asigne un nivel en estrellas.');
      return;
    }
    const existe = this.idiomas.some(i => i.idioma.toLowerCase() === this.nuevoIdioma.idioma.toLowerCase());
    if (existe) {
      alert('Este idioma ya ha sido añadido.');
      return;
    }
    const nivelTextos = ['Muy Básico', 'Básico', 'Intermedio', 'Avanzado', 'Nativo'];
    this.idiomas.push({
      idioma: this.nuevoIdioma.idioma,
      nivel: nivelTextos[this.nuevoIdioma.nivel - 1] || 'Básico',
      estrellas: this.nuevoIdioma.nivel
    });
    this.idiomasChange.emit(this.idiomas);
    this.nuevoIdioma = { idioma: '', nivel: 0 };
  }

  removeIdiomaRecord(index: number): void {
    this.idiomas.splice(index, 1);
    this.idiomasChange.emit(this.idiomas);
  }

  addHerramientaRecord(): void {
    if (!this.nuevaHerramienta.nombre || this.nuevaHerramienta.nivel === 0 || !this.nuevaHerramienta.tipo) {
      alert('Por favor ingrese el nombre de la herramienta, seleccione un tipo y asigne un nivel.');
      return;
    }

    const tipo = this.nuevaHerramienta.tipo as 'tecnicas' | 'interpersonales' | 'otros';
    if (!this.habilidades[tipo]) {
      this.habilidades[tipo] = [];
    }

    const itemStr = `${this.nuevaHerramienta.nombre} (Nivel: ${this.nuevaHerramienta.nivel}/3)`;
    this.habilidades[tipo].push(itemStr);

    this.habilidadesChange.emit(this.habilidades);
    this.nuevaHerramienta = { nombre: '', tipo: '', nivel: 0 };
  }

  removeHerramientaRecord(tipo: 'tecnicas' | 'interpersonales' | 'otros', index: number): void {
    if (this.habilidades[tipo]) {
      this.habilidades[tipo].splice(index, 1);
      this.habilidadesChange.emit(this.habilidades);
    }
  }
}
