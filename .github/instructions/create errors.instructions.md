---
applyTo: "src/common/errors/**"
---

# Instrucciones para crear nuevos errores personalizados

1. **Ubicación:**  
   Cada nuevo error debe ser un archivo independiente dentro de la carpeta `src/common/errors/`.

2. **Herencia:**  
   Todos los errores personalizados deben heredar de la clase `FlagsError` definida en `src/common/errors/flags.error.ts`.

3. **Nombre descriptivo:**  
   El nombre de la clase de error y del archivo debe describir claramente el propósito del error. Ejemplo:
   - Archivo: `invalid-flag.error.ts`
   - Clase: `InvalidFlagError`

4. **Estructura mínima del archivo:**  
   El archivo debe exportar la clase de error como `export class NombreError extends FlagsError { ... }`.

5. **Constructor:**  
   El constructor debe aceptar un mensaje descriptivo y pasarlo al constructor de `FlagsError`.

6. **Ejemplo:**

```typescript
// src/common/errors/invalid-flag.error.ts
import { FlagsError } from "./flags.error.js";

export class InvalidFlagError extends FlagsError {
  name = "InvalidFlagError";
  constructor(flagName: string) {
    super(`...`);
  }
}
```

7. **Exportación:**  
   Si tienes un archivo de barril (index.ts), recuerda exportar el nuevo error desde allí.
