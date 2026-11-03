// Varias páginas (NoExpertise, docs/plantillas.md § Varias páginas): con `paginas:` en site.yaml la web deja de
// ser una página larga y pasa a Inicio + una página por entrada (/servicios/, /contacto/…), cada una con sus
// secciones. Sin `paginas` (o vacía) no cambia nada. Mismo fichero en todas las plantillas: no lo cambies en una
// sola. No importa src/data/site.ts (que lo llama): todo sale de lo que recibe conPaginas().
//
// Reglas (las mismas que App\Plantillas\Paginas en la plataforma):
// - Cada página: `ruta` (minúsculas, cifras y guiones; única; no reservada), `titulo` (≤ 40) y `secciones`
//   («servicios; planes»). Como mucho 6. `hero` nunca va a una página y cada sección va a una sola.
// - Inicio = hero + las secciones activas que no están en ninguna página, en el orden de site.yaml.
// - Una página sin ninguna sección activa no se genera ni sale en el menú.
// - El menú se deriva: Inicio + las páginas + los enlaces de `menu` que no son anclas «/#…».
// - Cualquier dirección «/#<id>» del site.yaml se cambia por la de esa sección (enlace()).

type Crudo = Record<string, any>;

export interface Pagina { ruta: string; titulo: string; url: string; secciones: string[] }

/** Rutas que no puede usar una página (las de la web y sus carpetas; igual que Fichas::RESERVADAS). */
export const RESERVADAS = ['zonas', 'aviso-legal', 'index', '404', '500', 'fotos', 'placeholders', 'img', 'imagenes', '_astro',
  'sitemap', 'robots', 'llms', 'favicon', 'api', 'admin', 'assets', 'logo'];
export const RUTA = /^[a-z][a-z0-9-]{1,39}$/;
export const MAX_PAGINAS = 6;
export const MAX_TITULO = 40;

const texto = (v: unknown) => (v == null ? '' : String(v).trim());
const partes = (v: unknown) => texto(v).split(/\s*[;\n]\s*/).map((x) => x.trim()).filter(Boolean);
const esObjeto = (v: unknown): v is Crudo => !!v && typeof v === 'object' && !Array.isArray(v);

let PAGINAS: Pagina[] = [];
let INICIO: string[] = [];
const DONDE = new Map<string, Pagina>();

/** Normaliza una ruta de página («/servicios/», «servicios», «/servicios/index.html») a «/servicios/»; Inicio, «/». */
function normalizarUrl(url: string): string {
  const r = texto(url).replace(/[?#].*$/, '').replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');
  return r ? `/${r}/` : '/';
}

/**
 * Recibe el site.yaml tal cual y, si tiene `paginas`, guarda el reparto y devuelve una copia con el menú derivado y
 * las direcciones «/#id» cambiadas por las reales. Sin `paginas`, devuelve el mismo objeto.
 */
export function conPaginas<T>(d: T): T {
  PAGINAS = [];
  INICIO = [];
  DONDE.clear();
  const raiz = (esObjeto(d) ? d : {}) as Crudo;
  const secciones = (esObjeto(raiz.secciones) ? raiz.secciones : {}) as Crudo;
  const activas = Object.keys(secciones).filter((id) => esObjeto(secciones[id]) && secciones[id].activa === true);
  const crudas = Array.isArray(raiz.paginas) ? raiz.paginas.filter(esObjeto) : [];
  if (!crudas.length) {
    INICIO = activas;
    return d;
  }

  const rutas = new Set<string>();
  const asignadas = new Set<string>();
  const validas: { ruta: string; titulo: string; ids: string[] }[] = [];
  for (const p of crudas) {
    if (validas.length >= MAX_PAGINAS) break;
    const ruta = texto(p.ruta);
    if (!RUTA.test(ruta) || RESERVADAS.includes(ruta) || rutas.has(ruta)) continue;
    const ids: string[] = [];
    for (const id of partes(p.secciones)) {
      if (id === 'hero' || !(id in secciones) || asignadas.has(id)) continue;
      asignadas.add(id);
      ids.push(id);
    }
    rutas.add(ruta);
    const titulo = texto(p.titulo).slice(0, MAX_TITULO).trim() || ruta.charAt(0).toUpperCase() + ruta.slice(1).replace(/-/g, ' ');
    validas.push({ ruta, titulo, ids });
  }
  for (const v of validas) {
    const ids = activas.filter((id) => v.ids.includes(id));
    if (!ids.length) continue;
    const pagina: Pagina = { ruta: v.ruta, titulo: v.titulo, url: `/${v.ruta}/`, secciones: ids };
    PAGINAS.push(pagina);
    for (const id of ids) DONDE.set(id, pagina);
  }
  INICIO = activas.filter((id) => !asignadas.has(id));
  if (!PAGINAS.length) return d;

  const reescrito = reescribir(raiz) as Crudo;
  const externos = (Array.isArray(raiz.menu) ? raiz.menu : [])
    .filter((e: unknown) => esObjeto(e) && texto(e.url) && !texto(e.url).startsWith('/#') && texto(e.url) !== '/');
  reescrito.menu = [{ texto: 'Inicio', url: '/' }, ...PAGINAS.map((p) => ({ texto: p.titulo, url: p.url })), ...externos];
  return reescrito as T;
}

/** Copia del árbol con cada valor «/#id» cambiado por enlace(). */
function reescribir(v: unknown): unknown {
  if (typeof v === 'string') return /^\/#[A-Za-z0-9_-]+$/.test(v) ? enlace(v) : v;
  if (Array.isArray(v)) return v.map(reescribir);
  if (esObjeto(v)) {
    const out: Crudo = {};
    for (const [k, x] of Object.entries(v)) out[k] = k === 'paginas' ? x : reescribir(x);
    return out;
  }
  return v;
}

/** ¿La web es de varias páginas? (tiene al menos una página con secciones activas). */
export const multipagina = (): boolean => PAGINAS.length > 0;

/** Las páginas que se generan, en el orden de `paginas`: [{ruta, titulo, url, secciones}]. */
export const paginas = (): Pagina[] => PAGINAS;

/** Ids de las secciones de Inicio («/») o de una página («/servicios/»), en el orden de site.yaml. */
export function seccionesDe(url: string): string[] {
  const u = normalizarUrl(url);
  if (u === '/') return INICIO;
  return PAGINAS.find((p) => p.url === u)?.secciones ?? [];
}

/** Página donde se pinta una sección: «/» (Inicio) o «/servicios/». */
export const paginaDeSeccion = (id: string): string => DONDE.get(id)?.url ?? '/';

/** Dirección de una sección: «/#id» en Inicio, «/servicios/» si abre su página, «/servicios/#id» si no. */
export function rutaDeSeccion(id: string): string {
  const p = DONDE.get(id);
  if (!p) return `/#${id}`;
  return p.secciones[0] === id ? p.url : `${p.url}#${id}`;
}

/** Cambia una dirección «/#id» por la real de esa sección; cualquier otra, tal cual. */
export function enlace(url: string): string {
  const m = /^\/#([A-Za-z0-9_-]+)$/.exec(texto(url));
  return m && DONDE.has(m[1]) ? rutaDeSeccion(m[1]) : url;
}

/** Normaliza una ruta de la web («/contacto», «/contacto/index.html») a «/contacto/» (o «/»). */
export const rutaNormalizada = normalizarUrl;
