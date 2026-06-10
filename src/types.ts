export type Rol = 'admin' | 'funcionario';

export interface Usuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: Rol;
  lineaTrabajo?: string;
  secretaría?: string;
  estado: 'Activo' | 'Inactivo';
}

export interface Beneficiario {
  id: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  genero: string;
  rangoEdad: string;
  comuna: string;
  barrio: string;
  celular: string;
  correo: string;
  victimaConflicto: boolean;
  discapacidad: boolean;
  etnia: string;
  estudia: boolean;
  nivelEducativo: string;
  situacionLaboral: string;
  fechaRegistro: string;
  funcionarioId: string;
}

export interface Actividad {
  id: string;
  tema: string;
  objetivo: string;
  lugar: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lineaTrabajoId: string;
  funcionarioId: string;
  tipo: 'actividad' | 'reunion';
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  asistentes: {
    beneficiarioId: string;
    asistio: boolean;
    observaciones?: string;
  }[];
}

export interface LineaTrabajo {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  responsableId: string;
}
