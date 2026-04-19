import AllNotice from "../AllNotice/AllNotice";
import WorkCalendar from "../WorkCalender/WorkCalendar";
import styles from "./NoticeBoardPage.module.css";
export default function NoticeBoardPage() {
  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <WorkCalendar />
      </div>

      <div className={styles.right}>
        <h2>Notice Board</h2>
        <AllNotice />
      </div>
    </div>
  );
}
