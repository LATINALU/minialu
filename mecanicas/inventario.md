# Inventario por pestañas con pilas

**Problema que resuelve:** guardar objetos con espacio limitado (el límite es una decisión de diseño y un sumidero indirecto).

## Reglas
- Pestañas × casillas. Cada casilla vacía o con una pila `{objeto, cantidad}`.
- Cada objeto tiene su máximo por pila (pociones 99, equipo 1).
- Agregar: primero completa pilas existentes, después usa casillas vacías. **Todo o nada.**
- Quitar: reparte entre pilas. **Todo o nada.**
- Objetos únicos (stats propios, vencimiento) no se apilan.
- Pestañas extra se pueden abrir y cerrar (VIP); lo que hay en una cerrada se conserva.
- Ordenar con orden total (desempate) para que no falle con objetos iguales.

## En MiniFighter
4 pestañas × 30 casillas, 5.ª pestaña con VIP. `InsertItem` podía meter media pila y perder el resto.

## Variantes
- Inventario por peso (RPG clásico): `capacidadPara` pasa a ser peso libre / peso del objeto.
- Inventario por grilla (Diablo/Tarkov): casillas con tamaño.
- Contenedores: mochila, banco, equipo y correo son el mismo `Inventario` con distinto tamaño.

## En la librería
`inventario/inventario.ts`: `Inventario` (`agregar`, `quitar`, `contar`, `capacidadPara`, `sacarDe`, `ponerEn`,
`ordenar`, `clonar`, `cambiarPestanasActivas`) y `transferir`.
