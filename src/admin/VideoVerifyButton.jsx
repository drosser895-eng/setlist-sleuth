import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const VideoVerifyButton = ({ videoId, channelId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleVerify = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/videos/${videoId}/verify-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ owner_channel_id: channelId })
      });
      
      if (response.ok) {
        setStatus('Verified!');
      } else {
        setStatus('Failed');
      }
    } catch (error) {
      setStatus('Error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Owner'}
      </button>
      {status && <span>{status}</span>}
    </div>
  );
};

export default VideoVerifyButton;
