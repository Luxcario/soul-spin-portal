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
        const winnerIndex = Math.floor(Math.random() * participants.length);
        await updateDoc(doc(db, "events", id), { mustSpin: true, prizeNumber: winnerIndex, winnerName: participants[winnerIndex].option });
        setTimeout(async () => { await updateDoc(doc(db, "events", id), { mustSpin: false, status: "completed" }); }, 11000);
    };

    if (!event) return <h2>Loading...</h2>;
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = event.status === "completed";

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
                        {isRegistered ? <p style={{ color: 'green' }}>✅ Kamu sudah terdaftar</p> : (
                            <form onSubmit={handleJoin}>
                                <input placeholder="Username Game" value={gameUsername} onChange={e => setGameUsername(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
                                <button type="submit" style={{ width: '100%', marginTop: '10px', padding: '10px', cursor: 'pointer' }}>Daftar</button>
                            </form>
                        )}
                        {userData?.role === 'admin' && today === event.draw_date && (
                            <button onClick={handleSpin} style={{ marginTop: '20px', width: '100%', padding: '15px', backgroundColor: 'red', color: 'white', cursor: 'pointer' }}>🎯 SPIN SEKARANG</button>
                        )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ transform: 'scale(0.7)' }}>
                            {participants.length > 0 && <Wheel mustStartSpinning={mustSpin} prizeNumber={prizeNumber} data={participants} />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}