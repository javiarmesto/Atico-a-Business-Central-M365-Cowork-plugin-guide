[English](README.en.md) · [Castellano](README.md)

# ático · Identidad visual

Parte de **Javier Armesto / Open Engineering Notebook**.

La identidad presenta la conexión entre Business Central y Copilot Cowork. Las dos vías del repositorio —MCP estándar y MCP personalizado— comparten el sistema visual. Cobros es un caso de uso de sesiones corporativas, no el posicionamiento general del repositorio.

## Idea visual

Un tejado abierto y su acento identifican **ático**. Las hojas representan contexto de negocio; la línea cyan, su conexión con la conversación de trabajo. El dibujo es una metáfora editorial, no un diagrama de arquitectura ni una promesa de funcionalidades.

## Assets

| Archivo | Uso |
|---|---|
| [atico-cover.png](atico-cover.png) / [atico-cover.en.png](atico-cover.en.png) | Portadas ES/EN; conservar la imagen completa y sus márgenes. |
| [color.svg](color.svg) | Fuente vectorial del símbolo en color, lienzo de 192 × 192. |
| [outline.svg](outline.svg) | Variante simplificada blanca sobre transparencia, 32 × 32. |
| [../custom/appPackage/icons/color.png](../custom/appPackage/icons/color.png) y [../custom/appPackage/icons/outline.png](../custom/appPackage/icons/outline.png) | Iconos del paquete de conexión personalizada. |
| [../native/appPackage/icons/](../native/appPackage/icons/) | Los mismos iconos para el generador nativo. |

## Paleta y significado

| Color | Valor | Función |
|---|---|---|
| Paper | `#F8F7F3` | Fondo cálido del cuaderno y del icono de color. |
| Ink | `#111827` | Titulares y texto principal. |
| Navy | `#25235F` | Estructura, símbolo y color de acento del paquete. |
| Cyan | `#25C8D8` | Conexión y flujo de contexto. |
| Magenta | `#C02B84` | Criterio humano y anotaciones con significado. |

Usar retícula fina, tipografía editorial sobria y metadata monoespaciada. Reservar el magenta para una observación humana; no añadirlo como decoración al icono. Evitar degradados, robots, cerebros y volumen brillante.

## Mantenimiento

Editar primero los SVG y exportarlos como PNG a sus dimensiones originales. El icono de color tiene fondo opaco; el outline utiliza únicamente blanco y transparencia. Actualizar las dos copias de cada icono en la misma revisión. Mantener `accentColor` en los dos manifiestos alineado con navy.

La portada se generó con la plantilla Open Engineering Visual Assets. Brief de producción: identidad editorial de ático para Business Central y Copilot Cowork; papel cálido, retícula, tejado abierto con hojas de contexto, conexión cyan y la anotación humana «El criterio sigue siendo humano». La imagen no representa el contrato técnico del plugin.

Los PNG actualizados se incorporan al volver a empaquetar. Para actualizar una instalación existente, conservar su appId y aumentar la versión según el flujo de publicación del paquete. Los iconos no cambian la identidad de una instalación. Consulta la guía de cada conector al actualizar el paquete.

**Engineering systems, visibly reasoned.**

[Licencia y uso de marca](BRAND-USAGE.md).
