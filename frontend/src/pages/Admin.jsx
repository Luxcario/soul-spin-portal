import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function Admin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [prize, setPrize] = useState('');
    const [regStart, setRegStart] = useState('');
    const [regEnd, setRegEnd] = useState('');
    const [drawDate, setDrawDate] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- FUNGSI PRESET (Ini fitur baru buat moderator) ---
    const setPresetTime = (type) => {
        const now = new Date();

        // Format ke YYYY-MM-DDTHH:mm (standar datetime-local)
        const format = (date) => {
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date - offset).toISOString().slice(0, 16);
        };

        if (type === 'hourly') {
            // Preset Per-Jam: Buka sekarang, tutup 1 jam lagi
            setRegStart(format(now));
            const end = new Date(now.getTime() + (60 * 60 * 1000));
            setRegEnd(format(end));
            setDrawDate(format(new Date(end.getTime() + (5 * 60 * 1000)))); // Undi 5 mnt setelah tutup
        } else if (type === 'daily') {
            // Preset Per-Hari: Buka sekarang, tutup besok
            setRegStart(format(now));
            const end = new Date(now.getTime() + (24 * 60 * 60 * 1000));
            setRegEnd(format(end));
            setDrawDate(format(end));
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "events"), {
            title, prize, reg_start: regStart, reg_end: regEnd, draw_date: drawDate, status: "open", winnerName: ""
        });
        alert("Event Berhasil Dibuat!");
        setTitle(''); setPrize(''); setRegStart(''); setRegEnd(''); setDrawDate('');
    };

    if (loading) return <h2>Loading...</h2>;
    if (!isAdmin) return <h2 style={{ color: 'red', textAlign: 'center' }}>⛔ Akses Ditolak</h2>;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#1084b1', fontWeight: 'bold' }}>⬅️ Kembali ke Beranda</Link>
            <h1 style={{ textAlign: 'center', color: '#d32f2f' }}>⚙️ Dashboard Admin</h1>

            {/* FITUR PILIHAN DURASI */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button type="button" onClick={() => setPresetTime('hourly')} style={{ flex: 1, padding: '10px', backgroundColor: '#e3f2fd', color: '#1976d2', border: '1px solid #2196f3', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⚡ Undian Per-Jam</button>
                <button type="button" onClick={() => setPresetTime('daily')} style={{ flex: 1, padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #4caf50', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📅 Undian Per-Hari</button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
                <input placeholder="Judul" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '10px' }} />
                <input placeholder="Hadiah" value={prize} onChange={e => setPrize(e.target.value)} required style={{ padding: '10px' }} />

                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Waktu Registrasi (Mulai & Tutup):</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                    {/* TYPE DIGANTI datetime-local BIAR ADA JAMNYA */}
                    <input type="datetime-local" value={regStart} onChange={e => setRegStart(e.target.value)} required style={{ flex: 1, padding: '10px' }} />
                    <input type="datetime-local" value={regEnd} onChange={e => setRegEnd(e.target.value)} required style={{ flex: 1, padding: '10px' }} />
                </div>

                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Waktu Undi (Spin):</label>
                <input type="datetime-local" value={drawDate} onChange={e => setDrawDate(e.target.value)} required style={{ padding: '10px' }} />

                <button type="submit" style={{ padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>BUAT EVENT SEKARANG</button>
            </form>
        </div>
    );
}