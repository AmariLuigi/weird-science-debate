import { AnimatePresence, motion } from "framer-motion";
import { DebateProvider, useDebate } from "@/context/DebateContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConfigurationView } from "@/components/config/ConfigurationView";
import { BroadcastView } from "@/components/broadcast/BroadcastView";

function AppContent() {
  const { viewMode } = useDebate();

  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        {viewMode === "config" ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ConfigurationView />
          </motion.div>
        ) : (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <BroadcastView />
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

function App() {
  return (
    <DebateProvider>
      <AppContent />
    </DebateProvider>
  );
}

export default App;
