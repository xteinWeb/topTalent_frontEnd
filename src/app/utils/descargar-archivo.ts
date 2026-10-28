import { HttpResponse } from '@angular/common/http';

// Las descargas protegidas se piden con HttpClient (para enviar el token) y se guardan desde el blob,
// ya que un window.open / location.href no puede llevar la cabecera Authorization.
export function guardarArchivoDescargado(res: HttpResponse<Blob>, nombrePorDefecto: string): void {
  if (!res.body) return;

  const disposition = res.headers.get('Content-Disposition') || '';
  // Se prefiere filename* (UTF-8, conserva tildes) sobre el filename ASCII de respaldo
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const ascii = /filename="?([^";]+)"?/i.exec(disposition);
  const nombre = utf8 ? decodeURIComponent(utf8[1]) : (ascii ? ascii[1] : nombrePorDefecto);

  const url = URL.createObjectURL(res.body);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
