import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, teamsTable, roleRequirementsTable, teamMembersTable, usersTable } from "@workspace/db";
import {
  CreateTeamBody,
  GetTeamParams,
  GetTeamCandidatesParams,
  GetTeamCandidatesQueryParams,
  AddTeamMemberParams,
  AddTeamMemberBody,
} from "@workspace/api-zod";
import { rankCandidatesForTeam } from "../lib/matching";

const router: IRouter = Router();

async function getTeamWithDetails(teamId: number) {
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
  if (!team) return null;

  const roles = await db
    .select()
    .from(roleRequirementsTable)
    .where(eq(roleRequirementsTable.teamId, teamId));

  const members = await db
    .select({
      id: teamMembersTable.id,
      userId: teamMembersTable.userId,
      teamId: teamMembersTable.teamId,
      role: teamMembersTable.role,
      joinedAt: teamMembersTable.joinedAt,
      user: {
        id: usersTable.id,
        name: usersTable.name,
        subject: usersTable.subject,
        studyTime: usersTable.studyTime,
        skillLevel: usersTable.skillLevel,
        goalType: usersTable.goalType,
        skillCategories: usersTable.skillCategories,
        bio: usersTable.bio,
        createdAt: usersTable.createdAt,
      },
    })
    .from(teamMembersTable)
    .innerJoin(usersTable, eq(teamMembersTable.userId, usersTable.id))
    .where(eq(teamMembersTable.teamId, teamId));

  return {
    ...team,
    createdAt: team.createdAt.toISOString(),
    requiredRoles: roles,
    members: members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt.toISOString(),
      user: {
        ...m.user,
        createdAt: m.user.createdAt.toISOString(),
      },
    })),
  };
}

router.get("/teams", async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.createdAt);

  const teamsWithDetails = await Promise.all(teams.map((t) => getTeamWithDetails(t.id)));

  res.json(teamsWithDetails.filter(Boolean));
});

router.post("/teams", async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, subject, studyTime, goalType, minSkillLevel, requiredRoles } = parsed.data;

  const [team] = await db
    .insert(teamsTable)
    .values({ name, subject, studyTime, goalType, minSkillLevel })
    .returning();

  if (requiredRoles && requiredRoles.length > 0) {
    await db.insert(roleRequirementsTable).values(
      requiredRoles.map((r) => ({
        teamId: team.id,
        skillCategory: r.skillCategory,
        count: r.count,
        filled: 0,
      }))
    );
  }

  const teamWithDetails = await getTeamWithDetails(team.id);
  res.status(201).json(teamWithDetails);
});

router.get("/teams/:id", async (req, res): Promise<void> => {
  const params = GetTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const teamWithDetails = await getTeamWithDetails(params.data.id);
  if (!teamWithDetails) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(teamWithDetails);
});

router.get("/teams/:id/candidates", async (req, res): Promise<void> => {
  const params = GetTeamCandidatesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const queryParams = GetTeamCandidatesQueryParams.safeParse(req.query);
  const limit = queryParams.success && queryParams.data.limit ? Number(queryParams.data.limit) : 10;

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const allUsers = await db.select().from(usersTable);
  const candidates = rankCandidatesForTeam(
    {
      subject: team.subject,
      studyTime: team.studyTime,
      goalType: team.goalType,
      minSkillLevel: team.minSkillLevel,
    },
    allUsers,
    limit
  );

  res.json(
    candidates.map((c) => ({
      ...c,
      user: {
        ...c.user,
        createdAt: c.user.createdAt.toISOString(),
      },
    }))
  );
});

router.post("/teams/:id/members", async (req, res): Promise<void> => {
  const params = AddTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [member] = await db
    .insert(teamMembersTable)
    .values({
      teamId: params.data.id,
      userId: parsed.data.userId,
      role: parsed.data.role,
    })
    .returning();

  // Update filled count for matching role requirement
  await db
    .update(roleRequirementsTable)
    .set({ filled: sql`${roleRequirementsTable.filled} + 1` })
    .where(
      eq(roleRequirementsTable.teamId, params.data.id)
    );

  res.status(201).json({
    ...member,
    joinedAt: member.joinedAt.toISOString(),
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

export default router;
