import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AuthPage from "./pages/AuthPage";
import { Dashboard } from "./components/Dashboard";
import { authAPI } from "./lib/api";

const App = () => {
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const rehydrate = async () => {
      try {
        await authAPI.me();
        setAuthed(true);
      } catch {
        setAuthed(false);
      } finally {
        setCheckingSession(false);
      }
    };

    rehydrate();
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setAuthed(false);
    }
  };

  if (checkingSession) {
    return <div className="h-screen w-full bg-background" />;
  }

  return (
    <AnimatePresence mode="wait">
      {!authed ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.4 }}
        >
          <AuthPage onLogin={() => setAuthed(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="h-screen"
        >
          <Dashboard onLogout={handleLogout} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
