// Páginas propias (NoExpertise): una ficha por elemento de las listas de `src/data/fichas.ts` que tenga `detalle`
// (/<ruta>/<slug>/) y una página por zona con `texto` (/zonas/<slug>/). Mismo fichero en todas las plantillas:
// no lo cambies en una sola. Lo que cambia de una plantilla a otra está en src/data/fichas.ts (espejo de
// `fichas:` y `zonas:` de template.yaml) y en el diseño de src/pages/[coleccion]/[slug].astro y zonas/[slug].astro.
// Nunca inventa nada: un elemento sin `detalle` o una zona sin `texto` no tienen página.
import { site } from '../data/site';
import { FICHAS, ZONAS } from '../data/fichas';
import { detalleAParrafos, listaDeFotos, slugify, slugsUnicos } from './slug';

type Crudo = Record<string, any>;

/** Una lista con ficha: `secciones.<lista>.<campo>` → /<ruta>/<slug>/. `tipo`: el de schema.org (Service, Product…). */
export interface DefFicha { lista: string; campo?: string; ruta: string; nombre: string; tipo?: string }
/** Páginas por zona: `secciones.<seccion>.items` (por defecto `zonas`) → /<ruta>/<slug>/ (por defecto /zonas/). */
export interface DefZonas { ruta?: string; seccion?: string }

export interface Dato { clave: string; etiqueta: string; valor: string }

export interface Ficha {
  def: DefFicha;
  idSeccion: string;
  seccion: Crudo;
  elemento: Crudo;
  slug: string;
  url: string;
  titulo: string;
  texto: string;
  detalle: string[];
  imagen: string;
  imagenes: string[];
  precio: string;
  categoria: string;
  icono: string;
  datos: Dato[];
}

export interface Zona {
  idSeccion: string;
  seccion: Crudo;
  elemento: Crudo;
  slug: string;
  url: string;
  nombre: string;
  texto: string[];
  imagen: string;
}

const texto = (v: unknown) => (v == null ? '' : String(v).trim());
const objetos = (v: unknown): Crudo[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) : []);
const S = site as unknown as Crudo;

/** Nombre de un elemento: `titulo` o `nombre`. */
export const nombreDe = (e: Crudo): string => texto(e?.titulo) || texto(e?.nombre);

/** Campos que no van a la tabla de datos (salen en otro sitio de la ficha o no son para leer). */
const FUERA_DE_DATOS = new Set(['titulo', 'nombre', 'texto', 'detalle', 'slug', 'imagen', 'imagenes', 'foto', 'imagen_antes', 'icono', 'url', 'destacado', 'activa', 'tipo']);

/** Etiquetas de los campos habituales; el resto, la clave con mayúscula y sin guiones. */
const ETIQUETAS: Record<string, string> = {
  precio: 'Precio', duracion: 'Duración', nivel: 'Nivel', incluye: 'Qué incluye', categoria: 'Tipo', personas: 'Personas',
  extras: 'Extras', caracteristicas: 'Características', metros: 'Metros', habitaciones: 'Habitaciones', banos: 'Baños',
  plazas: 'Plazas', modalidad: 'Modalidad', inicio: 'Inicio', periodo: 'Periodo', lugar: 'Lugar', ref: 'Referencia',
  estado: 'Estado', operacion: 'Operación', zona: 'Zona', anio: 'Año', fecha: 'Fecha', hora: 'Hora', horas: 'Horario',
  dia: 'Día', cuando: 'Cuándo', validez: 'Validez', intensidad: 'Intensidad', monitor: 'Monitor', edad: 'Edad',
  distancia: 'Distancia', desnivel: 'Desnivel', dificultad: 'Dificultad', idioma: 'Idioma', idiomas: 'Idiomas',
  capacidad: 'Capacidad', superficie: 'Superficie', variedad: 'Variedad', uva: 'Uva', crianza: 'Crianza', formato: 'Formato',
  material: 'Material', medidas: 'Medidas', plazo: 'Plazo', garantia: 'Garantía', sesiones: 'Sesiones', horario: 'Horario',
};
const etiquetaDe = (k: string) => ETIQUETAS[k] ?? (k.charAt(0).toUpperCase() + k.slice(1)).replace(/[_-]+/g, ' ');

/** Datos del elemento para la tabla de la ficha: sus campos de texto con valor (las listas «a; b», con comas). */
export function datosDe(e: Crudo): Dato[] {
  const out: Dato[] = [];
  for (const [clave, v] of Object.entries(e ?? {})) {
    if (FUERA_DE_DATOS.has(clave) || (typeof v !== 'string' && typeof v !== 'number')) continue;
    const valor = String(v).split(/\s*;\s*/).map((x) => x.trim()).filter(Boolean).join(', ');
    if (valor) out.push({ clave, etiqueta: etiquetaDe(clave), valor });
  }
  return out;
}

/** Sección activa por id (sin depender de las funciones de src/data/site.ts, que cambian de plantilla a plantilla). */
function seccionActiva(id: string): Crudo | null {
  const s = (S.secciones ?? {})[id];
  return s && typeof s === 'object' && s.activa === true ? (s as Crudo) : null;
}

const porElemento = new Map<object, string>();

