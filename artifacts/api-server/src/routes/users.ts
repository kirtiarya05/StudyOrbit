import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  ListUsersQueryParams,
  GetUserMatchesParams,
  GetUserMatchesQueryParams,
} from "@workspace/api-zod";
import { rankMatches } from "../lib/matching";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  const filters = parsed.success ? parsed.data : {};

  let query = db.select().from(usersTable).$dynamic();

  if (filters.subject) {
    query = query.where(eq(usersTable.subject, filters.subject));
  }
  if (filters.skillLevel) {
    query = query.where(eq(usersTable.skillLevel, filters.skillLevel));
  }
  if (filters.studyTime) {
    query = query.where(eq(usersTable.studyTime, filters.studyTime));
  }

  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);

  res.json(
    users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, subject, studyTime, skillLevel, goalType, skillCategories, bio } = parsed.data;

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      subject,
      studyTime,
      skillLevel,
      goalType,
      skillCategories: skillCategories ?? [],
      bio: bio ?? null,
    })
    .returning();

  res.status(201).json({
    ...user,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.subject != null) updateData.subject = parsed.data.subject;
  if (parsed.data.studyTime != null) updateData.studyTime = parsed.data.studyTime;
  if (parsed.data.skillLevel != null) updateData.skillLevel = parsed.data.skillLevel;
  if (parsed.data.goalType != null) updateData.goalType = parsed.data.goalType;
  if (parsed.data.skillCategories != null) updateData.skillCategories = parsed.data.skillCategories;
  if ("bio" in parsed.data) updateData.bio = parsed.data.bio;

  if (Object.keys(updateData).length === 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/users/:id/matches", async (req, res): Promise<void> => {
  const params = GetUserMatchesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const queryParams = GetUserMatchesQueryParams.safeParse(req.query);
  const limit = queryParams.success && queryParams.data.limit ? Number(queryParams.data.limit) : 10;

  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const allUsers = await db.select().from(usersTable);
  const matches = rankMatches(target, allUsers, limit);

  res.json(
    matches.map((m) => ({
      ...m,
      user: {
        ...m.user,
        createdAt: m.user.createdAt.toISOString(),
      },
    }))
  );
});

export default router;
