[English](DYNAMIC-MODE.en.md) · [Castellano](DYNAMIC-MODE.md)

# BC nativo · Modo dinámico

La configuración MCP de Business Central y los permisos del usuario determinan las API disponibles. El puente no mantiene una lista por entidad.

## Configuración

Establece `BC_TOOL_MODE=dynamic` y tu `BC_CONFIGURATION_NAME` en el despliegue. La variable antigua `BC_DYNAMIC_READ_ACTIONS` se ignora. En BC, añade páginas API compatibles y habilita **Allow Read**; mantén **Unblock Edit Tools** desactivado. **Discover Additional Objects** puede ampliar el descubrimiento a otras páginas API accesibles. Una tabla de BC no es automáticamente una página API.

El flujo conserva `bc_actions_search` → `bc_actions_describe` → `bc_actions_invoke`, OAuth delegado/OBO y cabeceras de destino fijas. El modo del paquete debe coincidir con el puente. Versiona tu paquete independientemente del puente y regénéralo cuando cambie el contrato expuesto.

## Comprobaciones de compatibilidad de lectura

La búsqueda se limita a ActionType List. Los nombres de escritura y ListUpdate se rechazan antes de OBO. Antes de cada invoke, el puente describe la acción en la sesión del mismo usuario y comprueba:

- Coincidencia exacta con el nombre de la acción List solicitada.
- Formato BC `{name, description, schema}` con esquema objeto de consulta compatible.
- Solo parámetros admitidos: `filter`, `orderby`, `select`, `top`, `skip`, `resultFormat` y metadato `_availableFields`.
- Ausencia de esquemas incompletos, parámetros de escritura y errores de describe.
- Ausencia de anotaciones explícitas contradictorias, como `readOnlyHint=false` o `destructiveHint=true`.
- En el formato alternativo MCP Tool `{name, inputSchema, annotations}`, se exige `readOnlyHint=true` explícito.

El formato de descripción de acciones de BC 28 no incluye anotaciones de herramientas. `_availableFields.readOnly` describe ese campo del esquema; no es un permiso de la acción. El puente no lo utiliza como autorización ni fabrica anotaciones.

El descriptor puede llegar en `structuredContent` o como JSON en texto con una frase explicativa. El parser no deduce permisos de prosa ni de ejemplos anidados. La comprobación de compatibilidad no sustituye la autorización de BC, que se aplica en la ejecución.

Las consultas admiten `top` entre 1 y 100 (10 por defecto), `skip` no negativo, filtros/orden/campos compatibles y `resultFormat: text`. Quedan fuera las escrituras, bound actions, argumentos no admitidos y `resources/read`.

## Validación y despliegue

Las pruebas del puente cubren autenticación, aislamiento de usuarios, formatos de esquema, nombres exactos, límites, errores del parser e intercambios describe/invoke simulados. Los fixtures contienen metadatos de esquemas, no registros de clientes. Estas pruebas no demuestran una conexión en vivo en tu tenant.

Tras desplegar, inicia sesión en Cowork y consulta cinco proveedores y cinco facturas de venta de tu sandbox. Comprueba la empresa y los campos disponibles. Si falla, conserva el error y la descripción de la acción sin tokens ni datos de negocio.

Para revertir, despliega un commit validado de tu propio historial de versiones. Si cambias a modo estático, configura el puente y un paquete estático coherente, con tu configuración de BC.

[Configuración MCP de Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/configure-mcp-server)
