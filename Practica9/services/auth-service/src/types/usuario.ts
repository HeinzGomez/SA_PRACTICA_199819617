// HeinzGomez - Práctica 9: estructuras de datos del dominio de usuarios (CDU 1.x)
export type Rol = 'ESTUDIANTE' | 'ADMINISTRADOR';

export interface Usuario {
  id: string;
  nombre: string;
  carnet: string;
  correo: string;
  rol: Rol;
}

export interface UsuarioConHash extends Usuario {
  passwordHash: string;
}
