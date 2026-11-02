// Las operaciones de juego fallan seguido por motivos normales (sin espacio, sin dinero, nivel bajo).
// En vez de excepciones devuelven un Resultado con un código de error que el cliente puede mostrar,
// igual que los códigos del paquete 39 de la tienda (0 sin dinero, 2 inventario lleno, 3 nivel...).

export type Resultado<T, E extends string> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly error: E };

export function exito<T>(valor: T): { readonly ok: true; readonly valor: T } {
  return { ok: true, valor };
}

export function fallo<E extends string>(error: E): { readonly ok: false; readonly error: E } {
  return { ok: false, error };
}
