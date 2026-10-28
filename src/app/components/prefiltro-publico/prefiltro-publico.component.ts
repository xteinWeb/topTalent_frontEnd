import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PrefiltroService, PrefiltroPublico, PreguntaPrefiltro } from '../../services/prefiltro.service';

// Formulario que abre el candidato desde el enlace enviado por WhatsApp. El token de la URL es de un solo uso.
@Component({
  selector: 'app-prefiltro-publico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prefiltro-publico.component.html',
  styleUrls: ['./prefiltro-publico.component.css']
})
export class PrefiltroPublicoComponent implements OnInit {
  token = '';
  datos: PrefiltroPublico | null = null;
  respuestas: { [id: string]: any } = {};

  cargando = true;
  enviando = false;
  enviado = false;
  error = '';
  errorEnlace = '';
  mensajeFinal = '';

  constructor(private route: ActivatedRoute, private prefiltroService: PrefiltroService) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.prefiltroService.consultarPublico(this.token).subscribe({
      next: (datos) => {
        this.datos = datos;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.errorEnlace = err.error?.error || 'Este enlace no es válido o ya venció.';
      }
    });
  }

  // Si ya no está interesado, no hace falta responder lo demás
  get preguntasVisibles(): PreguntaPrefiltro[] {
    const preguntas = this.datos?.preguntas || [];
    return this.respuestas['sigue_interesado'] === 'No' ? preguntas.filter(p => p.id === 'sigue_interesado' || p.id === 'comentario') : preguntas;
  }

  esObligatoria(p: PreguntaPrefiltro): boolean {
    return p.obligatoria && !(this.respuestas['sigue_interesado'] === 'No' && p.id !== 'sigue_interesado');
  }

  enviar(): void {
    const faltante = this.preguntasVisibles.find(p => this.esObligatoria(p) && !String(this.respuestas[p.id] ?? '').trim());
    if (faltante) {
      this.error = `Por favor responde: "${faltante.texto}"`;
      return;
    }

    this.enviando = true;
    this.error = '';
    this.prefiltroService.responderPublico(this.token, this.respuestas).subscribe({
      next: (res) => {
        this.enviando = false;
        this.enviado = true;
        this.mensajeFinal = res.message;
      },
      error: (err) => {
        this.enviando = false;
        if (err.status === 404) {
          this.errorEnlace = err.error?.error || 'Este enlace ya no es válido.';
        } else {
          this.error = err.error?.error || 'No se pudieron enviar tus respuestas. Intenta de nuevo.';
        }
      }
    });
  }
}
