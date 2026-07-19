import { useState, useEffect } from 'react';
import api from '../../api/axios';
import FileExplorer from '../../components/FileExplorer';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Panels.css';

const PersonalStorage = () => {
  const { user } = useAuth();
  const [quota, setQuota] = useState(null);
  const [semester, setSemester] = useState(null); // { _id, name }
  const [course, setCourse] = useState(null); // { _id, name }

  const refreshQuota = async () => {
    try {
      const { data } = await api.get('/personal/quota');
      setQuota(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { refreshQuota(); }, [course]);

  const pct = quota ? Math.min(100, (quota.used / quota.limit) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h2>Personal Storage</h2>
        <p className="text-secondary">Private files only you can see — {user?.role === 'teacher' ? '1 GB' : '500 MB'} quota</p>
      </div>

      {quota && (
        <div className="card quota-card">
          <div className="quota-row">
            <span>Storage used</span>
            <span className="text-secondary">
              {(quota.used / 1024 / 1024).toFixed(2)} MB / {(quota.limit / 1024 / 1024).toFixed(0)} MB
            </span>
          </div>
          <div className="quota-track">
            <div
              className={`quota-fill${pct > 90 ? ' is-danger' : ''}`}
              style={{ '--quota-pct': `${pct}%` }}
            />
          </div>
        </div>
      )}

      {!semester && (
        <FileExplorer
          endpoint="/personal"
          mode="folders"
          parentId={null}
          folderType="semester"
          onFolderClick={setSemester}
          title="Semesters"
        />
      )}

      {semester && !course && (
        <FileExplorer
          endpoint="/personal"
          mode="folders"
          parentId={semester._id}
          folderType="course"
          onFolderClick={setCourse}
          onBack={() => setSemester(null)}
          title={semester.name}
        />
      )}

      {semester && course && (
        <FileExplorer
          endpoint="/personal"
          mode="files"
          folderId={course._id}
          onBack={() => setCourse(null)}
          title={`${semester.name} / ${course.name}`}
          maxSize={(user?.role === 'teacher' ? 1024 : 500) * 1024 * 1024}
        />
      )}
    </div>
  );
};

export default PersonalStorage;
