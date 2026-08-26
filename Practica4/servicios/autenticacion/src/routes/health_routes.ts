import { Request, Response, Router } from "express";
import { Pool } from "pg";

export class HealthRouter {
  public readonly router: Router;

  constructor(private pool: Pool) {
    this.router = Router();
    this.router.get("/health", this.check.bind(this));
  }

  private async check(_req: Request, res: Response): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
      res.status(200).json({
        status: "ok",
        database: "connected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({
        status: "degraded",
        database: "disconnected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
  }
}
