import styles from "./Header.module.css";

export default function Header({ darkMode, toggleDarkMode, toggleSidebar }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div>
          <h1 className={styles.title}>Pocket University</h1>
          <p className={styles.subTitle}>CR Dashboard</p>
        </div>
      </div>

      <div className={styles.right}>
        <button className={styles.themeBtn} onClick={toggleDarkMode}>
          {darkMode ? "Light" : "Dark"}
        </button>

        <div className={styles.avatar}>PU</div>
      </div>
    </header>
  );
}
