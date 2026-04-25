import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import teamsRouter from "./teams";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(teamsRouter);
router.use(dashboardRouter);

export default router;
