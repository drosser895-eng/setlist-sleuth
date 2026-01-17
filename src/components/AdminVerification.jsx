import React, { useState } from 'react';

export default function AdminVerification({ video, onVerified }) {
    const [channelId, setChannelId] = useState(video.owner_channel_id || '');
    const [proofUrl, setProofUrl] = useState(video.ownership_proof_url || '');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/videos/${video.id}/verify-owner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner_channel_id: channelId, proof_url: proofUrl })
            });
            const data = await res.json();
            if (data.success) {
                alert('Verified successfully!');
                if (onVerified) onVerified();
            }
        } catch (err) {
            console.error('Verification failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-verify-card" style={{ padding: '16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Verify Ownership</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                    type="text"
                    placeholder="YouTube Channel ID"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#000', color: '#fff' }}
                />
                <input
                    type="text"
                    placeholder="Proof URL (e.g. Channel Link)"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#000', color: '#fff' }}
                />
                <button
                    onClick={handleVerify}
                    disabled={loading}
                    style={{
                        padding: '10px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'Verifying...' : 'Mark as Owner Verified'}
                </button>
            </div>
        </div>
    );
}
