import { useMemo, useState } from "react";
import { Form, useNavigation } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "./NoticePostBox.module.css";
import { store } from "../../../../store/store";
import { AllNoticeSliceactions } from "../../../../store/AllNoticeSlice";

/* 
  React Router action function
*/
// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Remove non-serializable File objects from Redux payload
  delete data.attachments;

  // Dispatch directly using the imported store, since hooks cannot be used here
  store.dispatch(AllNoticeSliceactions.pushNotices(data));

  return null;
}

export default function NoticePostBox() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Adjust this selector if your redux state shape is slightly different
  const teachers = useSelector((state) => state.allteacher?.allteacher || state.allteacher || []);

  const [noticeType, setNoticeType] = useState("general");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const selectedTeacherName = useMemo(() => {
    const foundTeacher = teachers.find(
      (teacher) => String(teacher.id) === String(selectedTeacherId),
    );
    return foundTeacher ? foundTeacher.fullName : "";
  }, [teachers, selectedTeacherId]);

  const handleTeacherChange = (e) => {
    setSelectedTeacherId(e.target.value);
  };

  const handleTypeChange = (e) => {
    setNoticeType(e.target.value);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Post Notice</h2>
          <p className={styles.subtitle}>
            Create a clear notice for students and attach files if needed.
          </p>
        </div>

        <div className={styles.badge}>Only description is required</div>
      </div>

      <Form method="post" encType="multipart/form-data" className={styles.form}>
        {/* Title */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">
            Notice Title <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className={styles.input}
            placeholder="Example: Mid Term Assignment Notice"
          />
        </div>

        {/* Description - required */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">
            Notice Description <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            placeholder="Write the full notice here..."
            required
            rows="6"
          />
        </div>

        {/* Two column row */}
        <div className={styles.row}>
          {/* Notice Type */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="noticeType">
              Notice Type <span className={styles.optional}>(optional)</span>
            </label>
            <select
              id="noticeType"
              name="noticeType"
              className={styles.select}
              value={noticeType}
              onChange={handleTypeChange}
            >
              <option value="general">General</option>
              <option value="class-test">Class Test</option>
              <option value="assignment">Assignment</option>
              <option value="lab-test">Lab Test</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Occur Date */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="occurDate">
              Occurrence Date{" "}
              <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="occurDate"
              name="occurDate"
              type="date"
              className={styles.input}
            />
          </div>
        </div>

        {/* Custom Type field */}
        {noticeType === "custom" && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="customType">
              Custom Notice Type{" "}
              <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="customType"
              name="customType"
              type="text"
              className={styles.input}
              placeholder="Example: Viva / Workshop / Seminar"
            />
          </div>
        )}

        {/* Teacher select */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="teacherId">
            Mention Teacher <span className={styles.optional}>(optional)</span>
          </label>

          <select
            id="teacherId"
            name="teacherId"
            className={styles.select}
            value={selectedTeacherId}
            onChange={handleTeacherChange}
          >
            <option value="">Select a teacher</option>

            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>

          {/* hidden input so action function can read teacher name directly */}
          <input type="hidden" name="teacherName" value={selectedTeacherName} />
        </div>

        {/* Attachment */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="attachments">
            Attach File <span className={styles.optional}>(optional)</span>
          </label>

          <div className={styles.fileBox}>
            <input
              id="attachments"
              name="attachments"
              type="file"
              multiple
              className={styles.fileInput}
              onChange={handleFileChange}
            />

            <label htmlFor="attachments" className={styles.fileLabel}>
              Choose file(s)
            </label>

            <span className={styles.fileHint}>
              PDF, DOC, image or any required file
            </span>
          </div>

          {selectedFiles.length > 0 && (
            <div className={styles.fileList}>
              {selectedFiles.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>
                    {Math.ceil(file.size / 1024)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.note}>
            You can post with only description. Everything else is optional.
          </p>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Notice"}
          </button>
        </div>
      </Form>
    </section>
  );
}
