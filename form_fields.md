# Campos del Formulario de Registro

Este documento detalla todos los campos utilizados en el formulario de registro de beneficiarios.

## 1. Datos Personales
- `nombre_completo` (String): Nombres y apellidos del beneficiario.
- `tipo_documento` (String - Select): Tipo de documento de identidad.
  - Opciones: Cédula, Tarjeta de Identidad, Pasaporte, Registro Civil, PPT - Permiso por Protección Temporal, PEP - Permiso Especial de Permanencia, Cédula de extranjería.
- `numero_documento` (String): Número de documento.
- `genero` (String - Select): Género.
  - Opciones: Masculino, Femenino, Otro, Prefiero no decir.
- `rango_edad` (String - Select): Rango de edad.
  - Opciones: 0-12, 13-18, 19-25, 26-35, 36-45, 46-55, 56-65, 66 o más.
- `sabe_leer` (Boolean): ¿Sabe leer?
- `sabe_escribir` (Boolean): ¿Sabe escribir?

## 2. Datos de Contacto
- `numero_celular` (String): Número de teléfono celular.
- `correo_electronico` (String): Correo electrónico (opcional).

## 3. Información Socio-Demográfica
- `etnia` (String - Select): Etnia del beneficiario.
  - Opciones: Afrodescendiente, Indígena, Raizal, Palenquero, Mestizo, Otro (especificar), Ninguna.
- `comuna` (String): Comuna de residencia.
- `barrio` (String): Barrio de residencia.
- `tiene_discapacidad` (Boolean): ¿Posee alguna discapacidad?
- `tipo_discapacidad` (String - Select - Condicional): Tipo de discapacidad (si aplica).
  - Opciones: Física, Visual, Auditiva, Psicosocial, Cognitiva, Múltiple.
- `nombre_cuidadora` (String - Condicional): Nombre de la cuidadora.
- `labora_cuidadora` (Boolean - Condicional): ¿Labora la cuidadora?
- `tiene_certificado_discapacidad` (Boolean - Condicional): ¿Posee certificado de discapacidad?
- `victima_conflicto` (Boolean): ¿Es víctima del conflicto armado?
- `hijos_a_cargo` (String): Cantidad de hijos a cargo.
- `estudia_actualmente` (Boolean): ¿Estudia actualmente?
- `nivel_educativo` (String - Select): Nivel educativo alcanzado.
  - Opciones: Primaria, Secundaria, Técnico, Tecnólogo, Universitario, Posgrado, Ninguno.
- `situacion_laboral` (String - Select): Situación laboral actual.
  - Opciones: Empleado, Desempleado, Estudiante, Independiente, Jubilado.
- `tipo_vivienda` (String - Select): Tipo de tenencia de la vivienda.
  - Opciones: Propia, Arrendada, Familiar, Compartida, Cedida / prestada, En custodia, Habitación / Inquilinato, Cambuche / Rancho, Situación de calle, Refugio / Albergue, Institucional.
- `ayuda_humanitaria` (Boolean): ¿Recibe ayuda humanitaria?
- `descripcion_ayuda_humanitaria` (String - Condicional): Descripción de la ayuda (si aplica).

## 4. Información de Población Migrante (Conditional)
- `eres_desplazado` (Boolean): ¿Es la persona desplazada?
- `tipo_pobreza` (String - Select): Categorización según el SISBEN.
  - Opciones: Pobreza extrema (A), Pobreza moderada (B), Vulnerable (C), No pobre, no vulnerable.
- `mujeres_hogar` (String): Cantidad de mujeres en el hogar.
- `ninos_hogar` (String): Cantidad de niños en el hogar.
- `adolescentes_hogar` (String): Cantidad de adolescentes en el hogar.
- `jovenes_hogar` (String): Cantidad de jóvenes en el hogar.
- `madre_cabeza_familia` (Boolean): ¿Hay madre cabeza de familia?
- `nombre_madre_cabeza` (String - Condicional): Nombre de la madre cabeza de familia (si aplica).

## 5. Finalización
- `firma` (String): Firma del beneficiario (capturada vía canvas).
