import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type RolAdmin = 'SUPERADMIN' | 'GERENCIA' | 'TALENTO_HUMANO' | 'LIDER_AREA';

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  username: string;
  email: string;
  rol: RolAdmin;
  area: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface UsuarioAdminForm {
  nombre: string;
  username?: string;
  email: string;
  rol: RolAdmin;
  area: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioAdminService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<{ data: UsuarioAdmin[]; roles: Array<{ id: RolAdmin; nombre: string }> }> {
    return this.http.get<{ data: UsuarioAdmin[]; roles: Array<{ id: RolAdmin; nombre: string }> }>(this.apiUrl);
  }

  crear(datos: UsuarioAdminForm): Observable<UsuarioAdmin> {
    return this.http.post<{ data: UsuarioAdmin }>(this.apiUrl, datos).pipe(map(r => r.data));
  }

  actualizar(id: string, datos: Partial<UsuarioAdminForm> & { activo?: boolean }): Observable<UsuarioAdmin> {
    return this.http.put<{ data: UsuarioAdmin }>(`${this.apiUrl}/${id}`, datos).pipe(map(r => r.data));
  }
}
