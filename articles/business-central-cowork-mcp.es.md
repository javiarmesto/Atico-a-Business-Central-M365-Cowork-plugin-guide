[English](business-central-cowork-mcp.en.md) · [Castellano](business-central-cowork-mcp.es.md)

# Business Central dentro de una conversación de trabajo

Pedirle a un agente las últimas facturas de venta parece una demostración pequeña. Lo es. Pero detrás de esa consulta hay una decisión interesante: permitir que el ERP participe en una conversación de trabajo conservando el control sobre los datos y las operaciones disponibles.

He conectado Microsoft 365 Copilot Cowork con el MCP estándar de Business Central. Desde Cowork he consultado clientes, artículos, proveedores y facturas de venta. El usuario inicia sesión, el agente identifica la acción que necesita y Business Central devuelve los datos de la empresa seleccionada.

La pregunta que me interesa es qué podemos construir a partir de esa conexión y qué responsabilidades debe conservar cada pieza.

Microsoft permite extender Cowork mediante paquetes de aplicaciones de Microsoft 365 que incorporan conectores y, si se necesitan, skills. En este caso he utilizado un conector MCP para acceder a Business Central. El complemento es propio; el servidor MCP al que accede es el servicio nativo de Microsoft. [Desarrollo de plugins para Cowork](https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-plugin-development).

Entre ambos he colocado un pequeño puente en TypeScript, desplegado en Railway. Su trabajo es concreto: recibir la llamada autenticada, obtener un token válido para el MCP de Business Central e incorporar las cabeceras que identifican tenant, entorno, empresa y configuración.

Es una decisión de esta implementación. El puente nos permite resolver esas necesidades de conexión en un servicio que controlamos. La lógica del ERP y sus API siguen en Business Central.

La identidad también importa. El acceso se realiza en nombre del usuario mediante un intercambio On-Behalf-Of. El token que recibe el puente está destinado a su propia API; después obtiene otro para llamar al recurso de Business Central. Aunque haya secretos de aplicación en la configuración, no estamos sustituyendo al usuario por una cuenta de aplicación con acceso general al ERP. [Flujo delegado OBO de Microsoft Entra](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow).

Una parte especialmente útil del diseño es el modo dinámico del MCP. En lugar de incorporar una herramienta al plugin por cada entidad, el agente utiliza tres operaciones: buscar una acción, consultar su esquema y ejecutarla. Esas operaciones permiten descubrir durante la conversación las acciones que ofrece la configuración de Business Central. [Dynamic Tool Mode en Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/configure-mcp-server).

Eso tiene una consecuencia práctica. Al incorporar la API de facturas de venta a la configuración de BC, pude consultarla desde Cowork sin añadir una herramienta específica de facturas al paquete. El catálogo de negocio se administra en el ERP y el complemento conserva las mismas herramientas de descubrimiento y ejecución.

No significa que todas las tablas de Business Central se conviertan automáticamente en herramientas. Trabajamos con API expuestas y con un alcance definido. Además, en esta implementación el puente admite consultas de lectura sobre páginas API. Las operaciones de escritura requieren otro diseño.

Para verlo desde negocio, imaginemos una petición sencilla:

> Consulta las cinco facturas de venta más recientes. Separa las que están en borrador de las abiertas y prepara un resumen para administración. Indica qué información falta antes de proponer una actuación.

La lectura de facturas ya está resuelta en esta implementación. El resumen y la propuesta son el siguiente uso que podemos construir sobre esos datos. Ahí conviene ser precisos: una factura abierta no demuestra por sí sola que esté vencida, y revisar cinco documentos no equivale a analizar toda la cartera.

El agente necesita interpretar el estado, las fechas, los importes y el alcance de la consulta. Si faltan datos para decidir, debe señalarlos. Esa distinción entre lo que devuelve el ERP y lo que propone el agente forma parte de la calidad de la solución.

También es la diferencia entre una demostración de acceso y un proceso de negocio completo. Consultar información, organizarla y preparar una revisión puede ser útil por sí mismo. Registrar una factura, enviar una reclamación o confirmar un pedido añade responsabilidades sobre la ejecución, la aprobación y el seguimiento. Esas operaciones no están implementadas en este complemento.

Business Central conserva un papel central. La configuración MCP define las capacidades disponibles y el acceso se realiza con la identidad y los permisos del usuario. El agente dispone de un contexto de trabajo más amplio, pero el ERP sigue aplicando sus controles. [Descripción del MCP nativo de Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/mcp-overview).

Quería que esta conexión se pudiera reproducir. Por eso el repositorio incluye una configuración local para el nombre del plugin, su identidad M365, el endpoint y la referencia OAuth. Cada nueva instalación propia genera un ID que se conserva para las actualizaciones. Los secretos permanecen en los servicios que los necesitan.

La [guía de implementación](../native/HOW-TO-BC-NATIVE-COWORK.md) recorre la preparación de BC, los registros en Entra, el despliegue en Railway y la instalación en Cowork. Hay pasos que siguen siendo administrativos: disponer de acceso a Cowork, conceder consentimiento y asignar permisos en BC. Clonar el repositorio facilita la parte de software; no resuelve esas decisiones por la organización.

Veo valor en empezar por un proceso pequeño cuyo resultado podamos revisar. Una consulta útil, una interpretación bien delimitada y una propuesta que una persona pueda contrastar. A partir de ahí, cada nueva capacidad de ejecución debe tener un propósito y un responsable claros.

Conectar el ERP a un agente abre posibilidades. Convertir esa conexión en una forma fiable de trabajar es la tarea que viene después.

[Repositorio y guía para reproducir la solución](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide).
