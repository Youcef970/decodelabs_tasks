import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scansRouter from "./scans";
import ingestRouter from "./ingest";
import statsRouter from "./stats";
import agentRouter from "./agent";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/scans", scansRouter);
router.use("/scan", ingestRouter);
router.use("/stats", statsRouter);
router.use("/agent", agentRouter);

export default router;
