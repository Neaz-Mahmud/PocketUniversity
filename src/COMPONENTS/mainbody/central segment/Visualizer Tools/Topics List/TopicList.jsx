import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "./TopicList.module.css";

export default function TopicList() {
  const { courseSlug } = useParams();
  const courses = useSelector((state) => state.CourseNameSlice || []);
  const [searchText, setSearchText] = useState("");

  // find selected course by slug
  const selectedCourse = useMemo(() => {
    return courses.find((course) => course.slug === courseSlug);
  }, [courses, courseSlug]);

  // search topics by topic.name
  const filteredTopics = useMemo(() => {
    if (!selectedCourse) return [];

    return selectedCourse.topics.filter((topic) =>
      topic.name.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [selectedCourse, searchText]);

  // helper for initials
  const getInitials = (topicName) => {
    return topicName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // if course not found
  if (!selectedCourse) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.topBar}>
          <Link to="/visualizertools" className={styles.backBtn}>
            ← Back to Courses
          </Link>
        </div>

        <div className={styles.emptyBox}>
          <h3>Course not found</h3>
          <p>This course does not exist in your course list.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      {/* top bar */}
      <div className={styles.topBar}>
        <Link to="/visualizertools" className={styles.backBtn}>
          ← Back to Courses
        </Link>
      </div>

      {/* header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{selectedCourse.coursename}</h2>
          <p className={styles.subtitle}>Browse all topics of this course</p>
        </div>

        <div className={styles.countBadge}>
          {filteredTopics.length} Topic{filteredTopics.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* search */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search topic name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* topic list */}
      {filteredTopics.length === 0 ? (
        <div className={styles.emptyBox}>
          <h3>No matching topic</h3>
          <p>Try searching with another topic name.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTopics.map((topic) => (
            <Link className="LINKUSED" to={`${topic.slug}`}>
              <div key={topic.slug} className={styles.card}>
                <div className={styles.iconBox}>{getInitials(topic.name)}</div>

                <div className={styles.content}>
                  <h3 className={styles.topicName}>{topic.name}</h3>
                  <p className={styles.topicInfo}>
                    Click Here to explore materials related to "{topic.name}" in
                    the curriculum
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
