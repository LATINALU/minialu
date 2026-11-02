# Fusión 3 → 1

**Problema que resuelve:** convertir duplicados en progreso y sacar copias de la economía.

## Reglas
- Tres del mismo tipo y nivel. El resultado es del mismo tipo.
- Mismo personaje en las tres → se conserva; si no, uno al azar del mismo grado.
- Probabilidad de subir por tipo y nivel; si falla, sale del mismo nivel (se pierden 2).
- Objeto de éxito → sube seguro (punto de monetización).
- Costo en oro creciente.

## En MiniFighter
`CardGenerator.MixCard`, `MixInfo(KR).txt`: siempre hasta 6★, 30% a 7★, 0% después sin carta de éxito.
Costo 300 ... 10.000.000.

## Variantes
- 2 → 1, o N → 1. Fusión de armas, gemas, mascotas.
- Falla que baja de nivel (más castigo) o que devuelve una carta (menos).

## En la librería
`fusionar(cartas, reglas, suerte)`, `COSTO_FUSION_MINIFIGHTER`, `PROB_FUSION_NORMAL_MINIFIGHTER`.
