// SEO y GEO de base (NoExpertise). Mismo fichero en las 16 plantillas: no lo cambies en una sola.
// Todo sale de site.yaml: metas de Base.astro, JSON-LD (negocio local y preguntas frecuentes),
// robots.txt, sitemap.xml, llms.txt y los `alt` derivados del contenido. Nunca inventa datos:
// lo que no está en site.yaml no sale.
//
// `seo.url` y `seo.indexable` los escribe la plataforma (el cliente no los edita). Si faltan (webs
// generadas antes), la dirección es la de `Astro.site` (SITE_URL del build) y la web es indexable.
import { site } from '../data/site';

type Crudo = Record<string, any>;
const S = site as unknown as Crudo;

const texto = (v: unknown) => (v == null ? '' : String(v).trim());
const sinPunto = (t: string) => t.replace(/[\s.;,:]+$/, '');
const unaLinea = (t: string) => t.replace(/\s+/g, ' ').trim();
const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------------------------------------------------------------------------------------------
// Dirección de la web e indexación
// ---------------------------------------------------------------------------------------------

/** ¿Pueden indexarla los buscadores? Solo `seo.indexable: false` la deja fuera. */
export const indexable = (): boolean => S.seo?.indexable !== false;

/** Dirección pública de la web, sin barra final («https://www.ejemplo.es»), o '' si no se sabe. */
export function urlBase(astroSite?: URL | string): string {
  const propia = texto(S.seo?.url);
  const base = propia || (astroSite ? String(astroSite) : '');
  if (!/^https?:\/\//i.test(base)) return '';
  return base.replace(/\/+$/, '');
}

/** Dirección absoluta de una ruta de la web («/fotos/hero.jpg» → «https://…/fotos/hero.jpg»), o '' si no se puede. */
export function absoluta(ruta: string | undefined, base: string): string {
  const r = texto(ruta);
  if (!r) return '';
  if (/^https?:\/\//i.test(r)) return r;
  if (!base || r.startsWith('//')) return '';
  return base + (r.startsWith('/') ? r : '/' + r);
}

/** Dirección canónica de una página («/», «/aviso-legal/»…), o '' si no se sabe la dirección de la web (o es la 404). */
export function canonica(ruta: string, base: string): string {
  const r = ruta.startsWith('/') ? ruta : '/' + ruta;
  return base && !/^\/404(\.html|\/)?$/.test(r) ? base + r : '';
}

// ---------------------------------------------------------------------------------------------
// Imágenes y textos alternativos
// ---------------------------------------------------------------------------------------------

const listaDeTextos = (v: unknown): string[] => (Array.isArray(v) ? v.map(texto).filter(Boolean) : []);

/** Foto principal de la portada: `hero.imagen` o, si no hay, la primera de su galería. */
export function imagenHero(): string {
  const h = (S.secciones?.hero ?? {}) as Crudo;
  return texto(h.imagen) || listaDeTextos(h.galeria)[0] || listaDeTextos(h.imagenes)[0] || listaDeTextos(h.fotos)[0] || '';
}

/** ¿Sirve para compartir en redes? (los SVG de relleno no). */
const esFoto = (ruta: string) => !!ruta && !/\.svg(\?|#|$)/i.test(ruta);

/** Imagen para og:image (absoluta), o '' si no hay foto o no se sabe la dirección de la web. */
export const imagenCompartir = (base: string): string => (esFoto(imagenHero()) ? absoluta(imagenHero(), base) : '');

/** `alt` de la foto de portada: nombre y eslogan. */
export function altHero(): string {
  const eslogan = sinPunto(texto(S.eslogan));
  const nombre = texto(S.nombre);
  return eslogan ? `${nombre}: ${eslogan}` : nombre;
}

/** `alt` de una foto de galería: «Nombre, foto 3» (n empieza en 0). */
export const altGaleria = (n: number): string => `${texto(S.nombre)}, foto ${n + 1}`;

/** `alt` de la foto de una sección: su título o, si no tiene, el nombre del negocio. */
export const altSeccion = (s?: Crudo | null): string => sinPunto(texto(s?.titulo)) || texto(S.nombre);

/** `alt` de una ficha (servicio, plato, curso…): su título o nombre; de respaldo, el nombre del negocio. */
export const altFicha = (f?: Crudo | null): string => texto(f?.titulo) || texto(f?.nombre) || texto(S.nombre);

// ---------------------------------------------------------------------------------------------
// Dirección postal, horario, redes y zonas
// ---------------------------------------------------------------------------------------------

export interface Postal { calle?: string; cp: string; localidad: string; provincia?: string }

/**
 * «Calle Mayor 32, 19250 Sigüenza (Guadalajara)» → calle, código postal, localidad y provincia.
 * La regla: lo último es «<5 cifras> <localidad> (<provincia>)»; la provincia es opcional y lo de
 * antes de la última coma, la calle. Si no encaja, null (y la dirección va como texto).
 */
export function direccionPostal(direccion?: string): Postal | null {
  const d = sinPunto(texto(direccion));
  const m = d.match(/^(?:(.*?),\s*)?(\d{5})\s+([^,()]+?)\s*(?:\(([^()]+)\))?$/);
  if (!m) return null;
  const [, calle, cp, localidad, provincia] = m;
  return { ...(texto(calle) && { calle: texto(calle) }), cp, localidad: texto(localidad), ...(texto(provincia) && { provincia: texto(provincia) }) };
}

/** Localidad para los textos («Sigüenza (Guadalajara)»), o '' si la dirección no la deja ver. */
export function localidad(): string {
  const p = direccionPostal(S.contacto?.direccion);
  return p ? p.localidad + (p.provincia && p.provincia !== p.localidad ? ` (${p.provincia})` : '') : '';
}

const DIAS: Record<string, number> = { lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4, sabado: 5, sabados: 5, domingo: 6, domingos: 6 };
const CODIGOS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DIA = /\b(lunes|martes|miercoles|jueves|viernes|sabados?|domingos?|fin(?:es)? de semana|todos los dias|a diario)\b/g;
const HORAS = /\b(\d{1,2})(?:[:.](\d{2}))?\s*h?\s*(?:a|-|–|—|hasta)\s*(?:las\s+)?(\d{1,2})(?:[:.](\d{2}))?\b/g;

const hora = (h: string, m?: string) => {
  const hh = Number(h), mm = Number(m ?? '0');
  return hh <= 24 && mm < 60 ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : '';
};

/** Días de un trozo de texto («de martes a domingo», «viernes y sábado») → «Tu-Su», «Fr,Sa». */
function dias(trozo: string): string {
  const fichas: { ini: number; fin: number; desde: number; hasta: number }[] = [];
  for (const m of trozo.matchAll(DIA)) {
    const t = m[1];
    const [desde, hasta] = t.startsWith('fin') ? [5, 6] : t === 'todos los dias' || t === 'a diario' ? [0, 6] : [DIAS[t], DIAS[t]];
    fichas.push({ ini: m.index!, fin: m.index! + t.length, desde, hasta });
  }
  const grupos: [number, number][] = [];
  for (let i = 0; i < fichas.length; i++) {
    const f = fichas[i], sig = fichas[i + 1];
    if (sig && /^\s*(a|al|hasta|-|–)\s*$/.test(trozo.slice(f.fin, sig.ini))) {
      grupos.push([f.desde, sig.hasta]);
      i++;
    } else grupos.push([f.desde, f.hasta]);
  }
  return grupos.map(([a, b]) => (a === b ? CODIGOS[a] : `${CODIGOS[a]}-${CODIGOS[b]}`)).join(',');
}

/**
 * Horario en formato schema.org («Mo-Fr 09:00-14:00») a partir de un texto libre
 * («Lunes a viernes, de 9:00 a 14:00 y de 16:00 a 19:00. Sábados, de 10:00 a 13:00.»).
 * Cada frase con días y horas da sus tramos; las que no tienen horas («Sábados, con cita.»,
 * «cerrado») no dan nada. Si hay horas sin días, no se deduce nada (lista vacía).
 */
export function horarioSchema(lineas: string[]): string[] {
  const out: string[] = [];
  for (const linea of lineas) {
    for (const frase of sinTildes(linea).split(/(?<!\d)[.;](?!\d)|\n/)) {
      // Cada grupo de días se queda con las horas que le siguen, hasta el siguiente grupo de días.
      const marcas = [...frase.matchAll(DIA)].map((m) => ({ dia: true, ini: m.index!, fin: m.index! + m[0].length, m }));
      const horas = [...frase.matchAll(HORAS)].map((m) => ({ dia: false, ini: m.index!, fin: m.index! + m[0].length, m }));
      if (!horas.length) continue;
      let grupoIni = -1, grupoFin = -1, trasHora = true, actual = '';
      for (const ev of [...marcas, ...horas].sort((a, b) => a.ini - b.ini)) {
        if (ev.dia) {
          if (trasHora) grupoIni = ev.ini;
          grupoFin = ev.fin;
          trasHora = false;
          continue;
        }
        if (grupoIni >= 0 && !trasHora) actual = dias(frase.slice(grupoIni, grupoFin));
        trasHora = true;
        const ini = hora(ev.m[1], ev.m[2]), fin = hora(ev.m[3], ev.m[4]);
        if (!actual || !ini || !fin) return [];
        out.push(`${actual} ${ini}-${fin}`);
      }
    }
  }
  return [...new Set(out)];
}

/** Líneas de horario: la lista `horario` de una sección activa si la hay; si no, `contacto.horario`. */
export function lineasHorario(): string[] {
  for (const s of Object.values((S.secciones ?? {}) as Record<string, Crudo>)) {
    if (!s?.activa || !Array.isArray(s.horario)) continue;
    const l = s.horario.map((h: Crudo) => [texto(h?.dia), texto(h?.horas)].filter(Boolean).join(': ')).filter(Boolean);
    if (l.length) return l;
  }
  const h = texto(S.contacto?.horario);
  return h ? [h] : [];
}

/** Perfiles en redes: solo direcciones completas de un perfil (no la portada de la red). */
export function redes(): string[] {
  return Object.values((S.redes ?? {}) as Record<string, unknown>)
    .map(texto)
    .filter((u) => {
      try {
        const x = new URL(u);
        return /^https?:$/.test(x.protocol) && x.pathname.replace(/\/+$/, '') !== '';
      } catch {
        return false;
      }
    });
}

const disenyo = (id: string, s: Crudo) => texto(s?.tipo) || id;

/** Zonas donde trabaja (sección `zonas` activa): sus títulos. */
export function zonas(): string[] {
  const out: string[] = [];
  for (const [id, s] of Object.entries((S.secciones ?? {}) as Record<string, Crudo>)) {
    if (!s?.activa || disenyo(id, s) !== 'zonas' || !Array.isArray(s.items)) continue;
    for (const z of s.items) {
      const n = texto(z?.titulo) || texto(z?.nombre) || texto(z?.zona);
      if (n) out.push(n);
    }
  }
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------------------------
// Preguntas frecuentes y colecciones (servicios, platos, cursos, productos…)
// ---------------------------------------------------------------------------------------------

export interface Pregunta { pregunta: string; respuesta: string }

/** Preguntas de las secciones de preguntas activas (`preguntas` o `tipo: preguntas`) con pregunta y respuesta. */
export function preguntas(): Pregunta[] {
  const out: Pregunta[] = [];
  for (const [id, s] of Object.entries((S.secciones ?? {}) as Record<string, Crudo>)) {
    if (!s?.activa || disenyo(id, s) !== 'preguntas' || !Array.isArray(s.preguntas)) continue;
    for (const p of s.preguntas) {
      const pregunta = texto(p?.pregunta), respuesta = texto(p?.respuesta);
      if (pregunta && respuesta) out.push({ pregunta, respuesta });
    }
  }
  return out;
}

/** Secciones que no son lo que ofrece el negocio (pasos, opiniones, equipo, cifras, contacto…). */
const NO_SON_OFERTA = new Set([
  'hero', 'contacto', 'proceso', 'citas', 'cita', 'reservas', 'inscripcion', 'presupuesto', 'valoracion',
  'hazte-socio', 'cifras', 'resultados', 'clientes', 'opiniones', 'testimonios', 'equipo', 'profesores',
  'entrenadores', 'preguntas', 'horario-ubicacion', 'horario-clases', 'como-llegar', 'entorno', 'zonas',
  'sobre', 'sobre-nosotros', 'metodo', 'ventajas', 'trayectoria', 'noticias', 'cta', 'texto',
]);
/** Listas que nunca son la oferta, en cualquier sección. */
const LISTAS_FUERA = new Set(['personas', 'testimonios', 'opiniones', 'preguntas', 'horario', 'clases_horario', 'hitos', 'noticias', 'galeria', 'menu']);

export interface Elemento { nombre: string; precio: string; texto: string; grupo: string }
export interface Coleccion { titulo: string; elementos: Elemento[] }

/**
 * Lo que ofrece el negocio, sección a sección: cada lista de objetos con `titulo` o `nombre`
 * (servicios, platos, habitaciones, cursos, productos, tarifas, packs, inmuebles…), con su precio
 * (y `periodo`) si lo tiene y su texto. Vale para cualquier plantilla: no hay casos por plantilla.
 */
export function colecciones(): Coleccion[] {
  const out: Coleccion[] = [];
  for (const [id, s] of Object.entries((S.secciones ?? {}) as Record<string, Crudo>)) {
    if (!s?.activa || NO_SON_OFERTA.has(disenyo(id, s))) continue;
    for (const [clave, valor] of Object.entries(s)) {
      if (LISTAS_FUERA.has(clave) || !Array.isArray(valor)) continue;
      const elementos: Elemento[] = [];
      for (const e of valor) {
        if (!e || typeof e !== 'object') continue;
        const nombre = texto(e.titulo) || texto(e.nombre);
        if (!nombre) continue;
        const precio = texto(e.precio);
        const incluye = texto(e.incluye).split(/\s*[;\n]\s*/).filter(Boolean).join(', ');
        elementos.push({
          nombre,
          precio: precio && texto(e.periodo) ? `${precio} · ${texto(e.periodo)}` : precio,
          texto: unaLinea(texto(e.texto) || (incluye && `Incluye: ${incluye}`)),
          grupo: texto(e.categoria),
        });
      }
      if (elementos.length) out.push({ titulo: sinPunto(texto(s.titulo)) || id, elementos });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------------------------

/** JSON-LD del negocio (tipo `seo.tipo`). Solo lo que hay en site.yaml. */
export function jsonLdNegocio(base: string, tipoPorDefecto = 'LocalBusiness'): Crudo {
  const c = (S.contacto ?? {}) as Crudo;
  const postal = direccionPostal(c.direccion);
  const imagenes = [esFoto(imagenHero()) ? absoluta(imagenHero(), base) : '', absoluta(S.logo, base)].filter(Boolean);
  const horario = horarioSchema(lineasHorario());
  const sameAs = redes();
  const area = zonas();
  const descripcion = texto(S.seo?.descripcion) || texto(S.eslogan);
  return {
    '@context': 'https://schema.org',
    '@type': texto(S.seo?.tipo) || tipoPorDefecto,
    ...(base && { '@id': base + '/#negocio', url: base + '/' }),
    name: texto(S.nombre),
    ...(descripcion && { description: descripcion }),
    ...(texto(c.telefono) && { telephone: texto(c.telefono) }),
    ...(texto(c.email) && { email: texto(c.email) }),
    ...(postal
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(postal.calle && { streetAddress: postal.calle }),
            postalCode: postal.cp,
            addressLocality: postal.localidad,
            ...(postal.provincia && { addressRegion: postal.provincia }),
            addressCountry: 'ES',
          },
        }
      : texto(c.direccion) && { address: texto(c.direccion) }),
    ...(horario.length && { openingHours: horario.length === 1 ? horario[0] : horario }),
    ...(imagenes.length && { image: imagenes.length === 1 ? imagenes[0] : imagenes }),
    ...(absoluta(S.logo, base) && { logo: absoluta(S.logo, base) }),
    ...(sameAs.length && { sameAs }),
    ...(area.length && { areaServed: area }),
  };
}

/** JSON-LD FAQPage con las preguntas frecuentes, o null si no hay ninguna. */
export function jsonLdPreguntas(): Crudo | null {
  const p = preguntas();
  if (!p.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.map((x) => ({ '@type': 'Question', name: x.pregunta, acceptedAnswer: { '@type': 'Answer', text: x.respuesta } })),
  };
}

/** JSON listo para un <script type="application/ld+json"> (sin «</script>» posible dentro). */
export const jsonSeguro = (o: unknown): string => JSON.stringify(o).replace(/</g, '\\u003c');

// ---------------------------------------------------------------------------------------------
// robots.txt, sitemap.xml y llms.txt
// ---------------------------------------------------------------------------------------------

export function robotsTxt(base: string): string {
  if (!indexable()) return 'User-agent: *\nDisallow: /\n';
  return 'User-agent: *\nAllow: /\n' + (base ? `\nSitemap: ${base}/sitemap.xml\n` : '');
}

/** Rutas de las páginas a partir de los ficheros de src/pages («./aviso-legal.astro» → «/aviso-legal/»). */
export function rutasDePaginas(ficheros: string[]): string[] {
  const rutas = ficheros
    .map((f) => f.split('/').pop()!.replace(/\.astro$/, ''))
    .filter((n) => n && n !== '404' && n !== '500' && !n.startsWith('_') && !n.includes('['))
    .map((n) => (n === 'index' ? '/' : `/${n}/`));
  return [...new Set(rutas)].sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
}

const xml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function sitemapXml(base: string, rutas: string[]): string {
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = indexable() && base ? rutas.map((r) => `  <url><loc>${xml(base + r)}</loc><lastmod>${hoy}</lastmod></url>\n`).join('') : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;
}

/** Resumen en texto plano para asistentes de IA (https://llmstxt.org). */
export function llmsTxt(base: string): string {
  const nombre = texto(S.nombre);
  if (!indexable()) return `${nombre}: esta web es una vista previa y todavía no está publicada en su dirección definitiva.\n`;

  const c = (S.contacto ?? {}) as Crudo;
  const h = (S.secciones?.hero ?? {}) as Crudo;
  const l: string[] = [`# ${nombre}`, ''];
  const eslogan = unaLinea(texto(S.eslogan));
  if (eslogan) l.push(`> ${eslogan}`, '');
  const que = [texto(h.titulo), texto(h.texto)].map((t) => sinPunto(unaLinea(t))).filter(Boolean);
  if (que.length) l.push(que.join('. ') + '.', '');
  const desc = unaLinea(texto(S.seo?.descripcion));
  if (desc && desc !== eslogan) l.push(desc, '');

  const datos: string[] = [];
  const loc = localidad();
  if (loc) datos.push(`- Localidad: ${loc}`);
  if (texto(c.direccion)) datos.push(`- Dirección: ${texto(c.direccion)}`);
  if (texto(c.telefono)) datos.push(`- Teléfono: ${texto(c.telefono)}`);
  if (texto(c.whatsapp)) datos.push(`- WhatsApp: ${texto(c.whatsapp)}`);
  if (texto(c.email)) datos.push(`- Correo: ${texto(c.email)}`);
  const area = zonas();
  if (area.length) datos.push(`- Zonas: ${area.join(', ')}`);
  for (const r of redes()) datos.push(`- Redes: ${r}`);
  if (base) datos.push(`- Web: ${base}/`);
  if (datos.length) l.push('## Datos de contacto', '', ...datos, '');

  const horario = lineasHorario();
  if (horario.length) l.push('## Horario', '', ...horario.map((x) => `- ${unaLinea(x)}`), '');

  for (const col of colecciones()) {
    l.push(`## ${col.titulo}`, '');
    for (const e of col.elementos) {
      const cabeza = e.grupo && sinTildes(e.grupo) !== sinTildes(col.titulo) ? `${e.nombre} (${e.grupo})` : e.nombre;
      l.push(`- ${cabeza}${e.precio ? `: ${e.precio}` : ''}${e.texto ? ` — ${e.texto}` : ''}`);
    }
    l.push('');
  }

  const p = preguntas();
  if (p.length) {
    l.push('## Preguntas frecuentes', '');
    for (const x of p) l.push(`### ${unaLinea(x.pregunta)}`, '', unaLinea(x.respuesta), '');
  }
  return l.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
