import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Postulacion {
  id?: string;
  vacante_id: string;
  vacante_titulo?: string;
  candidato_id?: string;
  nombre_completo: string;
  correo: string;
  telefono?: string;
  perfil_profesional: {
    titulo: string;
    resumen: string;
  };
  experiencias_json: any[];
  estudios_json: any[];
  idiomas_json: any[];
  habilidades_json: {
    tecnicas?: string[];
    interpersonales?: string[];
    otros?: string[];
  };
  preguntas_respondidas?: any[];
  hv_archivo_nombre?: string;
  hv_archivo_ruta?: string;
  fecha_postulacion?: string;
  respuesta_ia?: {
    cargo_evaluado?: string;
    nombre_candidato?: string;
    resultado?: string;
    puntaje?: number;
    confiabilidad?: string;
    cumplimiento_requisitos?: string;
    estabilidad_laboral?: string;
    experiencia_relevante?: string[];
    fortalezas_documentales?: string[];
    brechas_riesgos?: string[];
    fit_cultural?: string;
    validaciones_requeridas?: string[];
    conclusion?: string;
  };
  estado_ia?: string;
  puntuacion_ia?: number;
  posicion?: number | null;
  segunda_validacion?: boolean | number | null;
  json_analisis_ia?: {
    posicion?: number;
    puntaje_fase_1?: number;
    puntaje_comparativo?: number;
    ventaja_competitiva?: string;
    diferenciador_tecnico?: string;
    riesgo_menor_o_brecha?: string;
    pregunta_clave_entrevista?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PostulacionService {
  private apiUrl = `${environment.apiUrl}/postulaciones`;

  constructor(private http: HttpClient) { }

  postular(postulacion: any, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('vacante_id', postulacion.vacante_id);
    formData.append('nombre_completo', postulacion.nombre_completo);
    formData.append('correo', postulacion.correo);
    formData.append('telefono', postulacion.telefono || '');
    formData.append('cedula', postulacion.cedula || '');
    formData.append('fecha_nacimiento', postulacion.fecha_nacimiento || '');
    formData.append('edad', postulacion.edad || '');
    formData.append('eps', postulacion.eps || '');
    formData.append('fondo_pension', postulacion.fondo_pension || '');
    formData.append('direccion', postulacion.direccion || '');
    formData.append('barrio', postulacion.barrio || '');
    formData.append('ciudad', postulacion.ciudad || '');
    formData.append('estado_civil', postulacion.estado_civil || '');
    formData.append('talla_camisa', postulacion.talla_camisa || '');
    formData.append('talla_pantalon', postulacion.talla_pantalon || '');
    formData.append('talla_zapato', postulacion.talla_zapato || '');
    formData.append('personas_a_cargo_json', JSON.stringify(postulacion.personas_a_cargo || []));
    formData.append('tiene_familiares_empresa', postulacion.tiene_familiares_empresa || '');
    formData.append('detalle_familiares_empresa', postulacion.detalle_familiares_empresa || '');
    formData.append('funciones_desempenar', postulacion.funciones_desempenar || '');
    formData.append('perfil_profesional', JSON.stringify(postulacion.perfil_profesional));
    formData.append('experiencias_json', JSON.stringify(postulacion.experiencias_json));
    formData.append('estudios_json', JSON.stringify(postulacion.estudios_json));
    formData.append('idiomas_json', JSON.stringify(postulacion.idiomas_json));
    formData.append('habilidades_json', JSON.stringify(postulacion.habilidades_json));
    formData.append('preguntas_respondidas_json', JSON.stringify(postulacion.preguntas_respondidas || []));
    formData.append('acepto_tratamiento_datos', postulacion.acepto_tratamiento_datos ? 'true' : 'false');
    if (postulacion.candidato_id) {
      formData.append('candidato_id', postulacion.candidato_id);
    }
    if (archivo) {
      formData.append('hv_archivo', archivo, archivo.name);
    }
    return this.http.post<any>(this.apiUrl, formData);
  }

  getPostulaciones(): Observable<Postulacion[]> {
    return this.http.get<{ data: Postulacion[] }>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getPostulacionesPorVacante(vacanteId: string): Observable<Postulacion[]> {
    return this.http.get<{ data: Postulacion[] }>(`${this.apiUrl}/vacante/${vacanteId}`).pipe(
      map(res => res.data)
    );
  }

  ejecutarValidacion(vacanteId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/vacante/${vacanteId}/validar`, {});
  }

  getDownloadUrl(filename: string): string {
    return `${this.apiUrl}/download/${filename}`;
  }

  getHojaVidaCorporativaUrl(candidatoId: string, vacanteTitulo: string, fechaPostulacion: string): string {
    const params = new URLSearchParams({ vacante: vacanteTitulo || '', fecha: fechaPostulacion || '' });
    return `${this.apiUrl}/candidato/${candidatoId}/hoja-vida-docx?${params.toString()}`;
  }
}
