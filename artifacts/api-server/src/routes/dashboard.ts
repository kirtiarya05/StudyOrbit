import { Router, type IRouter } from "express";
import { db, usersTable, teamsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [{ count: totalUsers }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);

  const [{ count: totalTeams }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamsTable);

  const bySubjectRaw = await db
    .select({
      subject: usersTable.subject,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .groupBy(usersTable.subject);

  const bySkillLevelRaw = await db
    .select({
      level: usersTable.skillLevel,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .groupBy(usersTable.skillLevel);

  const byStudyTimeRaw = await db
    .select({
      time: usersTable.studyTime,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .groupBy(usersTable.studyTime);

  res.json({
    totalUsers,
    totalTeams,
    bySubject: bySubjectRaw,
    bySkillLevel: bySkillLevelRaw,
    byStudyTime: byStudyTimeRaw,
  });
});

export default router;
