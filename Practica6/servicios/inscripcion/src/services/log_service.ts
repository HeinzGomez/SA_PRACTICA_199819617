import { LogsRepository } from "../repositories/logs_repository";
import { ConsultarParams, ConsultarResult } from "../types/logs.types";

export interface LogsService {
  consultar(params: ConsultarParams): Promise<ConsultarResult>;
}

export class LogsServiceImp implements LogsService {
  constructor(private logsRepository: LogsRepository) {}

  async consultar(params: ConsultarParams): Promise<ConsultarResult> {
    this.validar(params);

    return this.logsRepository.consultar(params);
  }

  private validar(params: ConsultarParams): void {
    if (!params.pagina || params.pagina < 1) {
      throw new Error("La página debe ser un número mayor o igual a 1");
    }

    if (params.usuarioFiltro < 0) {
      throw new Error("El filtro de usuario no puede ser negativo");
    }
  }
}
