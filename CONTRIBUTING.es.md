[English](CONTRIBUTING.md) · [Castellano](CONTRIBUTING.es.md)

# Contribuir

Abre una issue para comentar un cambio amplio, o envía una PR concreta con el problema, el comportamiento resultante y su verificación. Puedes usar castellano o inglés. Mantén la documentación para usuarios en ambos idiomas y enlaza cada página con su traducción. No traduzcas nombres de herramientas, claves JSON ni identificadores de protocolo.

Usa Node.js 22+. Desde la raíz:

```sh
npm ci --prefix native/bridge
node --test native/scripts/test/package.test.mjs custom/scripts/test/package.test.mjs
npm test --prefix native/bridge
node scripts/check-public-files.mjs
```

Mantén separadas las salidas de los paquetes nativo y personalizado. Conserva la identidad delegada y la lectura en el puente nativo. Propón expresamente cualquier ampliación a escrituras. Usa datos ficticios y dobles de prueba; nadie debe necesitar el tenant ni las credenciales del mantenedor para ejecutar las pruebas. Superarlas no demuestra una instalación en vivo en Cowork.

Consulta [SECURITY.es.md](SECURITY.es.md) para notificaciones privadas y el [uso de marca](assets/BRAND-USAGE.md) al cambiar assets. Conserva el aviso MIT al reutilizar código e identifica el material de terceros y su licencia.
