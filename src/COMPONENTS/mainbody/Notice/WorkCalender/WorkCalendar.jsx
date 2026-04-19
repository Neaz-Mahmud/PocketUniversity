import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styles from "./WorkCalendar.module.css";

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function WorkCalendar() {
  const notices = useSelector((state) => state.AllNoticeSlice.notices || []);

  const today = new Date();
  const todayString = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeNotice, setActiveNotice] = useState(null);

  // only valid notices with description + valid date
  const validNotices = useMemo(() => {
    return notices.filter(
      (notice) =>
        notice.description &&
        notice.description.trim() !== "" &&
        notice.occurDate &&
        isValidDateString(notice.occurDate),
    );
  }, [notices]);

  // only today or future notices
  const futureNotices = useMemo(() => {
    return validNotices.filter((notice) => notice.occurDate >= todayString);
  }, [validNotices, todayString]);

  // count notices by date
  const noticeCountByDate = useMemo(() => {
    const map = {};

    futureNotices.forEach((notice) => {
      if (!map[notice.occurDate]) {
        map[notice.occurDate] = 0;
      }
      map[notice.occurDate] += 1;
    });

    return map;
  }, [futureNotices]);

  // notices for selected date
  const selectedDateNotices = useMemo(() => {
    if (!selectedDate) return [];

    return [...futureNotices]
      .filter((notice) => notice.occurDate === selectedDate)
      .reverse();
  }, [futureNotices, selectedDate]);

  // year dropdown
  const yearOptions = useMemo(() => {
    const years = new Set([today.getFullYear()]);

    validNotices.forEach((notice) => {
      const year = Number(notice.occurDate.slice(0, 4));
      if (!Number.isNaN(year)) {
        years.add(year);
      }
    });

    const yearArray = Array.from(years);
    const minYear = Math.min(...yearArray) - 1;
    const maxYear = Math.max(...yearArray) + 2;

    const result = [];
    for (let y = minYear; y <= maxYear; y++) {
      result.push(y);
    }

    return result;
  }, [validNotices, today]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());

    if (noticeCountByDate[todayString]) {
      setSelectedDate(todayString);
    } else {
      setSelectedDate(null);
    }
  };

  const calendarCells = [];

  // empty cells before month starts
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(
      <div key={`empty-start-${i}`} className={styles.emptyCell}></div>,
    );
  }

  // date cells
  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = formatDate(currentYear, currentMonth, day);
    const isToday = fullDate === todayString;
    const isSelected = fullDate === selectedDate;
    const noticeCount = noticeCountByDate[fullDate] || 0;
    const isMarked = noticeCount > 0;

    calendarCells.push(
      <button
        key={fullDate}
        type="button"
        className={`${styles.dayCell}
          ${isToday ? styles.today : ""}
          ${isSelected ? styles.selected : ""}
          ${isMarked ? styles.marked : ""}
          ${!isMarked ? styles.disabledDay : ""}
        `}
        onClick={() => isMarked && setSelectedDate(fullDate)}
        disabled={!isMarked}
        title={
          isMarked
            ? `${noticeCount} notice${noticeCount > 1 ? "s" : ""}`
            : "No upcoming notice"
        }
      >
        <span className={styles.dayNumber}>{day}</span>

        {isMarked && (
          <span className={styles.countBadge}>
            {noticeCount > 9 ? "9+" : noticeCount}
          </span>
        )}
      </button>,
    );
  }

  // empty cells after month ends
  const totalUsed = firstDayIndex + daysInMonth;
  const remaining = (7 - (totalUsed % 7)) % 7;

  for (let i = 0; i < remaining; i++) {
    calendarCells.push(
      <div key={`empty-end-${i}`} className={styles.emptyCell}></div>,
    );
  }

  return (
    <>
      <div className={styles.wrapper}>
        {/* Calendar */}
        <div className={styles.calendarCard}>
          <div className={styles.top}>
            <div>
              <h2 className={styles.title}>Notice Calendar</h2>
              <p className={styles.subtitle}>
                Only today and future notice dates are active
              </p>
            </div>

            <button
              type="button"
              className={styles.todayBtn}
              onClick={handleGoToday}
            >
              Today
            </button>
          </div>

          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.smallBtn}
              onClick={handlePrevMonth}
            >
              Prev
            </button>

            <select
              className={styles.select}
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
            >
              {monthOptions.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.smallBtn}
              onClick={handleNextMonth}
            >
              Next
            </button>
          </div>

          <div className={styles.weekdays}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className={styles.grid}>{calendarCells}</div>
        </div>

        {/* Selected date notices */}
        <div className={styles.noticeCard}>
          <div className={styles.noticeTop}>
            <div>
              <h3 className={styles.noticeTitle}>Selected Date Notices</h3>
              <p className={styles.noticeSubTitle}>
                Click a marked date to view notices
              </p>
            </div>

            {selectedDate && (
              <div className={styles.selectedInfo}>
                <span className={styles.selectedBadge}>{selectedDate}</span>
                <span className={styles.countText}>
                  {selectedDateNotices.length} notice
                  {selectedDateNotices.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {!selectedDate ? (
            <p className={styles.emptyText}>
              Select a marked date from the calendar.
            </p>
          ) : selectedDateNotices.length === 0 ? (
            <p className={styles.emptyText}>
              No upcoming notices for this date.
            </p>
          ) : (
            <div className={styles.noticeList}>
              {selectedDateNotices.map((notice, index) => (
                <button
                  key={index}
                  type="button"
                  className={styles.noticeItem}
                  onClick={() => setActiveNotice(notice)}
                >
                  <div className={styles.noticeItemTop}>
                    <h4 className={styles.noticeItemTitle}>
                      {notice.title || "Untitled Notice"}
                    </h4>

                    <span className={styles.openText}>Open</span>
                  </div>

                  <p className={styles.noticeDescription}>
                    {notice.description}
                  </p>

                  <div className={styles.metaRow}>
                    {notice.noticeType && (
                      <span className={styles.metaTag}>
                        Type: {notice.noticeType}
                      </span>
                    )}

                    {notice.teacherName && (
                      <span className={styles.metaTag}>
                        Teacher: {notice.teacherName}
                      </span>
                    )}

                    {notice.occurDate && (
                      <span className={styles.metaTag}>
                        Date: {notice.occurDate}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {activeNotice && (
        <div
          className={styles.modalOverlay}
          onClick={() => setActiveNotice(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div>
                <h3 className={styles.modalTitle}>
                  {activeNotice.title || "Untitled Notice"}
                </h3>
                <p className={styles.modalSubTitle}>Full notice details</p>
              </div>

              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setActiveNotice(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalMeta}>
              {activeNotice.noticeType && (
                <span className={styles.metaTag}>
                  Type: {activeNotice.noticeType}
                </span>
              )}

              {activeNotice.occurDate && (
                <span className={styles.metaTag}>
                  Date: {activeNotice.occurDate}
                </span>
              )}

              {activeNotice.teacherName && (
                <span className={styles.metaTag}>
                  Teacher: {activeNotice.teacherName}
                </span>
              )}
            </div>

            <div className={styles.modalBody}>
              <p className={styles.fullDescription}>
                {activeNotice.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- helper functions ---------- */

function formatDate(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function isValidDateString(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
