# Curva de niveles

**Problema que resuelve:** convertir experiencia acumulada en nivel y marcar el ritmo del juego.

## Reglas
- Tabla acumulada: umbral de EXP para cada nivel, creciente, empieza en 0.
- Nivel máximo explícito; en el máximo el porcentaje es 0.

## En MiniFighter
100 niveles, 11.575.000 EXP. Crece por tramos de 10 con un salto al cambiar de tramo
(ver [progresión](../docs/08-progresion.md)).

## Variantes
- Polinómica (`base × nivel^exponente`), exponencial, por tramos.
- Prestigio: volver a nivel 1 con una recompensa permanente.

## En la librería
`CurvaNiveles`, `curvaPolinomica`, `CURVA_MINIFIGHTER`, `UMBRALES_MINIFIGHTER`.
