import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../../../services/catalogo.service';

@Component({
  selector: 'app-postulacion-nivel-educativo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nivel-educativo.component.html',
  styleUrls: ['../../postulacion-form.component.css']
})
export class NivelEducativoComponent implements OnInit {
  @Input() tieneEducacionFormal: string = 'No';
  @Output() tieneEducacionFormalChange = new EventEmitter<string>();

  @Input() estudios: any[] = [];
  @Output() estudiosChange = new EventEmitter<any[]>();

  listaNivelesEducativos: string[] = [];

  listaEstadosEducacion: string[] = ['Graduado', 'En curso', 'Suspendido / Aplazado'];
  listaPaises: string[] = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'];

  // Listas predefinidas para autocompletado rápido
  sugerenciasTitulos: string[] = [
    'Administración de Empresas',
    'Ingeniería de Sistemas',
    'Contaduría Pública',
    'Derecho',
    'Psicología',
    'Medicina',
    'Ingeniería Industrial',
    'Comunicación Social',
    'Economía',
    'Licenciatura en Educación',
    'Arquitectura',
    'Diseño Gráfico',
    'Ingeniería Civil',
    'Negocios Internacionales',
    'Mercadeo / Marketing',
    'Enfermería',
    'Trabajo Social',
    'Ingeniería Electrónica',
    'Ingeniería Mecánica',
    'Técnico en Sistemas',
    'Técnico en Contabilidad',
    'Tecnología en Desarrollo de Software',
    'Tecnología en Gestión Empresarial'
  ];

  sugerenciasInstituciones: string[] = [];

  listaMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  listaAnios: number[] = [];

  showEstudioForm: boolean = false;
  nuevoEstudio: any = {
    nivel: '',
    titulo: '',
    homologado: 'No',
    pais: 'Colombia',
    institucion: '',
    estado: '',
    observaciones: '',
    mesFin: '',
    anioFin: '',
    tarjetaProfesional: 'No',
    tarjetaProfesionalNumero: ''
  };

  constructor(private catalogoService: CatalogoService) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      this.listaAnios.push(y);
    }
  }

  ngOnInit(): void {
    this.catalogoService.getByTipo('NIVEL_EDUCATIVO').subscribe({
      next: (valores) => this.listaNivelesEducativos = valores,
      error: (err) => console.error('Error al cargar niveles educativos:', err)
    });

    this.catalogoService.getByTipo('INSTITUCION_EDUCATIVA').subscribe({
      next: (valores) => this.sugerenciasInstituciones = valores,
      error: (err) => console.error('Error al cargar instituciones educativas:', err)
    });
  }

  // Buscar universidades dinámicamente desde datos.gov.co en tiempo real
  buscarInstituciones(event: any): void {
    const query = event.target.value;
    if (!query || query.trim().length < 3) {
      return;
    }

    const filterUrl = `https://www.datos.gov.co/resource/n5yy-8nav.json?$where=upper(nombre_institucion) like upper('%25${encodeURIComponent(query)}%25')&$limit=10`;
    
    fetch(filterUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          const list = data.map((item: any) => item.nombre_institucion)
            .filter((value: string, index: number, self: any) => self.indexOf(value) === index);
          
          if (list.length > 0) {
            this.sugerenciasInstituciones = list;
          }
        }
      })
      .catch(error => {
        console.error('Error al consultar API de datos.gov.co:', error);
      });
  }

  onTieneEducacionChange(val: string): void {
    this.tieneEducacionFormalChange.emit(val);
  }

  toggleEstudioForm(show: boolean): void {
    this.showEstudioForm = show;
    if (show) {
      this.nuevoEstudio = {
        nivel: '',
        titulo: '',
        homologado: 'No',
        pais: 'Colombia',
        institucion: '',
        estado: '',
        observaciones: '',
        mesFin: '',
        anioFin: '',
        tarjetaProfesional: 'No',
        tarjetaProfesionalNumero: ''
      };
    }
  }

  addEstudioRecord(): void {
    if (!this.nuevoEstudio.nivel || !this.nuevoEstudio.titulo || !this.nuevoEstudio.institucion || !this.nuevoEstudio.estado) {
      alert('Por favor complete todos los campos obligatorios del nivel educativo.');
      return;
    }
    
    // Validar mes y año de finalización si aplica
    if (this.nuevoEstudio.estado === 'Graduado' || this.nuevoEstudio.estado === 'Suspendido / Aplazado') {
      if (!this.nuevoEstudio.mesFin || !this.nuevoEstudio.anioFin) {
        alert('Por favor seleccione el mes y año de finalización.');
        return;
      }
    }

    // Validar número de tarjeta profesional si cuenta con ella
    if (this.nuevoEstudio.tarjetaProfesional === 'Si') {
      if (!this.nuevoEstudio.tarjetaProfesionalNumero || !this.nuevoEstudio.tarjetaProfesionalNumero.trim()) {
        alert('Por favor ingrese el número de la tarjeta profesional.');
        return;
      }
    }

    this.estudios.push({ ...this.nuevoEstudio });
    this.estudiosChange.emit(this.estudios);
    this.toggleEstudioForm(false);
  }

  removeEstudioRecord(index: number): void {
    this.estudios.splice(index, 1);
    this.estudiosChange.emit(this.estudios);
  }
}
