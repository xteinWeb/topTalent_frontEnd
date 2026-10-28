import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CitaEntrevista {
  fecha: string;
  hora: string;
  duracion_minutos?: number;
  modalidad: string;
  ubicacion_o_enlace?: string;
  entrevistador?: string;
  notas?: string;
  google_calendar_url?: string;
  whatsapp_url?: string;
  fecha_agendamiento?: string;
}

export interface CompetenciaEvaluada {
  competencia: string;
  definicion?: string;
  puntuacion: number | null; // 1 a 5 (null = sin calificar)
  observaciones?: string;
  // Solo en evaluaciones con la matriz de competencias (formato 'matriz_v1')
  competencia_id?: string;
  categoria?: string;
  pregunta?: string;
  conductas?: string;
  criterio?: string;
  nivel_requerido?: number;
  peso?: number;
  principal?: boolean;
}

export interface EvaluacionEntrevista {
  impresion_general?: string;
  concepto_psicologico?: string;
  matriz_competencias?: CompetenciaEvaluada[];
  promedio_competencias?: number;
  disponibilidad_ingreso?: string;
  aspiracion_salarial?: string;
  decision_final?: 'Aprobado' | 'Aprobado con reservas' | 'No aprobado' | 'Con observaciones' | string;
  evaluador_nombre?: string;
  observaciones_adicionales?: string;
  fecha_evaluacion?: string;
  fortalezas_clave?: string;
  oportunidades_mejora?: string;
  ajuste_cultural?: string;
  respuestas_star?: { [key: string]: string };
  // 'matriz_v1': evaluada con la matriz de competencias del grupo de cargo; sin formato = 10 factores fijos (antiguas)
  formato?: string;
  grupo_cargo?: string;
  brechas?: number;
  // Obligatorio si decision_final es "No aprobado" (se guarda en la postulación, no en la evaluación)
  motivo_no_aprobado?: string;
  motivo_no_aprobado_detalle?: string;
}

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
    justificacion?: string;
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

  // Estados oficiales y flujo de selección
  estado_postulante?: string; // nombre de un estado del catálogo estados_postulacion
  cita_entrevista_json?: CitaEntrevista;
  evaluacion_entrevista_json?: EvaluacionEntrevista;
  matriz_competencias_json?: any;

  // Motivo obligatorio en los estados que lo requieren, p. ej. Descartado ("Otro" usa el detalle)
  motivo_no_aprobado?: string | null;
  motivo_no_aprobado_detalle?: string | null;

  // Resultado de la prueba psicotécnica adjunto (PDF)
  prueba_psicotecnica_nombre?: string | null;
  prueba_psicotecnica_fecha?: string | null;
  tiene_prueba_psicotecnica?: number | boolean;

  // Prefiltro (llamada o formulario por WhatsApp); el detalle completo lo carga PrefiltroService
  prefiltro_json?: { resultado?: string | null; [k: string]: any } | null;
  prefiltro_enlace_expira?: string | null;

  // Grupo de cargo del perfil (matriz de competencias)
  perfil_grupo_cargo?: string | null;
}

export interface MotivoNoAprobado {
  motivo_no_aprobado: string;
  motivo_no_aprobado_detalle?: string;
}

