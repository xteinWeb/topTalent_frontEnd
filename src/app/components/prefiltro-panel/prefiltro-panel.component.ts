import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PrefiltroService, PrefiltroDetalle, PreguntaPrefiltro, IntentoPrefiltro, formatearRespuestaPrefiltro
} from '../../services/prefiltro.service';

// Prefiltro del candidato en el detalle de la postulación: registrar la llamada telefónica o enviar
// por WhatsApp el enlace de un solo uso al formulario, y decidir si pasa o no.
@Component({
  selector: 'app-prefiltro-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prefiltro-panel.component.html',
  styleUrls: ['./prefiltro-panel.component.css']
})
export class PrefiltroPanelComponent implements OnChanges {
  @Input() postulacionId?: string;
  @Input() puedeEditar = false;
  // Avisa al listado cuando cambia el resultado (para la insignia de la pestaña)
  @Output() resultadoCambio = new EventEmitter<string | null>();

  detalle: PrefiltroDetalle | null = null;
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  // Registro de la llamada
  registrandoLlamada = false;
  contesto: boolean | null = null;
  respuestas: { [id: string]: any } = {};

  // Decisión de Talento Humano
  resultado = '';
  observaciones = '';

  // Enlace de WhatsApp recién generado
  enlace = '';
  enlaceWhatsApp = '';
  enlaceCopiado = false;

  readonly formatear = formatearRespuestaPrefiltro;

  constructor(private prefiltroService: PrefiltroService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['postulacionId'] && this.postulacionId) {
      this.reiniciar();
      this.cargar();
    }
  }

  private reiniciar(): void {
    this.detalle = null;
    this.error = '';
    this.mensaje = '';
    this.registrandoLlamada = false;
    this.contesto = null;
    this.respuestas = {};
    this.enlace = '';
    this.enlaceWhatsApp = '';
  }

  cargar(): void {
    if (!this.postulacionId) return;
    this.cargando = true;
    this.prefiltroService.obtener(this.postulacionId).subscribe({
      next: (detalle) => this.aplicar(detalle),
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'No se pudo cargar el prefiltro.';
      }
    });
  }

  private aplicar(detalle: PrefiltroDetalle): void {
    this.detalle = detalle;
    this.cargando = false;
    this.guardando = false;
    this.resultado = detalle.prefiltro.resultado || '';
    this.observaciones = detalle.prefiltro.observaciones || '';
  }

  get preguntas(): PreguntaPrefiltro[] {
    return this.detalle?.preguntas || [];
  }

  get tieneRespuestas(): boolean {
    return !!this.detalle?.prefiltro.respuestas;
  }

  get intentos(): IntentoPrefiltro[] {
    return [...(this.detalle?.prefiltro.intentos || [])].reverse();
  }

  // Igual que en el backend: sin interés, el resto de preguntas deja de ser obligatorio
  esObligatoria(p: PreguntaPrefiltro): boolean {
    return p.obligatoria && !(this.respuestas['sigue_interesado'] === 'No' && p.id !== 'sigue_interesado');
  }

  textoIntento(i: IntentoPrefiltro): string {
    const textos: { [k: string]: string } = {
      no_contesto: '📞 Llamada sin respuesta',
      contesto: '📞 Llamada: respuestas registradas',
      enlace_enviado: '💬 Enlace enviado por WhatsApp',
      respondido: '💬 El candidato respondió el formulario'
    };
    return textos[i.resultado] || i.resultado;
  }

  iniciarLlamada(): void {
    this.registrandoLlamada = true;
    this.contesto = null;
    this.respuestas = {};
    this.error = '';
    this.mensaje = '';
  }

  cancelarLlamada(): void {
    this.registrandoLlamada = false;
    this.contesto = null;
    this.error = '';
  }

  guardarLlamada(): void {
    if (!this.postulacionId || this.contesto === null) return;

    if (this.contesto) {
      const faltante = this.preguntas.find(p => this.esObligatoria(p) && !String(this.respuestas[p.id] ?? '').trim());
      if (faltante) {
        this.error = `Falta la respuesta: "${faltante.texto}"`;
        return;
      }
    }

    this.guardando = true;
    this.error = '';
    this.prefiltroService.registrarLlamada(this.postulacionId, this.contesto, this.contesto ? this.respuestas : undefined).subscribe({
      next: (detalle) => {
        this.aplicar(detalle);
        this.registrandoLlamada = false;
        this.mensaje = this.contesto ? 'Respuestas registradas.' : 'Intento de llamada registrado.';
        this.contesto = null;
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.error || 'No se pudo guardar la llamada.';
      }
    });
  }

  guardarResultado(): void {
    if (!this.postulacionId || !this.resultado) return;
    this.guardando = true;
    this.error = '';
    this.prefiltroService.guardarResultado(this.postulacionId, this.resultado, this.observaciones).subscribe({
      next: (detalle) => {
        this.aplicar(detalle);
        this.mensaje = `Prefiltro marcado como "${detalle.prefiltro.resultado}".`;
        this.resultadoCambio.emit(detalle.prefiltro.resultado);
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.error || 'No se pudo guardar el resultado.';
      }
    });
  }

  enviarPorWhatsApp(): void {
    if (!this.postulacionId) return;
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.prefiltroService.generarEnlace(this.postulacionId).subscribe({
      next: (detalle) => {
        this.aplicar(detalle);
        // El enlace usa el dominio del portal desde el que trabaja Talento Humano
        this.enlace = `${window.location.origin}/prefiltro/${detalle.token}`;
        this.enlaceWhatsApp = this.construirEnlaceWhatsApp(detalle);
        this.enlaceCopiado = false;
        if (this.enlaceWhatsApp) {
          window.open(this.enlaceWhatsApp, '_blank');
        } else {
          this.error = 'El candidato no tiene un teléfono válido registrado: copie el enlace y envíelo por otro medio.';
        }
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.error || 'No se pudo generar el enlace.';
      }
    });
  }

  private construirEnlaceWhatsApp(detalle: PrefiltroDetalle): string {
    let telefono = String(detalle.candidato_telefono || '').replace(/\D/g, '');
    if (telefono.length === 10) telefono = `57${telefono}`;
    if (telefono.length < 11) return '';

    const nombre = String(detalle.candidato_nombre || '').trim().split(/\s+/)[0] || '';
    const mensaje = `Hola ${nombre}, te saludamos de Talento Humano de Artdecon. Gracias por postularte a la vacante *${detalle.vacante_titulo}*. ` +
      `Para continuar con tu proceso, por favor responde estas preguntas cortas (toma unos 2 minutos): ${this.enlace} ` +
      `El enlace es personal y vence en 72 horas.`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  }

  copiarEnlace(): void {
    if (!this.enlace) return;
    navigator.clipboard?.writeText(this.enlace).then(() => this.enlaceCopiado = true).catch(() => this.enlaceCopiado = false);
  }
}
