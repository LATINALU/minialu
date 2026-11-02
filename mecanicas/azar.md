# Azar inyectable y tablas de probabilidad

**Problema que resuelve:** que todo lo aleatorio sea configurable por datos, repetible en pruebas y seguro entre hilos.

## Reglas
- Nadie llama a `Math.random()` directo: el azar entra como parámetro (`Azar`).
- **Tabla acumulada** (`elegirPonderado`): se recorre restando probabilidades; lo que sobra va a una lista de
  "sobrantes" o a la primera entrada. Las probabilidades se leen como "porcentaje de salir".
- **Pesos** (`elegirPorPeso`): números relativos, no hace falta que sumen 1. Más cómodo para diseñar.

## En MiniFighter
`RandomPicker<T>` (Insert / InsertOdd / GetRandValue) y `SafeRandom`. El `System.Random` compartido entre hilos se
corrompía y devolvía siempre 0: todas las cajas salían iguales hasta reiniciar.

## En la librería
`core/azar.ts`: `Azar`, `AzarSistema`, `AzarSemilla` (mulberry32), `tirar`, `entero`, `elegirUno`,
`elegirPonderado`, `elegirPorPeso`.

```ts
elegirPonderado(azar, [[0, 0.63], [1, 0.32], [2, 0.04], [3, 0.01]], [4]); // nivel de carta al ganar
```
