/// <reference types="astro/client" />
declare module '*.yaml' {
  const datos: Record<string, unknown>;
  export default datos;
}
