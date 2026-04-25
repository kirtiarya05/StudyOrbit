import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListUsers, useGetDashboardStats, useGetUserMatches } from "@workspace/api-client-react";
import type { User, UserMatch } from "@workspace/api-client-react";
import { getCurrentUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Users, Rocket, Star, Zap, Trophy, Target, Clock } from "lucide-react";

const ORBIT_CONFIG = [
  { radius: 90,  speed: 55,  label: "DSA",        color: "rgba(0,212,255,0.25)"   },
  { radius: 155, speed: 75,  label: "Frontend",   color: "rgba(139,92,246,0.2)"   },
  { radius: 220, speed: 95,  label: "Backend",    color: "rgba(0,255,180,0.18)"   },
  { radius: 285, speed: 115, label: "AI/ML",      color: "rgba(255,100,200,0.18)" },
  { radius: 350, speed: 135, label: "Accounting", color: "rgba(255,215,0,0.15)"   },
];

const SUBJECT_PLANET_COLORS: Record<string, { core: string; glow: string; ring: string }> = {
  Frontend:   { core: "#7c3aed", glow: "rgba(124,58,237,0.7)", ring: "rgba(139,92,246,0.4)" },
  Backend:    { core: "#059669", glow: "rgba(5,150,105,0.7)",  ring: "rgba(16,185,129,0.4)" },
  "AI/ML":    { core: "#db2777", glow: "rgba(219,39,119,0.7)", ring: "rgba(244,114,182,0.4)" },
  DSA:        { core: "#0284c7", glow: "rgba(2,132,199,0.7)",  ring: "rgba(56,189,248,0.4)" },
  Accounting: { core: "#b45309", glow: "rgba(180,83,9,0.7)",   ring: "rgba(251,191,36,0.4)" },
  Other:      { core: "#374151", glow: "rgba(75,85,99,0.7)",   ring: "rgba(107,114,128,0.4)" },
};

function getSatelliteStyle(user: User): { className: string; color: string } {
  if (user.skillLevel === "Expert") return { className: "satellite-expert", color: "#ffd700" };
  if (user.skillLevel === "Intermediate") return { className: "satellite-intermediate", color: "#00d4ff" };
  return { className: "satellite-beginner", color: "#6699ff" };
}

function getOrbitForUser(user: User, index: number): number {
  const subjectOrbitMap: Record<string, number> = {
    DSA: 0, Frontend: 1, Backend: 2, "AI/ML": 3, Accounting: 4, Other: 1,
  };
  return subjectOrbitMap[user.subject] ?? index % ORBIT_CONFIG.length;
}

interface SatelliteNode {
  user: User;
  orbitIdx: number;
  angleOffset: number;
  match?: UserMatch;
  style: { className: string; color: string };
}

interface PlanetProps {
  subject: string;
  size: number;
  orbitRadius?: number;
  showRing?: boolean;
  glowIntensity?: number;
}

