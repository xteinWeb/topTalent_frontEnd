import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EstadoPostulacion {
  id?: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color_texto?: string;
  color_fondo?: string;
  color_borde?: string;
  orden?: number;
  mostrar_en_pipeline?: boolean;
  es_decision_final?: boolean;
  // Al pasar a este estado se exige el motivo (catálogo MOTIVO_NO_APROBADO + "Otro")
  requiere_motivo?: boolean;
  activo?: boolean;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoPostulacionService {
  private apiUrl = `${environment.apiUrl}/estados-postulacion`;

  constructor(private http: HttpClient) {}

  getEstados(todos: boolean = false): Observable<EstadoPostulacion[]> {
    let params = new HttpParams();
    if (todos) {
      params = params.set('todos', '1');
    }
    return this.http.get<ApiResponse<EstadoPostulacion[]>>(this.apiUrl, { params }).pipe(
      map(res => res.data || [])
    );
  }

  crearEstado(estado: EstadoPostulacion): Observable<any> {
    return this.http.post<ApiResponse<EstadoPostulacion>>(this.apiUrl, estado);
  }

  actualizarEstado(id: string, estado: Partial<EstadoPostulacion>): Observable<any> {
    return this.http.put<ApiResponse<EstadoPostulacion>>(`${this.apiUrl}/${id}`, estado);
  }
}
