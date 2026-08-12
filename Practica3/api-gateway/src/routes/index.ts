import { Router } from "express";
import { authRouter } from "./auth.routes";
import { catalogRouter } from "./catalog.routes";
import { analyticsRouter } from "./analytics.routes";
import { adminRouter } from "./admin.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/catalog", catalogRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/admin", adminRouter);
