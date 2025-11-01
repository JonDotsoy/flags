## Builder

Los builders son clases que permiten transformar argumentos y extraer valores de ello,

## src/builders/Spec.ts

Contiene la definicion para el builder, es clase inmutable, no se puede modificar una vez construida, lista los refiners

### Refinres

Permite validar los valores de los argumentos, si no se cumple la validacion, retorna un null cuando no puede ser refinado.

Los builders para parsear argumentos usa los refines en un patron pipe para usar la lista de los refiners y valida los argumentos. Puede si en la cascada en algun momento retorna null deje de procesar en el siguiente refine

## src/builders/\*Builder.ts

Estos archivos son builders y contiene metodos de utilidad para definir los builders. Los metodos son usados para mejorar para ser mas legibles para el dev.

Todos los builders son copias de src/builders/TemplateBuilder.ts

## src/builders/accumulates/\*Accumulate.ts

Estos metodos son usados para acumular los valores de los argumentos, no se usa directamente por el builder se usa para reusar los builder sobre todo acumunado valores que se le parecen.

src/builders/accumulates/templateAccumulate.ts tiene un ejemplo de como se usa

## src/builders/refiners/\*Refine.ts

El refine son usado para el builder

src/builders/refiners/templateRefine.ts tiene un ejemplo de como se usa
