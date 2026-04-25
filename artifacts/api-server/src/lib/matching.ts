import { User } from "@workspace/db";

type MatchBreakdown = {
  subjectMatch: number;
  studyTimeMatch: number;
  skillCategoryMatch: number;
  skillLevelMatch: number;
  goalTypeMatch: number;
};

type UserMatch = {
  user: User;
  score: number;
  breakdown: MatchBreakdown;
};

const SKILL_LEVEL_ORDER = ["Beginner", "Intermediate", "Expert"];

function subjectMatchScore(a: User, b: User): number {
  return a.subject === b.subject ? 30 : 0;
}

function studyTimeMatchScore(a: User, b: User): number {
  if (a.studyTime === b.studyTime) return 20;
  if (a.studyTime === "Flexible" || b.studyTime === "Flexible") return 10;
  return 0;
}

function skillCategoryMatchScore(a: User, b: User): number {
  const aSet = new Set(a.skillCategories);
  const bSet = new Set(b.skillCategories);
  let overlap = 0;
  for (const cat of aSet) {
    if (bSet.has(cat)) overlap++;
  }
  const union = new Set([...aSet, ...bSet]).size;
  if (union === 0) return 0;
  return Math.round((overlap / union) * 25);
}

function skillLevelMatchScore(a: User, b: User): number {
  const aIdx = SKILL_LEVEL_ORDER.indexOf(a.skillLevel);
  const bIdx = SKILL_LEVEL_ORDER.indexOf(b.skillLevel);
  const diff = Math.abs(aIdx - bIdx);
  if (diff === 0) return 15;
  if (diff === 1) return 8;
  return 0;
}

function goalTypeMatchScore(a: User, b: User): number {
  return a.goalType === b.goalType ? 10 : 0;
}

export function computeMatch(target: User, candidate: User): UserMatch {
  const subjectMatch = subjectMatchScore(target, candidate);
  const studyTimeMatch = studyTimeMatchScore(target, candidate);
  const skillCategoryMatch = skillCategoryMatchScore(target, candidate);
  const skillLevelMatch = skillLevelMatchScore(target, candidate);
  const goalTypeMatch = goalTypeMatchScore(target, candidate);

  const score = subjectMatch + studyTimeMatch + skillCategoryMatch + skillLevelMatch + goalTypeMatch;

  return {
    user: candidate,
    score,
    breakdown: {
      subjectMatch,
      studyTimeMatch,
      skillCategoryMatch,
      skillLevelMatch,
      goalTypeMatch,
    },
  };
}

export function rankMatches(target: User, candidates: User[], limit = 10): UserMatch[] {
  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => computeMatch(target, c))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function rankCandidatesForTeam(
  team: { subject: string; studyTime: string; goalType: string; minSkillLevel: string },
  candidates: User[],
  limit = 10
): UserMatch[] {
  const minLevelIdx = SKILL_LEVEL_ORDER.indexOf(team.minSkillLevel);
  const eligible = candidates.filter((u) => {
    const userLevelIdx = SKILL_LEVEL_ORDER.indexOf(u.skillLevel);
    return userLevelIdx >= minLevelIdx;
  });

  return eligible
    .map((candidate) => {
      const subjectMatch = candidate.subject === team.subject ? 30 : 0;
      const studyTimeMatch =
        candidate.studyTime === team.studyTime
          ? 20
          : candidate.studyTime === "Flexible" || team.studyTime === "Flexible"
          ? 10
          : 0;
      const skillLevelMatch =
        SKILL_LEVEL_ORDER.indexOf(candidate.skillLevel) >= minLevelIdx ? 15 : 0;
      const goalTypeMatch = candidate.goalType === team.goalType ? 10 : 0;
      const skillCategoryMatch = 25; // team requires all roles, handled externally

      const score = subjectMatch + studyTimeMatch + skillCategoryMatch + skillLevelMatch + goalTypeMatch;

      return {
        user: candidate,
        score,
        breakdown: {
          subjectMatch,
          studyTimeMatch,
          skillCategoryMatch,
          skillLevelMatch,
          goalTypeMatch,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
