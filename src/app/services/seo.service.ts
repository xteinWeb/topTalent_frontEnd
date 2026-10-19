import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SeoData {
  title?: string;
  description?: string;
  noindex?: boolean;
}

export const SITE_URL = 'https://empleo.artdecon.com';
const SITE_NAME = 'Empleo Artdecon';
const DEFAULT_TITLE = 'Empleo Artdecon | Ofertas de trabajo y envío de hoja de vida';
const DEFAULT_DESCRIPTION = 'Portal de empleo de Artdecon. Consulta ofertas de trabajo y vacantes disponibles, postúlate en línea y envía tu hoja de vida de forma rápida y segura.';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document
  ) {}

  // Aplica el SEO definido en `data.seo` de cada ruta en cada navegación
  init(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      let child = this.route.firstChild;
      while (child?.firstChild) {
        child = child.firstChild;
      }
      this.update(child?.snapshot.data['seo'] ?? {});
    });
  }

  update(seo: SeoData): void {
    const title = seo.title ? `${seo.title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const description = seo.description ?? DEFAULT_DESCRIPTION;
    const url = SITE_URL + this.router.url.split(/[?#]/)[0];

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
