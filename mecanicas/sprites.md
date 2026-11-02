# Sprites RGB565

**Problema que resuelve:** leer los gráficos originales (y entender formatos de imagen propios).

## Reglas
- Cabecera + lista de cuadros (ancho, alto, píxeles de 16 bits).
- Color clave 0xF81F = transparente.
- Mezcla con alfa 0~32 multiplicando rojo+azul juntos y verde aparte.

## En MiniFighter
`.spr` dentro de `.ark` (ZIP), `tools\spr2png.py`, `FUN_0055f5f0` (mezcla). 73 de 83 sprites sueltos se leen.

## En la librería
`decodificarSpr(bytes)` → cuadros RGBA, `rgb565ARgba`, `escalar565`, `mezclar565`.