function calcularFichas(): Ficha[] {
  const out: Ficha[] = [];
  const rutas = new Set<string>();
  for (const def of FICHAS) {
    const s = seccionActiva(def.lista);
    if (!s || !def.ruta || rutas.has(def.ruta)) continue;
    rutas.add(def.ruta);
    const conPagina = objetos(s[def.campo || 'items']).filter((e) => nombreDe(e) && detalleAParrafos(e.detalle).length);
    const slugs = slugsUnicos(conPagina.map((e) => ({ slug: e.slug, nombre: nombreDe(e) })));
    conPagina.forEach((e, i) => {
      const url = `/${def.ruta}/${slugs[i]}/`;
      const imagenes = listaDeFotos(e.imagenes);
      porElemento.set(e, url);
      out.push({
        def,
        idSeccion: def.lista,
        seccion: s,
        elemento: e,
        slug: slugs[i],
        url,
        titulo: nombreDe(e),
        texto: texto(e.texto) || texto(e.descripcion),
        detalle: detalleAParrafos(e.detalle),
        imagen: texto(e.imagen) || texto(e.foto) || imagenes[0] || '',
        imagenes: texto(e.imagen) || texto(e.foto) ? imagenes : imagenes.slice(1),
        precio: texto(e.precio),
        categoria: texto(e.categoria),
        icono: texto(e.icono),
        datos: datosDe(e),
      });
    });
  }
  return out;
}

function calcularZonas(): Zona[] {
  if (!ZONAS) return [];
  const idSeccion = ZONAS.seccion || 'zonas';
  const s = seccionActiva(idSeccion);
  if (!s) return [];
  const conPagina = objetos(s.items).filter((z) => (texto(z.titulo) || texto(z.nombre)) && detalleAParrafos(z.texto).length);
  const slugs = slugsUnicos(conPagina.map((z) => ({ slug: z.slug, nombre: texto(z.titulo) || texto(z.nombre) })));
  return conPagina.map((z, i) => {
    const url = `/${ZONAS.ruta || 'zonas'}/${slugs[i]}/`;
    porElemento.set(z, url);
    return {
      idSeccion,
      seccion: s,
      elemento: z,
      slug: slugs[i],
      url,
      nombre: texto(z.titulo) || texto(z.nombre),
      texto: detalleAParrafos(z.texto),
      imagen: texto(z.imagen),
    };
  });
}

const FICHAS_CALCULADAS = calcularFichas();
const ZONAS_CALCULADAS = calcularZonas();

/** Todas las fichas con página, en el orden de site.yaml. */
export const fichas = (): Ficha[] => FICHAS_CALCULADAS;

/** Las zonas con página, en el orden de site.yaml. */
export const zonasConPagina = (): Zona[] => ZONAS_CALCULADAS;

/**
 * Dirección de la página propia de un elemento de una lista o de una zona («/tratamientos/limpieza-dental/»),
 * o '' si no tiene (sin `detalle` o sin `texto`). Recibe el mismo objeto que pinta el componente.
 */
export const enlaceDe = (elemento: unknown): string => (elemento && typeof elemento === 'object' ? porElemento.get(elemento) ?? '' : '');

/** Otras fichas de la misma lista (primero las de su misma `categoria`), como mucho `n`. */
export function relacionadas(f: Ficha, n = 3): Ficha[] {
  const otras = FICHAS_CALCULADAS.filter((x) => x.def.ruta === f.def.ruta && x !== f);
  const mismas = otras.filter((x) => f.categoria && x.categoria === f.categoria);
  return [...mismas, ...otras.filter((x) => !mismas.includes(x))].slice(0, n);
}

/** Cambia {zona} y {negocio} en un texto de la sección de zonas (`titulo_pagina`, `texto_pagina`). */
export const conZona = (t: unknown, zona: string): string =>
  texto(t).replace(/\{\s*zona\s*\}/gi, zona).replace(/\{\s*negocio\s*\}/gi, texto(S.nombre));

/** Título de la página de una zona: `titulo_pagina` de la sección («Reformas en {zona}») o «<Negocio> en <Zona>». */
export const tituloZona = (z: Zona): string => conZona(z.seccion.titulo_pagina, z.nombre) || `${texto(S.nombre)} en ${z.nombre}`;

/** Entrada de la página de una zona: `texto_pagina` de la sección con {zona} y {negocio}, o ''. */
export const introZona = (z: Zona): string => conZona(z.seccion.texto_pagina, z.nombre);

/** Primera frase (o el principio) de un texto, para la meta description: como mucho 155 caracteres. */
export function resumen(t: string, max = 155): string {
  const limpio = t.replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max - 1);
  return corte.slice(0, Math.max(corte.lastIndexOf(' '), 40)).replace(/[\s.,;:]+$/, '') + '…';
}

/** Trabajos (listas `trabajos` o `proyectos` de secciones activas) cuyo `lugar` nombra la zona. */
export function trabajosEn(zona: string): Crudo[] {
  const z = slugify(zona);
  const out: Crudo[] = [];
  if (!z) return out;
  for (const s of Object.values((S.secciones ?? {}) as Record<string, Crudo>)) {
    if (!s?.activa) continue;
    for (const clave of ['trabajos', 'proyectos']) {
      for (const t of objetos(s[clave])) {
        const lugar = slugify(t.lugar);
        if (lugar && `-${lugar}-`.includes(`-${z}-`)) out.push(t);
      }
    }
  }
  return out;
}
