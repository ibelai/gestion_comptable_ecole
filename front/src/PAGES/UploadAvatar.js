import React, { useState } from "react";
import axios from "axios";

const UploadAvatar = ({ token, onAvatarUpdated }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => setFile(e.target.files[0]);
   const API_URL = process.env.REACT_APP_API_URL ;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Veuillez sélectionner une image");
      return;
    }
    setError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.post(`${API_URL}/api/user/profile/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      onAvatarUpdated(res.data.avatarUrl);
    } catch (err) {
      setError("Erreur lors de l'upload");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button className="btn btn-primary mt-2" type="submit">Uploader avatar</button>
      {error && <p className="text-danger">{error}</p>}
    </form>
  );
};

export default UploadAvatar;
