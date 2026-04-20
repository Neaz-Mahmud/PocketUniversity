import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "./SingleTopics.module.css";

export default function SingleTopics() {
  const { courseSlug, topicsSlug } = useParams();
  const courses = useSelector((state) => state.CourseNameSlice || []);

  const selectedCourse = useMemo(() => {
    return courses.find((course) => course.slug === courseSlug);
  }, [courses, courseSlug]);

  const selectedTopic = useMemo(() => {
    if (!selectedCourse) return null;
    return selectedCourse.topics.find((topic) => topic.slug === topicsSlug);
  }, [selectedCourse, topicsSlug]);

  if (!selectedCourse || !selectedTopic) {
    return (
      <section className={styles.wrapper}>
        <Link to="/visualizertools" className={styles.backBtn}>
          ← Back to Courses
        </Link>

        <div className={styles.emptyBox}>
          <h2>Topic not found</h2>
          <p>This course or topic does not exist.</p>
        </div>
      </section>
    );
  }

  const renderTopicContent = () => {


    return (
      <>
        <div className={styles.card}>
          <h3>{selectedTopic.name} Document</h3>
          <p>Add document/article for this topic.</p>
        </div>

        <div className={styles.card}>
          <h3>{selectedTopic.name} Visualizer</h3>
          <p>Add visualizer for this topic.</p>
        </div>
      </>
    );
  };

  return (
    <section className={styles.wrapper}>
      <Link
        to={`/visualizertools/${selectedCourse.slug}`}
        className={styles.backBtn}
      >
        ← Back to Topics
      </Link>

      <div className={styles.header}>
        <p className={styles.courseName}>{selectedCourse.coursename}</p>
        <h1 className={styles.topicTitle}>{selectedTopic.name}</h1>
        <p className={styles.subtitle}>
          Learn concepts with articles and interactive visual tools
        </p>
      </div>

      <div className={styles.grid}>{renderTopicContent()}</div>
    </section>
  );
}