function Planet({ subject, size, orbitRadius, showRing = true, glowIntensity = 1 }: PlanetProps) {
  const colors = SUBJECT_PLANET_COLORS[subject] ?? SUBJECT_PLANET_COLORS["Other"];
  return (
    <div
      className="rounded-full relative flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${colors.core}dd, ${colors.core}88, ${colors.core}33)`,
        boxShadow: `0 0 ${30 * glowIntensity}px ${colors.glow}, 0 0 ${60 * glowIntensity}px ${colors.glow.replace("0.7", "0.3")}, inset 0 0 ${20 * glowIntensity}px rgba(255,255,255,0.08)`,
        border: `1px solid ${colors.ring}`,
      }}
    >
      {/* Atmosphere haze */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 65% 65%, rgba(255,255,255,0.04), transparent 60%)`,
        }}
      />
      {/* Planetary surface bands */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden opacity-30"
        style={{
          background: `repeating-linear-gradient(
            ${Math.random() * 20 - 10}deg,
            transparent 0%, transparent 18%,
            rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 22%,
            transparent 24%
          )`,
        }}
      />
      {/* Ring */}
      {showRing && orbitRadius && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: orbitRadius * 2,
            height: orbitRadius * 2,
            borderColor: colors.ring,
            borderWidth: "1px",
            boxShadow: `0 0 12px ${colors.ring}, inset 0 0 8px ${colors.ring}`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

interface StatsPanelProps {
  totalUsers: number;
  totalTeams: number;
  bySkillLevel: { level: string; count: number }[];
}

function StatsHUD({ totalUsers, totalTeams, bySkillLevel }: StatsPanelProps) {
  const experts = bySkillLevel.find(s => s.level === "Expert")?.count ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-panel rounded-xl p-4 space-y-3 w-52"
      data-testid="stats-hud"
    >
      <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: "0 0 6px #4ade80" }} />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Live Data</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-primary neon-text">{totalUsers}</div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Satellites
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-secondary" style={{ textShadow: "0 0 10px rgba(139,92,246,0.8)" }}>{totalTeams}</div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Rocket className="w-3 h-3" /> Clusters
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {bySkillLevel.map(s => (
          <div key={s.level} className="flex items-center justify-between text-xs">
            <span className={`font-mono ${s.level === "Expert" ? "text-yellow-400" : s.level === "Intermediate" ? "text-cyan-400" : "text-blue-400"}`}>
              {s.level}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1 rounded-full overflow-hidden bg-white/10 w-20">
                <div
                  className={`h-full rounded-full ${s.level === "Expert" ? "bg-yellow-400" : s.level === "Intermediate" ? "bg-cyan-400" : "bg-blue-400"}`}
                  style={{ width: `${(s.count / totalUsers) * 100}%`, boxShadow: s.level === "Expert" ? "0 0 6px #ffd700" : s.level === "Intermediate" ? "0 0 6px #00d4ff" : "0 0 6px #6699ff" }}
                />
              </div>
              <span className="text-muted-foreground w-4 text-right">{s.count}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface LeaderboardProps {
  users: User[];
}

function LeaderboardPanel({ users }: LeaderboardProps) {
  const experts = users.filter(u => u.skillLevel === "Expert").slice(0, 5);
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 }}
      className="glass-panel rounded-xl p-4 space-y-3 w-52"
      data-testid="leaderboard-panel"
    >
      <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
        <Trophy className="w-3.5 h-3.5 text-yellow-400" style={{ filter: "drop-shadow(0 0 4px #ffd700)" }} />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Top Experts</span>
      </div>
      <div className="space-y-2">
        {experts.map((u, i) => (
          <div key={u.id} className="flex items-center gap-2">
            <span className={`text-xs font-mono w-4 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-amber-600"}`}>
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-white truncate">{u.name}</div>
              <div className="text-xs text-muted-foreground truncate">{u.subject}</div>
            </div>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: "#ffd700",
                boxShadow: "0 0 8px #ffd700, 0 0 15px rgba(255,215,0,0.4)",
              }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface UserProfileModalProps {
  user: User | null;
  match?: UserMatch;
  onClose: () => void;
}

