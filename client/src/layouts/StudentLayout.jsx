import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonalStorage from '../pages/student/PersonalStorage';
import ClassMaterial from '../pages/student/ClassMaterial';
import Notices from '../pages/student/Notices';
import Profile from '../pages/account/Profile';
import MySections from '../pages/account/MySections';
import SectionAdmin from '../pages/account/SectionAdmin';
import CrTools from '../pages/account/CrTools';

import Notifications from '../pages/account/Notifications';

const StudentLayout = () => {
  return (
    <div className="app-container">
      <Sidebar role="student" />
      <main className="main-content">
        <div className="content-area">
          <Routes>
            <Route path="/personal/*" element={<PersonalStorage />} />
            <Route path="/materials/*" element={<ClassMaterial />} />
            <Route path="/notices/*" element={<Notices />} />
            <Route path="/sections" element={<MySections />} />
            <Route path="/sections/:sectionId" element={<SectionAdmin />} />
            <Route path="/cr-tools" element={<CrTools />} />
            <Route path="/profile/*" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/student/personal" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
