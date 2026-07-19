import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonalStorage from '../pages/student/PersonalStorage';
import ShareMaterial from '../pages/teacher/ShareMaterial';
import TeacherNotices from '../pages/teacher/Notices';
import Profile from '../pages/account/Profile';
import MySections from '../pages/account/MySections';
import SectionAdmin from '../pages/account/SectionAdmin';

import Notifications from '../pages/account/Notifications';

const TeacherLayout = () => {
  return (
    <div className="app-container">
      <Sidebar role="teacher" />
      <main className="main-content">
        <div className="content-area">
          <Routes>
            <Route path="/personal/*" element={<PersonalStorage />} />
            <Route path="/share-material/*" element={<ShareMaterial />} />
            <Route path="/notices/*" element={<TeacherNotices />} />
            <Route path="/sections" element={<MySections />} />
            <Route path="/sections/:sectionId" element={<SectionAdmin />} />
            <Route path="/profile/*" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/teacher/personal" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;
