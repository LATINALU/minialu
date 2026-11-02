# Tablas de datos (Base + Define)

**Problema que resuelve:** que el contenido (objetos, precios, monstruos) lo cambien diseñadores sin tocar código.

## Reglas
- Una fila = un `Base` (un objeto); la tabla = un `Define` que se carga una vez al arrancar.
- Ids únicos; un id inexistente es un error de datos (`requerir`), no un `null` silencioso.
- Validar referencias entre tablas al arrancar (premios que apuntan a objetos que no existen).
- Cliente y servidor leen la misma fuente.

## En MiniFighter
Formato `*ETIQUETA { *CLAVE valor }` en cp949, cifrado TEA en el cliente. 15 parejas Base/Define en el cliente.

## En la librería
`datos/bloques.ts` (`leerDocumento`, `bloquesDe`, `texto`, `numero`, `todos`) y `datos/tabla.ts` (`Tabla<T>`).

```ts
const doc = leerDocumento(textoDelArchivo);
const objetos = new Tabla("Objetos", bloquesDe(doc, "ITEM_INFO").map((b) => ({
  id: numero(b, "INDEX"), nombre: texto(b, "NAME"), precio: numero(b, "PRICE"), maxPila: numero(b, "MAX_ITEM_COUNT", 1),
})), (o) => o.id);
```