function normalizePostulacion(p: any): Postulacion {
  if (!p) return p;
  if (typeof p.respuesta_ia === 'string') {
    try { p.respuesta_ia = JSON.parse(p.respuesta_ia); } catch (e) {}
  }
  if (typeof p.json_analisis_ia === 'string') {
    try { p.json_analisis_ia = JSON.parse(p.json_analisis_ia); } catch (e) {}
  }
  if (typeof p.cita_entrevista_json === 'string') {
    try { p.cita_entrevista_json = JSON.parse(p.cita_entrevista_json); } catch (e) {}
  }
  if (typeof p.evaluacion_entrevista_json === 'string') {
    try { p.evaluacion_entrevista_json = JSON.parse(p.evaluacion_entrevista_json); } catch (e) {}
  }
  if (typeof p.experiencias_json === 'string') {
    try { p.experiencias_json = JSON.parse(p.experiencias_json); } catch (e) {}
  }
  if (typeof p.estudios_json === 'string') {
    try { p.estudios_json = JSON.parse(p.estudios_json); } catch (e) {}
  }
  if (typeof p.idiomas_json === 'string') {
    try { p.idiomas_json = JSON.parse(p.idiomas_json); } catch (e) {}
  }
  if (typeof p.habilidades_json === 'string') {
    try { p.habilidades_json = JSON.parse(p.habilidades_json); } catch (e) {}
  }
  if (typeof p.preguntas_respondidas === 'string') {
    try { p.preguntas_respondidas = JSON.parse(p.preguntas_respondidas); } catch (e) {}
  }
  if (typeof p.perfil_profesional === 'string') {
    try { p.perfil_profesional = JSON.parse(p.perfil_profesional); } catch (e) {}
  }
  return p;
}

@Injectable({
  providedIn: 'root'
})
export class PostulacionService {
  private apiUrl = `${environment.apiUrl}/postulaciones`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

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
    // La cuenta del candidato la identifica el backend por el token de sesión (interceptor)
    if (archivo) {
      formData.append('hv_archivo', archivo, archivo.name);
    }
    return this.http.post<any>(this.apiUrl, formData);
  }

  getPostulaciones(empresaId?: string): Observable<Postulacion[]> {
    const user = this.authService.getCurrentUser();
    const targetEmpresa = empresaId || user?.empresa_id;
    let params = new HttpParams();
    if (targetEmpresa) {
      params = params.set('empresa_id', targetEmpresa);
    }
    return this.http.get<{ data: Postulacion[] }>(this.apiUrl, { params }).pipe(
      map(res => (res.data || []).map(normalizePostulacion))
    );
  }

  getPostulacionesPorVacante(vacanteId: string): Observable<Postulacion[]> {
    return this.http.get<{ data: Postulacion[] }>(`${this.apiUrl}/vacante/${vacanteId}`).pipe(
      map(res => (res.data || []).map(normalizePostulacion))
    );
  }

  cambiarEstado(id: string, estado_postulante: string, motivo?: MotivoNoAprobado): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { estado_postulante, ...(motivo || {}) });
  }

  subirPruebaPsicotecnica(id: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('prueba_archivo', archivo, archivo.name);
    return this.http.post<any>(`${this.apiUrl}/${id}/prueba-psicotecnica`, formData);
  }

  descargarPruebaPsicotecnica(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/prueba-psicotecnica`, { observe: 'response', responseType: 'blob' });
  }

  agendarEntrevista(id: string, payload: {
    fecha: string;
    hora: string;
    duracion_minutos?: number;
    modalidad?: string;
    ubicacion_o_enlace?: string;
    entrevistador?: string;
    notas?: string;
    enviar_email?: boolean;
    candidato_nombre?: string;
    candidato_correo?: string;
    candidato_telefono?: string;
    vacante_titulo?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/agendar-entrevista`, payload);
  }

  guardarEvaluacion(id: string, payload: EvaluacionEntrevista): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/evaluacion`, payload);
  }

  ejecutarValidacion(vacanteId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/vacante/${vacanteId}/validar`, {});
  }

  descargarHojaVida(filename: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/download/${encodeURIComponent(filename)}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  descargarHojaVidaCorporativa(candidatoId: string, vacanteTitulo: string, fechaPostulacion: string): Observable<HttpResponse<Blob>> {
    const params = new HttpParams()
      .set('vacante', vacanteTitulo || '')
      .set('fecha', fechaPostulacion || '');
    return this.http.get(`${this.apiUrl}/candidato/${candidatoId}/hoja-vida-docx`, {
      params,
      observe: 'response',
      responseType: 'blob'
    });
  }
}
