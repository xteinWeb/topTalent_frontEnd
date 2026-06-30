import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { PerfilJson } from './perfil.service';

export interface Vacante {
  id?: string;
  perfil_id: string;
  perfil_cargo?: string;
  perfil_completo_json?: PerfilJson;
  titulo: string;
  descripcion: string;
  estado?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface ApiResponse<T> {
  data: T;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VacanteService {
  private apiUrl = `${environment.apiUrl}/vacantes`;

  constructor(private http: HttpClient) {}

  getVacantes(): Observable<Vacante[]> {
    return this.http.get<ApiResponse<Vacante[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getVacantesActivas(): Observable<Vacante[]> {
    return this.http.get<ApiResponse<Vacante[]>>(`${this.apiUrl}/public`).pipe(
      map(res => res.data)
    );
  }

  getVacante(id: string): Observable<Vacante> {
    return this.http.get<ApiResponse<Vacante>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  createVacante(vacante: Vacante): Observable<any> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, vacante).pipe(
      map(res => res.data)
    );
  }

  updateVacante(id: string, vacante: Vacante): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, vacante).pipe(
      map(res => res.data)
    );
  }

  deleteVacante(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }
}
