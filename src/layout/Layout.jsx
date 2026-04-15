import { useState } from "react";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      className={`${styles.layout} ${darkMode ? styles.dark : styles.light}`}
    >
      <Header
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className={styles.body}>
        <Sidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
        />

        <main className={styles.content}>
          <div className={styles.card}>
            <h1>Welcome to Pocket University</h1>
            <p>Your page content will be here.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
