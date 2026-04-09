import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, collection, addDoc, query, where, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Wheel } from 'react-custom-roulette';

export default function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [gameUsername, setGameUsername] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);

    // State untuk edit waktu undian yang lebih presisi (jam & menit)
    const [newDrawDate, setNewDrawDate] = useState('');

    useEffect(() => {
        onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const uDoc = await getDoc(doc(db, "users", currentUser.uid));
                setUserData(uDoc.data());
            }
        });
    }, []);

    useEffect(() => {
        const unsubEvent = onSnapshot(doc(db, "events", id), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setEvent(data);
                if (data.mustSpin) { setPrizeNumber(data.prizeNumber); setMustSpin(true); }
                else { setMustSpin(false); }
            }
        });
        const q = query(collection(db, "event_participants"), where("eventId", "==", id));
        const unsubPart = onSnapshot(q, (snap) => {
            const pList = snap.docs.map(d => ({ option: d.data().gameUsername, userId: d.data().userId }));
            setParticipants(pList);
            if (user) setIsRegistered(pList.some(p => p.userId === user.uid));
        });
        return () => { unsubEvent(); unsubPart(); };
    }, [id, user]);

    const handleJoin = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "event_participants"), { eventId: id, userId: user.uid, gameUsername });
        alert("Berhasil Daftar!");
    };

    const handleSpin = async () => {
        if (participants.length === 0) return alert("Belum ada peserta!");
        const winnerIndex = Math.floor(Math.random() * participants.length);
        await updateDoc(doc(db, "events", id), { mustSpin: true, prizeNumber: winnerIndex, winnerName: participants[winnerIndex].option });
        setTimeout(async () => { await updateDoc(doc(db, "events", id), { mustSpin: false, status: "completed" }); }, 11000);
    };

    // Fungsi Admin untuk memperpanjang event menggunakan jam yang spesifik
    const handleExtendEvent = async () => {
        if (!newDrawDate) return alert("Pilih waktu baru dulu!");
        try {
            await updateDoc(doc(db, "events", id), {
                draw_date: newDrawDate,
                reg_end: newDrawDate
            });
            alert("Waktu undian berhasil diperbarui!");
            setNewDrawDate('');
        } catch (error) {
            console.error(error);
            alert("Gagal memperbarui waktu.");
        }
    };

    if (!event) return <h2>Loading...</h2>;

    // LOGIKA BARU: Cek apakah waktu sekarang sudah masuk jam undian
    const now = new Date();
    const drawTimeObj = new Date(event.draw_date);
    const isDrawTimePassed = now >= drawTimeObj;

    const isCompleted = event.status === "completed";

    // Format tampilan waktu untuk user
    const displayDate = new Date(event.draw_date).toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#1084b1', fontWeight: 'bold' }}>⬅️ Kembali ke Beranda</Link>
            <h1 style={{ textAlign: 'center' }}>{event.title}</h1>

            {isCompleted ? (
                <div style={{ padding: '30px', backgroundColor: '#4CAF50', color: 'white', textAlign: 'center', borderRadius: '10px' }}>
                    <h1>🏆 PEMENANG: {event.winnerName} 🏆</h1>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '10px' }}>
                        <p>Hadiah: {event.prize}</p>
                        <p>Waktu Undian: <b>{displayDate}</b></p>

                        {isRegistered ? <p style={{ color: 'green' }}>✅ Kamu sudah terdaftar</p> : (
                            <form onSubmit={handleJoin}>
                                <input placeholder="Username Game" value={gameUsername} onChange={e => setGameUsername(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
                                <button type="submit" style={{ width: '100%', marginTop: '10px', padding: '10px', cursor: 'pointer' }}>Daftar</button>
                            </form>
                        )}

                        {/* Tombol Spin akan muncul saat isDrawTimePassed bernilai TRUE */}
                        {userData?.role === 'admin' && isDrawTimePassed && (
                            <button onClick={handleSpin} style={{ marginTop: '20px', width: '100%', padding: '15px', backgroundColor: 'red', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>🎯 SPIN SEKARANG</button>
                        )}

                        {/* PANEL EDIT WAKTU KHUSUS ADMIN */}
                        {userData?.role === 'admin' && (
                            <div style={{ marginTop: '30px', padding: '15px', border: '1px dashed red', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>⚙️ Perpanjang Waktu Undian</h4>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="datetime-local"
                                        value={newDrawDate}
                                        onChange={e => setNewDrawDate(e.target.value)}
                                        style={{ flex: 1, padding: '8px' }}
                                    />
                                    <button onClick={handleExtendEvent} style={{ padding: '8px 15px', backgroundColor: '#f0ad4e', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                                        Perpanjang
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ transform: 'scale(0.7)' }}>
                            {participants.length > 0 ? (
                                <Wheel mustStartSpinning={mustSpin} prizeNumber={prizeNumber} data={participants} />
                            ) : (
                                <p style={{ color: 'gray', marginTop: '50px' }}>Belum ada peserta</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}