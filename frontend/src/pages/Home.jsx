import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';

export default function Home() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
            }
        });

        const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
            const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsList);
        });

        return () => { unsubscribeAuth(); unsubscribeEvents(); };
    }, []);

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1>🎯 Soul-Spin Portal 🎯</h1>
            <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '10px' }}>
                {user ? (
                    <h3>Halo, {userData?.username}! 👋 <small style={{ color: 'green' }}>[{userData?.role?.toUpperCase()}]</small></h3>
                ) : (
                    <Link to="/auth"><button style={{ padding: '10px 20px', cursor: 'pointer' }}>Login untuk Ikut Undian</button></Link>
                )}
            </div>

            <div style={{ textAlign: 'left' }}>
                <h2>📅 Undian Tersedia</h2>
                {events.map((evt) => (
                    <div key={evt.id} style={{ padding: '15px', border: '1px solid #ccc', marginBottom: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>{evt.title}</h3>
                            <p style={{ margin: '5px 0' }}>Hadiah: {evt.prize}</p>
                        </div>
                        <Link to={`/event/${evt.id}`}><button style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#1084b1', color: 'white', border: 'none', borderRadius: '5px' }}>Lihat Detail</button></Link>
                    </div>
                ))}
            </div>
        </div>
    );
}