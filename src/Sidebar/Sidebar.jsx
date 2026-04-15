import { useState } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, closeSidebar }) {
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.showBackdrop : ""}`}
        onClick={closeSidebar}
      ></div>

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.mobileHeader}>
          <div className={styles.logo}>
            <div className={styles.logoBox}>P</div>
            <div>
              <h2>Pocket University</h2>
              <p>Student Panel</p>
            </div>
          </div>

          <button className={styles.closeBtn} onClick={closeSidebar}>
            ×
          </button>
        </div>

        <div className={styles.desktopLogo}>
          <div className={styles.logo}>
            <div className={styles.logoBox}>P</div>
            <div>
              <h2>Pocket University</h2>
              <p>Student Panel</p>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Home */}
        <div className={styles.item}>
          <div className={styles.mainItem}>
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <span className={styles.menuText}>Home</span>
            </div>
          </div>

          <div className={styles.subMenu}>
            <p>Overview</p>
            <p>Courses</p>
          </div>
        </div>

        {/* Dashboard */}
        <div className={styles.item}>
          <div className={styles.mainItem}>
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <span className={styles.menuText}>Dashboard</span>
            </div>
          </div>

          <div className={styles.subMenu}>
            <p>Analytics</p>
            <p>Progress</p>
          </div>
        </div>

        {/* Orders */}
        <div className={styles.item}>
          <button
            className={styles.mainButton}
            onClick={() => setOrdersOpen(!ordersOpen)}
          >
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <span className={styles.menuText}>Orders</span>
            </div>

            <span
              className={`${styles.arrow} ${ordersOpen ? styles.rotate : ""}`}
            >
              ›
            </span>
          </button>

          <div
            className={`${styles.collapse} ${ordersOpen ? styles.expand : ""}`}
          >
            <div className={styles.collapseInner}>
              <div className={styles.subMenu}>
                <p>All Orders</p>
                <p>Pending</p>
                <p>Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Account */}
        <div className={styles.item}>
          <button
            className={styles.mainButton}
            onClick={() => setAccountOpen(!accountOpen)}
          >
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <span className={styles.menuText}>Account</span>
            </div>

            <span
              className={`${styles.arrow} ${accountOpen ? styles.rotate : ""}`}
            >
              ›
            </span>
          </button>

          <div
            className={`${styles.collapse} ${accountOpen ? styles.expand : ""}`}
          >
            <div className={styles.collapseInner}>
              <div className={styles.subMenu}>
                <p>Profile</p>
                <p>Settings</p>
                <p>Logout</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
