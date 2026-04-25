import { useListTeams } from "@workspace/api-client-react";
import type { Team } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Target, Plus, Shield, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const SUBJECT_COLORS: Record<string, { primary: string; glow: string }> = {
  Frontend:   { primary: "#7c3aed", glow: "rgba(124,58,237,0.5)" },
  Backend:    { primary: "#059669", glow: "rgba(5,150,105,0.5)" },
  "AI/ML":    { primary: "#db2777", glow: "rgba(219,39,119,0.5)" },
  DSA:        { primary: "#0284c7", glow: "rgba(2,132,199,0.5)" },
  Accounting: { primary: "#b45309", glow: "rgba(180,83,9,0.5)" },
};

function TeamCard({ team, index }: { team: Team; index: number }) {
  const colors = SUBJECT_COLORS[team.subject] ?? { primary: "#6b7280", glow: "rgba(107,114,128,0.4)" };
  const totalSlots = team.requiredRoles.reduce((a, r) => a + r.count, 0);
  const filledSlots = team.requiredRoles.reduce((a, r) => a + r.filled, 0);
  const fillPercent = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
  const isFull = filledSlots >= totalSlots;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="glass-panel rounded-2xl overflow-hidden group hover:border-opacity-60 transition-all duration-300 flex flex-col"
      style={{
        borderColor: `${colors.primary}35`,
        boxShadow: `0 0 25px ${colors.glow}12`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
      />

      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${colors.primary}25`,
                border: `1px solid ${colors.primary}50`,
                boxShadow: `0 0 12px ${colors.glow}`,
              }}
            >
              <Rocket className="w-4 h-4" style={{ color: colors.primary }} />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-base group-hover:text-primary transition-colors">
                {team.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className="text-xs font-mono"
                  style={{
                    borderColor: `${colors.primary}55`,
                    color: colors.primary,
                    background: `${colors.primary}15`,
                  }}
                >
                  {team.subject}
                </Badge>
              </div>
            </div>
          </div>
          {isFull ? (
            <Badge className="bg-green-500/15 border-green-500/40 text-green-400 text-xs font-mono flex-shrink-0">
              FULL
            </Badge>
          ) : (
            <Badge className="bg-primary/15 border-primary/40 text-primary text-xs font-mono flex-shrink-0 animate-pulse">
              OPEN
            </Badge>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 py-3 flex items-center gap-4 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <Clock className="w-3 h-3 text-primary" />
          {team.studyTime}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <Target className="w-3 h-3 text-primary" />
          {team.goalType}
        </div>
      </div>

      {/* Roles */}
      <div className="px-5 py-4 flex-1 space-y-3">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Shield className="w-3 h-3" /> Required Roles
        </div>
        <div className="space-y-2">
          {team.requiredRoles.map((role) => {
            const roleFill = role.count > 0 ? (role.filled / role.count) * 100 : 0;
            return (
              <div key={role.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/80">{role.skillCategory}</span>
                  <span>
                    <span
                      style={{
                        color: role.filled >= role.count ? "#4ade80" : colors.primary,
                        textShadow: role.filled >= role.count ? "0 0 8px #4ade80" : `0 0 8px ${colors.glow}`,
                      }}
                    >
                      {role.filled}
                    </span>
                    <span className="text-muted-foreground">/{role.count}</span>
                  </span>
                </div>
                <div className="h-0.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${roleFill}%`,
                      background: role.filled >= role.count ? "#4ade80" : colors.primary,
                      boxShadow: role.filled >= role.count ? "0 0 6px #4ade80" : `0 0 6px ${colors.glow}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fill bar + CTA */}
      <div className="px-5 pb-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Capacity</span>
          <span>{filledSlots}/{totalSlots} filled</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${fillPercent}%`,
              background: `linear-gradient(90deg, ${colors.primary}99, ${colors.primary})`,
              boxShadow: `0 0 8px ${colors.glow}`,
            }}
          />
        </div>
        <Button
          variant="outline"
          className="w-full font-mono text-xs uppercase tracking-widest transition-all duration-200"
          style={{
            border: `1px solid ${colors.primary}35`,
            color: colors.primary,
            background: `${colors.primary}08`,
          }}
        >
          <Users className="w-3.5 h-3.5 mr-1.5" /> View Candidates
        </Button>
      </div>
    </motion.div>
  );
}

export default function Teams() {
  const { data: teams = [], isLoading } = useListTeams();

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
            ACTIVE FLEETS
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1 tracking-wider">
            Join a squad · assemble your crew · conquer your orbit
          </p>
        </div>
        <Link href="/create-team">
          <Button
            className="font-mono uppercase tracking-widest text-sm flex items-center gap-2"
            style={{
              background: "rgba(0,212,255,0.12)",
              border: "1px solid rgba(0,212,255,0.45)",
              color: "#00d4ff",
              boxShadow: "0 0 12px rgba(0,212,255,0.2)",
            }}
          >
            <Plus className="w-4 h-4" /> Establish Fleet
          </Button>
        </Link>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-primary font-mono text-sm animate-pulse tracking-widest">SCANNING FREQUENCIES...</span>
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, i) => (
            <TeamCard key={team.id} team={team} index={i} />
          ))}

          {teams.length === 0 && (
            <div className="col-span-full py-24 text-center glass-panel rounded-2xl border border-dashed border-primary/20">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle, rgba(0,212,255,0.1), transparent)",
                  border: "1px solid rgba(0,212,255,0.2)",
                }}
              >
                <Users className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="text-xl font-mono text-white mb-2">No active fleets in this sector</h3>
              <p className="text-muted-foreground font-mono text-sm mb-6">Be the first to establish a crew.</p>
              <Link href="/create-team">
                <Button
                  style={{
                    background: "rgba(0,212,255,0.12)",
                    border: "1px solid rgba(0,212,255,0.45)",
                    color: "#00d4ff",
                  }}
                  className="font-mono uppercase tracking-widest"
                >
                  Create Fleet
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
