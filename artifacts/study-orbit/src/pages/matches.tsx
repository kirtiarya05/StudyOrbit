import { useLocation } from "wouter";
import { useGetUserMatches } from "@workspace/api-client-react";
import type { UserMatch } from "@workspace/api-client-react";
import { getCurrentUserId } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { User, Target, Clock, BookOpen, Star, Zap, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const SKILL_COLORS: Record<string, string> = {
  Frontend: "#7c3aed",
  Backend: "#059669",
  "AI/ML": "#db2777",
  DSA: "#0284c7",
  Accounting: "#b45309",
};

function getScoreColor(score: number) {
  if (score >= 80) return { color: "#ffd700", shadow: "rgba(255,215,0,0.6)" };
  if (score >= 60) return { color: "#00d4ff", shadow: "rgba(0,212,255,0.6)" };
  if (score >= 40) return { color: "#8b5cf6", shadow: "rgba(139,92,246,0.6)" };
  return { color: "#6699ff", shadow: "rgba(100,150,255,0.4)" };
}

function MatchCard({ match, index }: { match: UserMatch; index: number }) {
  const { color, shadow } = getScoreColor(match.score);
  const subjectColor = SKILL_COLORS[match.user.subject] ?? "#6b7280";

  const radarData = [
    { skill: "Subject",  value: match.breakdown.subjectMatch,      max: 30 },
    { skill: "Time",     value: match.breakdown.studyTimeMatch,     max: 20 },
    { skill: "Skills",   value: match.breakdown.skillCategoryMatch, max: 25 },
    { skill: "Level",    value: match.breakdown.skillLevelMatch,    max: 15 },
    { skill: "Goal",     value: match.breakdown.goalTypeMatch,      max: 10 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="glass-panel rounded-2xl overflow-hidden relative group hover:border-primary/40 transition-all duration-300"
      style={{
        borderColor: `${color}30`,
        boxShadow: `0 0 30px ${shadow}15, 0 0 0 1px ${color}20`,
      }}
    >
      {/* Top bar accent */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, ${subjectColor}, transparent)`,
          boxShadow: `0 0 10px ${shadow}`,
        }}
      />

      <div className="p-6 flex flex-col md:flex-row gap-6">
        {/* Left: Info */}
        <div className="flex-1 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar planet */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${subjectColor}dd, ${subjectColor}66)`,
                  boxShadow: `0 0 16px ${subjectColor}80, 0 0 32px ${subjectColor}30`,
                  border: `1.5px solid ${subjectColor}80`,
                  color: "white",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {match.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-white">{match.user.name}</span>
                  {match.user.skillLevel === "Expert" && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" style={{ filter: "drop-shadow(0 0 4px #ffd700)" }} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono"
                    style={{
                      borderColor: `${subjectColor}60`,
                      color: subjectColor,
                      background: `${subjectColor}15`,
                    }}
                  >
                    {match.user.subject}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono ${
                      match.user.skillLevel === "Expert"
                        ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                        : match.user.skillLevel === "Intermediate"
                        ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                        : "border-blue-500/40 text-blue-400 bg-blue-500/10"
                    }`}
                  >
                    {match.user.skillLevel}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Score bubble */}
            <div className="text-right flex-shrink-0">
              <div
                className="text-4xl font-mono font-black leading-none"
                style={{
                  color,
                  textShadow: `0 0 20px ${shadow}, 0 0 40px ${shadow.replace("0.6","0.25")}`,
                }}
              >
                {match.score}%
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-0.5 uppercase tracking-widest">Match</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="glass-panel-light rounded-xl p-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-mono">Study Time</div>
                <div className="text-xs font-mono text-white">{match.user.studyTime}</div>
              </div>
            </div>
            <div className="glass-panel-light rounded-xl p-3 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-mono">Goal</div>
                <div className="text-xs font-mono text-white truncate">{match.user.goalType}</div>
              </div>
            </div>
            <div className="glass-panel-light rounded-xl p-3 flex items-center gap-2 col-span-2 sm:col-span-1">
              <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-mono">Level</div>
                <div className="text-xs font-mono text-white">{match.user.skillLevel}</div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {match.user.bio && (
            <div
              className="rounded-xl p-3 border text-sm text-gray-300 italic"
              style={{ background: `${color}08`, borderColor: `${color}25` }}
            >
              "{match.user.bio}"
            </div>
          )}

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5">
            {match.user.skillCategories?.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="border-primary/30 text-primary/80 bg-primary/5 font-mono text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Right: Radar */}
        <div className="w-full md:w-52 lg:w-56 h-44 flex-shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,212,255,0.12)" />
              <PolarAngleAxis
                dataKey="skill"
                tick={{ fill: "rgba(180,200,220,0.65)", fontSize: 9, fontFamily: "monospace" }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.18}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score bar at bottom */}
      <div className="px-6 pb-4">
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${match.score}%` }}
            transition={{ delay: index * 0.08 + 0.3, duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${shadow}` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function Matches() {
  const currentUserId = getCurrentUserId();
  const [, setLocation] = useLocation();

  const { data: matches = [], isLoading } = useGetUserMatches(currentUserId ?? 0, {}, {
    query: {
      enabled: !!currentUserId,
      queryKey: ["getUserMatches", currentUserId ?? 0],
    },
  });

  if (!currentUserId) {
    setLocation("/profile");
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1
            className="text-4xl font-mono font-black tracking-wide neon-text"
            style={{ color: "#00d4ff" }}
          >
            TOP MATCHES
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1 tracking-wider">
            Satellites ranked by orbital compatibility · weighted algorithm
          </p>
        </div>
        {matches.length > 0 && (
          <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3">
            <Trophy className="w-4 h-4 text-yellow-400" style={{ filter: "drop-shadow(0 0 4px #ffd700)" }} />
            <span className="text-sm font-mono text-white">
              <span className="text-primary font-bold">{matches.length}</span> compatible satellites found
            </span>
          </div>
        )}
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-primary font-mono text-sm animate-pulse tracking-widest">
            COMPUTING COMPATIBILITY MATRICES...
          </span>
        </div>
      )}

      {/* Match cards */}
      {!isLoading && (
        <div className="space-y-5">
          {matches.map((match, index) => (
            <MatchCard key={match.user.id} match={match} index={index} />
          ))}

          {matches.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center glass-panel rounded-2xl border border-dashed border-primary/20"
            >
              <div
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle, rgba(0,212,255,0.1), transparent)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  boxShadow: "0 0 30px rgba(0,212,255,0.1)",
                }}
              >
                <Target className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="text-xl font-mono text-white mb-2">No matching satellites detected</h3>
              <p className="text-muted-foreground font-mono text-sm">
                Complete your profile to unlock orbital compatibility scanning.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
