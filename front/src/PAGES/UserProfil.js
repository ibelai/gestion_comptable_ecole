import React, { useEffect, useState } from "react";
import UploadAvatar from "../PAGES/UploadAvatar";
import axios from "axios";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [token]);

  const handleAvatarUpdated = (avatarUrl) => {
    setUser((prev) => ({ ...prev, avatar: avatarUrl }));
  };

  if (!user) return <p>Chargement...</p>;

  return (
    <div>
      <h2>Profil utilisateur</h2>
      {user.avatar ? (
        <img src={`${API_URL}${user.avatar}`} alt="Avatar" style={{ width: 120, borderRadius: "50%" }} />
      ) : (
        <p>Aucun avatar</p>
      )}
      <UploadAvatar token={token} onAvatarUpdated={handleAvatarUpdated} />
    </div>
  );
};

export default UserProfile;
