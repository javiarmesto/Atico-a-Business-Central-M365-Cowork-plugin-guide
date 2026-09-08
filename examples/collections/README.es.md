[English](README.md) · [Castellano](README.es.md) · [Conexión personalizada](../../custom/README.es.md)

# Ejemplo opcional: revisión de cobros

Este ejemplo procede de las sesiones corporativas de Javier Armesto. Ilustra cómo un conector MCP y una skill combinan evidencia financiera y contexto de Microsoft 365. No define el propósito del repositorio ni se incluye en el conector predeterminado.

La skill está disponible en `en/skills/` y `es/skills/`. Para incluir una versión, configura `example: collections` y `language: en` o `es` en `custom/plugin.config.local.json` y regenera el paquete. Solo se incluye el idioma seleccionado. Los nombres de herramientas no cambian.

Los tres casos ficticios usan la fecha fija **6 de septiembre de 2026**. Prueba:

> Prueba los tres casos ficticios de cobros incluidos usando el 6 de septiembre de 2026 como fecha de análisis. Clasifica cada cliente, muestra la evidencia y detente en la propuesta. No ejecutes acciones.

| Caso | Resultado esperado |
|---|---|
| Alpine Office | No contactar: promesa de pago vigente. |
| Contoso Retail Sur | Escalar: disputa abierta. |
| Fabrikam Servicios | Actuar: proponer un borrador de recordatorio sujeto a aprobación. |

Esta versión se detiene en el checkpoint y no crea borradores, mensajes ni registros del ERP. El modo conectado necesita herramientas autorizadas de BC y M365. Un saldo de cliente no basta para determinar deuda vencida; el contrato de ejemplo `get-customers` / `get-customer` no proporciona toda la evidencia de antigüedad.
