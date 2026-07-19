import { useState } from 'react';
import axios from 'axios';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Camera } from 'lucide-react';
import '../../styles/Panels.css';
import './Profile.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.patch('/users/me', { name });
      setUser((u) => ({ ...u, ...data }));
      setMessage({ type: 'success', text: 'Profile updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const { data } = await api.post('/users/me/avatar/presign', { mimeType: file.type });
      await axios.put(data.presignedUrl, file, { headers: { 'Content-Type': file.type } });
      const { data: updated } = await api.post('/users/me/avatar/confirm', { fileKey: data.fileKey });
      setUser((u) => ({ ...u, ...updated }));
      setMessage({ type: 'success', text: 'Profile picture updated' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Avatar upload failed' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Profile</h2>
        <p className="text-secondary">Your personal account details</p>
      </div>

      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="avatar-upload-row">
        <div className="avatar-lg">{user?.name?.charAt(0).toUpperCase() || '?'}</div>
        <div>
          <label htmlFor="avatar-input" className="btn btn-secondary btn-sm avatar-upload-label">
            <Camera size={15} /> {uploadingAvatar ? 'Uploading…' : 'Change photo'}
          </label>
          <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} className="sr-only" />
        </div>
      </div>

      <form onSubmit={handleSave} className="form-grid profile-form">
        <div className="form-group">
          <label htmlFor="profile-name">Full Name</label>
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="profile-email">Email (fixed at registration)</label>
          <input id="profile-email" value={user?.email || ''} disabled />
        </div>
        <div className="form-group">
          <label htmlFor="profile-phone">Phone (fixed at registration)</label>
          <input id="profile-phone" value={user?.phone || ''} disabled />
        </div>
        <div className="form-group">
          <label htmlFor="profile-role">Account type</label>
          <input id="profile-role" value={user?.role || ''} disabled className="profile-role-input" />
        </div>
        <button type="submit" className="btn btn-primary profile-save-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