function UserProfileModal({ user, match, onClose }: UserProfileModalProps) {
  if (!user) return null;
  const { color } = getSatelliteStyle(user);
  const colors = SUBJECT_PLANET_COLORS[user.subject] ?? SUBJECT_PLANET_COLORS["Other"];

  const radarData = match ? [
    { skill: "Subject",   value: match.breakdown.subjectMatch,       max: 30 },
    { skill: "Time",      value: match.breakdown.studyTimeMatch,      max: 20 },
    { skill: "Skills",    value: match.breakdown.skillCategoryMatch,  max: 25 },
    { skill: "Level",     value: match.breakdown.skillLevelMatch,     max: 15 },
    { skill: "Goal",      value: match.breakdown.goalTypeMatch,       max: 10 },
  ] : [];

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md glass-panel border-primary/30 overflow-hidden p-0">
        {/* Header Gradient */}
        <div
          className="relative px-6 pt-6 pb-4"
          style={{
            background: `linear-gradient(135deg, ${colors.core}22, ${colors.glow.replace("0.7","0.08")})`,
            borderBottom: `1px solid ${colors.ring}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${colors.core}cc, ${colors.core}55)`,
                boxShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow.replace("0.7","0.25")}`,
                border: `2px solid ${colors.ring}`,
                color: "white",
                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <DialogHeader>
                <DialogTitle className="text-xl font-mono text-white flex items-center gap-2 flex-wrap">
                  {user.name}
                  <Badge
                    className={`text-xs ${user.skillLevel === "Expert" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" : user.skillLevel === "Intermediate" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-blue-500/20 text-blue-300 border-blue-500/40"}`}
                    style={{ boxShadow: `0 0 8px ${color}55` }}
                  >
                    {user.skillLevel.toUpperCase()}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{user.subject}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {user.studyTime === "Morning" ? "☀ Morning" : user.studyTime === "Night" ? "☽ Night" : "◒ Flexible"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Goal & Bio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel-light rounded-lg p-3">
              <div className="text-xs text-muted-foreground font-mono uppercase mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Goal
              </div>
              <div className="text-sm font-mono text-white">{user.goalType}</div>
            </div>
            <div className="glass-panel-light rounded-lg p-3">
              <div className="text-xs text-muted-foreground font-mono uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Active
              </div>
              <div className="text-sm font-mono text-white">{user.studyTime}</div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="text-xs text-muted-foreground font-mono uppercase mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Skill Modules
            </div>
            <div className="flex flex-wrap gap-2">
              {user.skillCategories?.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="border-primary/30 text-primary/80 bg-primary/5 font-mono text-xs"
                  style={{ boxShadow: "0 0 6px rgba(0,212,255,0.2)" }}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {user.bio && (
            <div className="glass-panel-light rounded-lg p-3">
              <p className="text-sm text-gray-300 italic">"{user.bio}"</p>
            </div>
          )}

          {/* Compatibility Radar */}
          {match && (
            <div className="border-t border-primary/15 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Star className="w-3 h-3" /> Compatibility
                </span>
                <div className="text-3xl font-mono font-bold" style={{ color, textShadow: `0 0 12px ${color}` }}>
                  {match.score}%
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(0,212,255,0.15)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(180,200,220,0.7)", fontSize: 10, fontFamily: "monospace" }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke={color}
                      fill={color}
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const currentUserId = getCurrentUserId();
  const { data: users = [], isLoading } = useListUsers();
  const { data: stats } = useGetDashboardStats();
  const { data: matches = [] } = useGetUserMatches(currentUserId ?? 0, {}, {
    query: { enabled: !!currentUserId, queryKey: ["getUserMatches", currentUserId ?? 0] },
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [findingOrbit, setFindingOrbit] = useState(false);
  const [orbitProgress, setOrbitProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 600, h: 600 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ w: rect.width, h: rect.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const satellites = useMemo((): SatelliteNode[] => {
    const orbitGroups: User[][] = ORBIT_CONFIG.map(() => []);
    users.filter(u => u.id !== currentUserId).forEach((user, idx) => {
      const orbitIdx = getOrbitForUser(user, idx);
      orbitGroups[orbitIdx].push(user);
    });

    const nodes: SatelliteNode[] = [];
    orbitGroups.forEach((group, orbitIdx) => {
      group.forEach((user, posIdx) => {
        const angleOffset = (posIdx / group.length) * Math.PI * 2 + orbitIdx * 0.7;
        const match = matches.find(m => m.user.id === user.id);
        nodes.push({
          user,
          orbitIdx,
          angleOffset,
          match,
          style: getSatelliteStyle(user),
        });
      });
    });
    return nodes;
  }, [users, currentUserId, matches]);

  const handleFindOrbit = () => {
    setFindingOrbit(true);
    setOrbitProgress(0);
    const start = performance.now();
    const duration = 6000;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setOrbitProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => setFindingOrbit(false), 300);
    };
    requestAnimationFrame(tick);
  };

  const cx = containerSize.w / 2;
  const cy = containerSize.h / 2;

  const selectedMatch = selectedUser ? satellites.find(s => s.user.id === selectedUser.id)?.match : undefined;

  const topStats = {
    totalUsers: stats?.totalUsers ?? users.length,
    totalTeams: stats?.totalTeams ?? 0,
    bySkillLevel: stats?.bySkillLevel ?? [],
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Welcome Flicker */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-3"
            >
              <motion.div
                className="text-4xl md:text-6xl font-mono font-black tracking-widest neon-text"
                style={{ color: "#00d4ff" }}
                animate={{ opacity: [0.6, 1, 0.8, 1] }}
                transition={{ duration: 1.5, repeat: 1 }}
              >
                STUDYORBIT
              </motion.div>
              <motion.div
                className="text-sm font-mono text-muted-foreground tracking-widest"
                animate={{ opacity: [0, 1, 0.6, 1] }}
                transition={{ delay: 0.4, duration: 1.2 }}
              >
                INITIALIZING GALAXY SCAN...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Stats HUD */}
      <div className="absolute top-6 left-6 z-30">
        <StatsHUD
          totalUsers={topStats.totalUsers}
          totalTeams={topStats.totalTeams}
          bySkillLevel={topStats.bySkillLevel}
        />
      </div>

      {/* Right Leaderboard */}
      <div className="absolute top-6 right-6 z-30">
        <LeaderboardPanel users={users} />
      </div>

      {/* Galaxy Scene */}
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
        <svg
          width={containerSize.w}
          height={containerSize.h}
          className="absolute inset-0"
          style={{ overflow: "visible" }}
        >
          {/* Defs for filters/gradients */}
          <defs>
            {ORBIT_CONFIG.map((o, i) => (
              <radialGradient key={`ring-grad-${i}`} id={`ring-grad-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="40%" stopColor={o.color} stopOpacity="0" />
                <stop offset="85%" stopColor={o.color} stopOpacity="0.7" />
                <stop offset="100%" stopColor={o.color} stopOpacity="0" />
              </radialGradient>
            ))}

            {/* Planet glow filter */}
            <filter id="planet-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Soft glow filter for rings */}
            <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            <filter id="satellite-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background orbit area glow discs */}
          {ORBIT_CONFIG.map((o, i) => (
            <ellipse
              key={`glow-disc-${i}`}
              cx={cx}
              cy={cy}
              rx={o.radius}
              ry={o.radius * 0.28}
              fill="none"
              stroke={o.color}
              strokeWidth="30"
              strokeOpacity="0.07"
              filter="url(#ring-glow)"
            />
          ))}

          {/* Orbit rings - SVG circles */}
          {ORBIT_CONFIG.map((o, i) => (
            <g key={`orbit-ring-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={o.radius}
                fill="none"
                stroke={o.color}
                strokeWidth="1"
                strokeOpacity="0.5"
                filter="url(#ring-glow)"
                strokeDasharray={i % 2 === 0 ? "none" : "6 4"}
              />
              {/* Second inner faint ring for depth */}
              <circle
                cx={cx}
                cy={cy}
                r={o.radius - 6}
                fill="none"
                stroke={o.color}
                strokeWidth="0.5"
                strokeOpacity="0.2"
              />
              {/* Ring label */}
              <text
                x={cx + o.radius + 8}
                y={cy + 4}
                fill={o.color}
                fontSize="9"
                fontFamily="monospace"
                fillOpacity="0.7"
              >
                {o.label}
              </text>
            </g>
          ))}

          {/* Satellite trails (arcs behind orbit direction) */}
          {satellites.map((sat) => {
            const o = ORBIT_CONFIG[sat.orbitIdx];
            if (!o) return null;
            const isMatch = findingOrbit && (sat.match?.score ?? 0) >= 55;
            const arcEnd = sat.angleOffset - 0.4;
            const x1 = cx + Math.cos(sat.angleOffset) * o.radius;
            const y1 = cy + Math.sin(sat.angleOffset) * o.radius;
            const x2 = cx + Math.cos(arcEnd) * o.radius;
            const y2 = cy + Math.sin(arcEnd) * o.radius;
            if (!isMatch) return null;
            return (
              <path
                key={`trail-${sat.user.id}`}
                d={`M ${x1} ${y1} A ${o.radius} ${o.radius} 0 0 0 ${x2} ${y2}`}
                fill="none"
                stroke={sat.style.color}
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Central Planet */}
        <motion.div
          className="absolute z-20 animate-float"
          style={{ left: cx - 40, top: cy - 40 }}
          animate={findingOrbit ? { scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] } : {}}
          transition={findingOrbit ? { duration: 2, repeat: 3 } : {}}
        >
          <div
            className="w-20 h-20 rounded-full relative animate-planet-glow"
            style={{
              background: "radial-gradient(circle at 35% 30%, #0ff8, #00d4ff, #0044aa)",
              border: "2px solid rgba(0,212,255,0.6)",
            }}
          >
            {/* Surface detail */}
            <div className="absolute inset-0 rounded-full" style={{
              background: "radial-gradient(circle at 65% 65%, rgba(255,255,255,0.06), transparent 55%), radial-gradient(circle at 30% 40%, rgba(0,255,255,0.1), transparent 40%)",
            }} />
            {/* Atmosphere ring */}
            <div className="absolute -inset-3 rounded-full border border-primary/25" style={{ boxShadow: "0 0 20px rgba(0,212,255,0.2)" }} />
            <div className="absolute -inset-6 rounded-full border border-primary/10" />
            {/* Core pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-white/80 animate-pulse" style={{ boxShadow: "0 0 20px #00d4ff, 0 0 40px rgba(0,212,255,0.6)" }} />
            </div>
          </div>
          {/* Planet label */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-primary/70 whitespace-nowrap">
            ORIGIN
          </div>
        </motion.div>

        {/* Satellites */}
        {satellites.map((sat) => {
          const o = ORBIT_CONFIG[sat.orbitIdx];
          if (!o) return null;
          const x = cx + Math.cos(sat.angleOffset) * o.radius;
          const y = cy + Math.sin(sat.angleOffset) * o.radius;
          const isMatch = findingOrbit && (sat.match?.score ?? 0) >= 55;
          const score = sat.match?.score ?? 0;

          return (
            <motion.div
              key={sat.user.id}
              className="absolute cursor-pointer z-30"
              style={{ left: x - 7, top: y - 7 }}
              whileHover={{ scale: 1.8 }}
              onClick={() => setSelectedUser(sat.user)}
              animate={
                isMatch
                  ? {
                      scale: [1, 1.7, 1.3, 1.7, 1],
                      y: [0, -6, -2, -6, 0],
                    }
                  : {}
              }
              transition={isMatch ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : {}}
              data-testid={`satellite-${sat.user.id}`}
            >
              {/* Satellite dot */}
              <div
                className={`w-3.5 h-3.5 rounded-full ${sat.style.className} relative`}
              >
                {/* Time indicator */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs select-none pointer-events-none opacity-80">
                  {sat.user.studyTime === "Morning" ? "☀" : sat.user.studyTime === "Night" ? "☽" : ""}
                </div>

                {/* Hover name tooltip */}
                <motion.div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 glass-panel rounded px-2 py-0.5 whitespace-nowrap text-xs font-mono text-white pointer-events-none"
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  style={{ opacity: 0 }}
                >
                  {sat.user.name}
                </motion.div>
              </div>

              {/* Flying score badge on match */}
              <AnimatePresence>
                {isMatch && score > 0 && (
                  <motion.div
                    key={`score-${sat.user.id}-${findingOrbit}`}
                    initial={{ opacity: 0, y: 5, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [5, -15, -25, -35], scale: [0.6, 1.1, 1, 0.8] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 glass-panel rounded-full px-2 py-0.5 whitespace-nowrap border pointer-events-none"
                    style={{ borderColor: sat.style.color, boxShadow: `0 0 8px ${sat.style.color}55` }}
                  >
                    <span className="text-xs font-mono font-bold" style={{ color: sat.style.color }}>{score}%</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend / Orbit labels bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 flex-wrap justify-center"
      >
        {[
          { label: "Expert", color: "#ffd700", cls: "satellite-expert" },
          { label: "Intermediate", color: "#00d4ff", cls: "satellite-intermediate" },
          { label: "Beginner", color: "#6699ff", cls: "satellite-beginner" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.cls}`} />
            <span className="text-xs font-mono text-muted-foreground">{l.label}</span>
          </div>
        ))}
        <div className="w-px h-4 bg-primary/20 mx-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs">☀</span>
          <span className="text-xs font-mono text-muted-foreground">Morning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">☽</span>
          <span className="text-xs font-mono text-muted-foreground">Night</span>
        </div>
      </motion.div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
        {/* Progress bar during scan */}
        <AnimatePresence>
          {findingOrbit && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 280 }}
              exit={{ opacity: 0 }}
              className="glass-panel rounded-full overflow-hidden h-2 border border-primary/30"
              style={{ width: 280 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #00d4ff, #7b5ea7, #00d4ff)",
                  backgroundSize: "200% 100%",
                  width: `${orbitProgress * 100}%`,
                  boxShadow: "0 0 10px #00d4ff",
                  animation: "gradient-shift 2s linear infinite",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleFindOrbit}
            disabled={findingOrbit || !currentUserId}
            data-testid="find-orbit-btn"
            className="relative overflow-hidden font-mono uppercase tracking-widest text-sm px-8 py-5 border transition-all duration-300"
            style={{
              background: findingOrbit
                ? "rgba(0,212,255,0.1)"
                : "rgba(0,212,255,0.12)",
              border: "1px solid rgba(0,212,255,0.5)",
              color: "#00d4ff",
              boxShadow: findingOrbit
                ? "0 0 20px rgba(0,212,255,0.4), inset 0 0 20px rgba(0,212,255,0.08)"
                : "0 0 12px rgba(0,212,255,0.2)",
            }}
          >
            {findingOrbit ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                SCANNING SECTOR...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                FIND MY ORBIT
              </span>
            )}
          </Button>

          <Link href="/matches">
            <Button
              variant="outline"
              data-testid="view-matches-btn"
              className="font-mono uppercase tracking-wider text-xs px-4 py-5 border border-secondary/40 text-secondary/80 hover:border-secondary hover:text-secondary transition-all"
              style={{ boxShadow: "0 0 8px rgba(139,92,246,0.15)" }}
            >
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Top Matches
            </Button>
          </Link>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        match={selectedMatch}
        onClose={() => setSelectedUser(null)}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
            <div className="text-sm font-mono text-muted-foreground tracking-widest">LOADING GALAXY...</div>
          </div>
        </div>
      )}
    </div>
  );
}
