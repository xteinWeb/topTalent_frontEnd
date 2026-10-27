import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PreguntaPrefiltro {
  id: string;
  texto: string;
  tipo: 'si_no' | 'opcion' | 'numero' | 'texto' | 'texto_largo';
  opciones?: string[];
  obligatoria: boolean;
  max?: number;
}

export interface IntentoPrefiltro {
  fecha: string;
  canal: 'telefono' | 'whatsapp';
  resultado: 'no_contesto' | 'contesto' | 'enlace_enviado' | 'respondido';
  registrado_por?: string;
}

export interface Prefiltro {
  intentos: IntentoPrefiltro[];
  respuestas: { [preguntaId: string]: string | number } | null;
  canal: 'telefono' | 'whatsapp' | null;
  respondido_fecha: string | null;
  registrado_por?: string;
  resultado: 'Pasa' | 'No pasa' | null;
  observaciones: string;
  resultado_fecha?: string;
  resultado_por?: string;
}

export interface PrefiltroDetalle {
  postulacion_id: string;
  prefiltro: Prefiltro;
  enlace_expira: string | null;
  preguntas: PreguntaPrefiltro[];
  resultados: string[];
  // Solo al generar el enlace de WhatsApp
  token?: string;
  candidato_nombre?: string;
  candidato_telefono?: string;
  vacante_titulo?: string;
}

export interface PrefiltroPublico {
  nombre: string;
  vacante_titulo: string;
  empresa_nombre: string;
  expira: string;
  preguntas: PreguntaPrefiltro[];
}

@Injectable({
  providedIn: 'root'
})
export class PrefiltroService {
  private postulacionesUrl = `${environment.apiUrl}/postulaciones`;
  private publicoUrl = `${environment.apiUrl}/prefiltro`;

  constructor(private http: HttpClient) {}

  // --- Talento Humano ---
  obtener(postulacionId: string): Observable<PrefiltroDetalle> {
    return this.http.get<{ data: PrefiltroDetalle }>(`${this.postulacionesUrl}/${postulacionId}/prefiltro`).pipe(map(r => r.data));
  }

  registrarLlamada(postulacionId: string, contesto: boolean, respuestas?: { [id: string]: any }): Observable<PrefiltroDetalle> {
    return this.http.post<{ data: PrefiltroDetalle }>(`${this.postulacionesUrl}/${postulacionId}/prefiltro/llamada`, { contesto, respuestas })
      .pipe(map(r => r.data));
  }

  guardarResultado(postulacionId: string, resultado: string, observaciones: string): Observable<PrefiltroDetalle> {
    return this.http.post<{ data: PrefiltroDetalle }>(`${this.postulacionesUrl}/${postulacionId}/prefiltro/resultado`, { resultado, observaciones })
      .pipe(map(r => r.data));
  }

  generarEnlace(postulacionId: string): Observable<PrefiltroDetalle> {
    return this.http.post<{ data: PrefiltroDetalle }>(`${this.postulacionesUrl}/${postulacionId}/prefiltro/enlace`, {}).pipe(map(r => r.data));
  }

  // --- Candidato (enlace público de un solo uso) ---
  consultarPublico(token: string): Observable<PrefiltroPublico> {
    return this.http.get<{ data: PrefiltroPublico }>(`${this.publicoUrl}/${encodeURIComponent(token)}`).pipe(map(r => r.data));
  }

  responderPublico(token: string, respuestas: { [id: string]: any }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.publicoUrl}/${encodeURIComponent(token)}`, { respuestas });
  }
}

// Texto legible de una respuesta guardada (el monto se muestra en pesos)
export function formatearRespuestaPrefiltro(pregunta: PreguntaPrefiltro, valor: string | number | undefined): string {
  if (valor === undefined || valor === null || valor === '') return '—';
  if (pregunta.tipo === 'numero') {
    const n = Number(valor);
    return Number.isFinite(n) ? '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 }) : String(valor);
  }
  if (pregunta.tipo === 'si_no') return valor === 'Si' ? 'Sí' : 'No';
  return String(valor);
}
