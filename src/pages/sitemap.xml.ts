// sitemap.xml (SEO de base, src/lib/seo.ts): la portada y las páginas de src/pages (menos la 404),
// con la dirección pública de la web. Vacío si la web no es indexable.
import type { APIRoute } from 'astro';
import { rutasDePaginas, sitemapXml, urlBase } from '../lib/seo';

const paginas = Object.keys(import.meta.glob('./*.astro'));

export const GET: APIRoute = ({ site }) =>
  new Response(sitemapXml(urlBase(site), rutasDePaginas(paginas)), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
