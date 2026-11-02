# Buffs temporales

**Problema que resuelve:** efectos con duración (pociones, transformaciones, eventos) que sobreviven a la desconexión.

## Reglas
- Repetir un buff renueva el tiempo.
- Grupo exclusivo: el nuevo reemplaza al anterior del mismo grupo (una transformación a la vez).
- Persistencia: ninguna / el tiempo sigue corriendo / el tiempo se pausa desconectado.
- Efectos numéricos que se suman.

## En MiniFighter
`GameClient.Buffs.cs`, `BuffDefine` (239 buffs): KEEP_TYPE 0/1/2, KEEP_TIME, EFFECT n valor. Paquetes 109 / 102.

## En la librería
`GestorBuffs` (`agregar`, `quitar`, `vencer`, `lista`, `efecto`, `guardar`, `restaurar`).
