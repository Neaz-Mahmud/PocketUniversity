import { useSelector } from "react-redux";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
  const user = useSelector((state) => state.AccountHolderInfoSlice);

  return (
    <section className={styles.wrapper}>
      {/* Top hero card */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <img src={user.photo} alt={user.name} className={styles.avatar} />

          <div className={styles.userInfo}>
            <p className={styles.roleBadge}>{user.role}</p>
            <h1 className={styles.name}>{user.name}</h1>
            <p className={styles.university}>{user.University}</p>

            <div className={styles.quickInfo}>
              <span className={styles.quickTag}>{user.department}</span>
              <span className={styles.quickTag}>Batch {user.batch}</span>
              <span className={styles.quickTag}>Section {user.section}</span>
              <span className={styles.quickTag}>{user.semister} Semester</span>
            </div>
          </div>
        </div>

        <button type="button" className={styles.editBtn}>
          Edit Profile
        </button>
      </div>

      {/* Bottom grid */}
      <div className={styles.grid}>
        {/* Academic Info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Academic Information</h2>

          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.label}>University</span>
              <span className={styles.value}>{user.University}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Department</span>
              <span className={styles.value}>{user.department}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Batch</span>
              <span className={styles.value}>{user.batch}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Section</span>
              <span className={styles.value}>{user.section}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Semester</span>
              <span className={styles.value}>{user.semister}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Student ID</span>
              <span className={styles.value}>{user.studentId}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Contact Information</h2>

          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{user.email}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Phone</span>
              <span className={styles.value}>{user.phone}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Role</span>
              <span className={styles.value}>{user.role}</span>
            </div>
          </div>
        </div>

        {/* Social Info */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2 className={styles.cardTitle}>Social Link</h2>

          <div className={styles.socialBox}>
            <span className={styles.socialLabel}>Facebook</span>

            <a
              href={user.Facebook}
              target="_blank"
              rel="noreferrer"
              className={styles.socialLink}
            >
              {user.Facebook}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
