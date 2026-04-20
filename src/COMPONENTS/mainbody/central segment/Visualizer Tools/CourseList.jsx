import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styles from "./CourseList.module.css";

export default function CourseList() {
  const courses = useSelector((state) => state.CourseNameSlice || []);
  const [searchText, setSearchText] = useState("");

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) =>
      course.coursename.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [courses, searchText]);

  if (courses.length === 0) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.emptyBox}>
          <h3>No courses found</h3>
          <p>Course list will appear here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Courses</h2>
          <p className={styles.subtitle}>
            Browse all available courses and topics
          </p>
        </div>

        <div className={styles.countBadge}>
          {filteredCourses.length} Course
          {filteredCourses.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search course name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Empty after search */}
      {filteredCourses.length === 0 ? (
        <div className={styles.emptyBox}>
          <h3>No matching course</h3>
          <p>Try another course name.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/visualizertools/${course.slug}`}
              className={styles.cardLink}
            >
              <div className={styles.card}>
                <div className={styles.iconBox}>
                  {getInitials(course.coursename)}
                </div>

                <div className={styles.content}>
                  <h3 className={styles.courseName}>{course.coursename}</h3>

                  <p className={styles.topicCount}>
                    {course.topics.length} Topic
                    {course.topics.length > 1 ? "s" : ""}
                  </p>

                  <div className={styles.topicPreview}>
                    {course.topics.slice(0, 3).map((topic) => (
                      <span key={topic.slug} className={styles.topicTag}>
                        {topic.name}
                      </span>
                    ))}

                    {course.topics.length > 3 && (
                      <span className={styles.moreTag}>
                        +{course.topics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
