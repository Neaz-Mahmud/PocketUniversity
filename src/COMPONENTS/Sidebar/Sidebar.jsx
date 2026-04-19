import { useState } from "react";
import styles from "./Sidebar.module.css";
import { Link } from "react-router";

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
        {/*Mobile Header*/}
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

        {/*Desktop Header*/}
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

        {/* Central Segment */}
        <div className={styles.item}>
          <div className={styles.mainItem}>
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <span className={styles.menuText}>Central Segment</span>
            </div>
          </div>

          <div className={styles.subMenu}>
            <p>Book Sharing</p>
            <p>Visualzer tools</p>

            <Link className="LINKUSED" to="/jobqueries">
              {" "}
              <p>Job Queries</p>
            </Link>

            <Link className="LINKUSED" to="/bestmaterial">
              {" "}
              <p>Best Material</p>
            </Link>
          </div>
        </div>

        {/* Personal Segment */}
        <div className={styles.item}>
          <div className={styles.mainItem}>
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <Link className="LINKUSED" to="/Personal">
                {" "}
                <span className={styles.menuText}>Personal Segment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Cr Segment */}
        <div className={styles.item}>
          <div className={styles.mainItem}>
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <Link className="LINKUSED" to={"/crsegment"}>
                {" "}
                <span className={styles.menuText}>Cr Segment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className={styles.item}>
          <button
            className={styles.mainButton}
            onClick={() => setOrdersOpen(!ordersOpen)}
          >
            <div className={styles.left}>
              <span className={styles.icon}></span>
              <span className={styles.menuText}>Notice</span>
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
                <Link className="LINKUSED" to="/postnotice">
                  {" "}
                  <p>Post Notice</p>
                </Link>
                <Link className="LINKUSED" to="/allnotice">
                  {" "}
                  <p>All Notice</p>
                </Link>

                <Link className="LINKUSED" to="/workingcalender">
                  {" "}
                  <p>Working Calender</p>
                </Link>
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
