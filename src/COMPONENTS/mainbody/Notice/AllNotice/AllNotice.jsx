import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import styles from "./AllNotice.module.css";
import { AllNoticeSliceactions } from "../../../../store/AllNoticeSlice";

export default function AllNotice() {
  const dispatch = useDispatch();
  const notices = useSelector((state) => state.AllNoticeSlice.notices);

  const [expandedItems, setExpandedItems] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    noticeType: "",
    occurDate: "",
    teacherName: "",
  });

  // latest notice on top + remove empty notices
  const visibleNotices = useMemo(() => {
    return notices
      .map((notice, index) => ({
        ...notice,
        originalIndex: index,
      }))
      .filter(
        (notice) => notice.description && notice.description.trim() !== "",
      )
      .reverse();
  }, [notices]);

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleDelete = (originalIndex) => {
    const updatedNotices = notices.filter(
      (_, index) => index !== originalIndex,
    );
    dispatch(AllNoticeSliceactions.setNotices(updatedNotices));
  };

  const handleEditStart = (notice) => {
    setEditingIndex(notice.originalIndex);
    setEditData({
      title: notice.title || "",
      description: notice.description || "",
      noticeType: notice.noticeType || "",
      occurDate: notice.occurDate || "",
      teacherName: notice.teacherName || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSave = () => {
    if (!editData.description.trim()) return;

    const updatedNotices = [...notices];

    updatedNotices[editingIndex] = {
      ...updatedNotices[editingIndex],
      ...editData,
    };

    dispatch(AllNoticeSliceactions.setNotices(updatedNotices));
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
  };

  if (visibleNotices.length === 0) {
    return (
      <div className={styles.emptyBox}>
        <h3>No notices yet</h3>
        <p>When a notice is posted, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {visibleNotices.map((notice) => {
        const isExpanded = expandedItems[notice.originalIndex];
        const isEditing = editingIndex === notice.originalIndex;
        const shouldShowToggle =
          notice.description && notice.description.length > 120;

        return (
          <div key={notice.originalIndex} className={styles.card}>
            {/* Top */}
            <div className={styles.top}>
              <div className={styles.profileArea}>
                <div className={styles.avatar}>N</div>

                <div>
                  <h3 className={styles.name}>Class Representative</h3>
                  <p className={styles.timeText}>Posted notice</p>
                </div>
              </div>

              {!isEditing && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => handleEditStart(notice)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(notice.originalIndex)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Meta */}
            {!isEditing && (
              <div className={styles.meta}>
                {notice.title && (
                  <p className={styles.metaItem}>
                    <span>Title:</span> {notice.title}
                  </p>
                )}

                {notice.noticeType && (
                  <p className={styles.metaItem}>
                    <span>Type:</span> {notice.noticeType}
                  </p>
                )}

                {notice.occurDate && (
                  <p className={styles.metaItem}>
                    <span>Date:</span> {notice.occurDate}
                  </p>
                )}

                {notice.teacherName && (
                  <p className={styles.metaItem}>
                    <span>Teacher:</span> {notice.teacherName}
                  </p>
                )}
              </div>
            )}

            {/* Normal view */}
            {!isEditing ? (
              <div className={styles.content}>
                <p
                  className={`${styles.description} ${
                    isExpanded ? styles.expanded : styles.clamped
                  }`}
                >
                  {notice.description}
                </p>

                {shouldShowToggle && (
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => toggleExpand(notice.originalIndex)}
                  >
                    {isExpanded ? "See less" : "See more"}
                  </button>
                )}
              </div>
            ) : (
              /* Edit view */
              <div className={styles.editBox}>
                <input
                  type="text"
                  name="title"
                  value={editData.title}
                  onChange={handleEditChange}
                  placeholder="Notice title"
                  className={styles.input}
                />

                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleEditChange}
                  placeholder="Notice description"
                  className={styles.textarea}
                />

                <div className={styles.editGrid}>
                  <input
                    type="text"
                    name="noticeType"
                    value={editData.noticeType}
                    onChange={handleEditChange}
                    placeholder="Notice type"
                    className={styles.input}
                  />

                  <input
                    type="date"
                    name="occurDate"
                    value={editData.occurDate}
                    onChange={handleEditChange}
                    className={styles.input}
                  />
                </div>

                <input
                  type="text"
                  name="teacherName"
                  value={editData.teacherName}
                  onChange={handleEditChange}
                  placeholder="Teacher name"
                  className={styles.input}
                />

                <div className={styles.editActions}>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleEditSave}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleEditCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
