import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { authAPI } from "@/lib/api";

interface AuthPageProps {
  onLogin: () => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await authAPI.login(email, password);
      } else {
        await authAPI.register(email, password);
        // After registration, switch to login
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setLoading(false);
        return;
      }
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Glowing orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/6 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 md:p-10 border border-border/60" style={{ boxShadow: "0 0 60px hsl(var(--primary) / 0.08), var(--shadow-card)" }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mb-3"
            >
              <img src={logo} alt="MarketSense AI" className="w-10 h-10" />
              <h1 className="text-3xl font-bold tracking-[0.2em] text-gradient">
                MARKETSENSE
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs tracking-[0.3em] uppercase text-muted-foreground/60 font-mono"
            >
              AI-Powered Financial Intelligence
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-terminal-950 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-terminal-950 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                  required
                />
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-terminal-950 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm tracking-wider hover:brightness-110 transition-all disabled:opacity-80 glow-blue flex items-center justify-center gap-2"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 size={16} className="animate-spin" />
                    <span className="animate-pulse">Authenticating...</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    {isLogin ? "Login" : "Create Account"}
                    <ArrowRight size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center"
              >
                {error}
              </motion.div>
            )}
          </form>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground/60 hover:text-primary transition-colors tracking-wide"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-primary font-medium">
                {isLogin ? "Create Account" : "Login"}
              </span>
            </button>
          </motion.div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-border/30 text-center">
            <p className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground/30 uppercase">
              engineered by whitecoder
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
