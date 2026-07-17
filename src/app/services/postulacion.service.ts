import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Postulacion {
  id?: string;
  vacante_id: string;
  vacante_titulo?: string;
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
    preguntas_respondidas?: any[];
  };
  hv_archivo_nombre?: string;
  hv_archivo_ruta?: string;
  fecha_postulacion?: string;
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
    formData.append('perfil_profesional', JSON.stringify(postulacion.perfil_profesional));
    formData.append('experiencias_json', JSON.stringify(postulacion.experiencias_json));
    formData.append('estudios_json', JSON.stringify(postulacion.estudios_json));
    formData.append('idiomas_json', JSON.stringify(postulacion.idiomas_json));
    formData.append('habilidades_json', JSON.stringify(postulacion.habilidades_json));
    if (archivo) {
      formData.append('hv_archivo', archivo, archivo.name);
    }
    return this.http.post<any>(this.apiUrl, formData);
  }

  postularWebhook(postulacion: any, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('vacante_id', postulacion.vacante_id);
    formData.append('nombre_completo', postulacion.nombre_completo);
    formData.append('correo', postulacion.correo);
    formData.append('telefono', postulacion.telefono || '');
    formData.append('perfil_profesional', JSON.stringify(postulacion.perfil_profesional));
    formData.append('experiencias_json', JSON.stringify(postulacion.experiencias_json));
    formData.append('estudios_json', JSON.stringify(postulacion.estudios_json));
    formData.append('idiomas_json', JSON.stringify(postulacion.idiomas_json));
    formData.append('habilidades_json', JSON.stringify(postulacion.habilidades_json));
    if (archivo) {
      formData.append('hv_archivo', archivo, archivo.name);
    }
    return this.http.post<any>('https://agentes.colchonessunmoon.com/webhook/ef34c04b-32a1-4358-b8d8-28a4d7948690', formData);
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

  getDownloadUrl(filename: string): string {
    return `${this.apiUrl}/download/${filename}`;
  }
}
