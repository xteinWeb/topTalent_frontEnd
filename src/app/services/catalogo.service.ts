import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private apiUrl = `${environment.apiUrl}/catalogos`;

  constructor(private http: HttpClient) {}

  getByTipo(tipo: string): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/${tipo}`).pipe(
      map(res => res.data)
    );
  }
}
