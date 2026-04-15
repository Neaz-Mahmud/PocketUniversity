
import { useState } from 'react';
import styles from './App.module.css'
import Header from './COMPONENTS/Header/Header';
import Sidebar from './COMPONENTS/Sidebar/Sidebar';
import Body from './COMPONENTS/mainbody/body';
function App() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

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

        <Body></Body>
      </div>
    </div>
  );



}

export default App;
