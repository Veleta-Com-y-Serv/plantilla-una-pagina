// llms.txt (SEO de base, src/lib/seo.ts): resumen en texto plano para asistentes de IA (qué hace el negocio,
// dónde, contacto, horario, lo que ofrece con la dirección de cada ficha, las páginas por zona y las preguntas
// frecuentes). Si no es indexable, una línea. Mismo fichero en todas las plantillas.
import type { APIRoute } from 'astro';
import { llmsTxt, urlBase } from '../lib/seo';

export const GET: APIRoute = ({ site }) =>
  new Response(llmsTxt(urlBase(site)), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
