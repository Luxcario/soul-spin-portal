import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, collection, addDoc, query, where, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Wheel } from 'react-custom-roulette';

export default function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Untuk mengecek apakah dia Admin
    const [gameUsername, setGameUsername] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // State untuk Roda Spin Lokal di layar ini
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);

    // 1. Ambil Auth & Data Profil User
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const uDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (uDoc.exists()) setUserData(uDoc.data());
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Ambil data Event secara REAL-TIME (Agar tahu saat Admin klik Spin)
    useEffect(() => {
        if (!id) return;
        const unsubscribe = onSnapshot(doc(db, "events", id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setEvent({ id: docSnap.id, ...data });

                // Sinkronisasi status roda dari database ke layar user
                if (data.mustSpin) {
                    setPrizeNumber(data.prizeNumber);
                    setMustSpin(true);
                } else {
                    setMustSpin(false);
                }
            }
        });
        return () => unsubscribe();
    }, [id]);

    // 3. Ambil daftar peserta
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, "event_participants"), where("eventId", "==", id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pList = snapshot.docs.map(doc => ({
                id: doc.id,
                option: doc.data().gameUsername,
                userId: doc.data().userId
            }));
            setParticipants(pList);

            if (user) {
                const found = pList.find(p => p.userId === user.uid);
                setIsRegistered(!!found);
            }
        });
        return () => unsubscribe();
    }, [id, user]);

    // 4. Fungsi Daftar
    const handleJoinEvent = async (e) => {
        e.preventDefault();
        if (!user) return alert("Silakan login terlebih dahulu!");
        setStatusMsg('Mendaftarkan...');
        try {
            await addDoc(collection(db, "event_participants"), {
                eventId: id,
                userId: user.uid,
                gameUsername: gameUsername,
                joinedAt: new Date().toISOString()
            });
            setStatusMsg('✅ Berhasil mendaftar!');
            setGameUsername('');
        } catch (error) {
            console.error(error);
            setStatusMsg('❌ Gagal mendaftar.');
        }
    };

    // 5. FUNGSI ADMIN: Eksekusi Spin
    const handleTriggerSpin = async () => {
        if (participants.length === 0) return alert("Belum ada peserta!");

        // Tentukan pemenang
        const winnerIndex = Math.floor(Math.random() * participants.length);
        const winnerName = participants[winnerIndex].option;

        // Perintahkan semua layar untuk memutar roda
        await updateDoc(doc(db, "events", id), {
            mustSpin: true,
            prizeNumber: winnerIndex,
            winnerName: winnerName
        });

        // Tunggu roda selesai berputar (11 detik), lalu ganti status jadi completed
        setTimeout(async () => {
            await updateDoc(doc(db, "events", id), {
                mustSpin: false,
                status: "completed"
            });
        }, 11000);
    };

    if (!event) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Memuat data undian...</h2>;

    // Logika Waktu
    const todayDate = new Date().toISOString().split('T')[0];
    const isRegOpen = todayDate >= event.reg_start && todayDate <= event.reg_end;
    const isDrawDay = todayDate === event.draw_date;
    const isCompleted = event.status === "completed" || (event.winnerName && !event.mustSpin);

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#d32f2f', fontSize: '36px', margin: '0 0 10px 0' }}>{event.title}</h1>
                <p style={{ fontSize: '18px', color: '#555' }}>Hadiah Utama: <strong>{event.prize}</strong></p>
            </div>

            {isCompleted ? (
                /* --- TAMPILAN JIKA UNDIAN SUDAH SELESAI --- */
                <div style={{ padding: '40px', backgroundColor: '#4CAF50', color: 'white', borderRadius: '15px', textAlign: 'center', animation: 'fadeIn 1s' }}>
                    <h2>🎉 UNDIAN TELAH SELESAI 🎉</h2>
                    <p style={{ fontSize: '20px' }}>Pemenang Hadiah {event.prize} adalah:</p>
                    <h1 style={{ fontSize: '50px', margin: '10px 0', textTransform: 'uppercase' }}>{event.winnerName}</h1>
                    <p>Selamat kepada pemenang! Hadiah akan diproses oleh Admin.</p>
                </div>
            ) : (
                /* --- TAMPILAN JIKA UNDIAN BELUM SELESAI --- */
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>

                    {/* PANEL KIRI: FORM PENDAFTARAN */}
                    <div style={{ flex: '1', minWidth: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
                        <h3>Jadwal & Pendaftaran</h3>
                        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
                            <p style={{ margin: '5px 0' }}>🗓️ Buka: {event.reg_start} s/d {event.reg_end}</p>
                            <p style={{ margin: '5px 0', color: '#d32f2f', fontWeight: 'bold' }}>🎯 Diundi: {event.draw_date}</p>
                        </div>

                        {!user ? (
                            <p style={{ color: 'red' }}>Login untuk mendaftar.</p>
                        ) : isRegistered ? (
                            <div style={{ padding: '15px', backgroundColor: '#dff0d8', color: '#3c763d', borderRadius: '5px' }}>
                                <p><strong>✅ Kamu Sudah Terdaftar!</strong><br />Username: {participants.find(p => p.userId === user.uid)?.option}</p>
                            </div>
                        ) : isRegOpen ? (
                            <form onSubmit={handleJoinEvent}>
                                <input type="text" value={gameUsername} onChange={(e) => setGameUsername(e.target.value)} required placeholder="Username / ID Game" style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' }} />
                                {statusMsg && <p style={{ color: statusMsg.includes('✅') ? 'green' : 'red' }}>{statusMsg}</p>}
                                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1084b1', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>DAFTAR SEKARANG</button>
                            </form>
                        ) : (
                            <div style={{ padding: '15px', backgroundColor: '#f2dede', color: '#a94442', borderRadius: '5px' }}>
                                <p><strong>Pendaftaran Ditutup.</strong></p>
                            </div>
                        )}

                        {/* PANEL RAHASIA ADMIN (HANYA MUNCUL JIKA HARI INI ADALAH HARI UNDIAN) */}
                        {userData?.role === 'admin' && (
                            <div style={{ marginTop: '30px', padding: '15px', border: '2px dashed #d32f2f', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>⚙️ KONTROL ADMIN</h4>
                                {isDrawDay ? (
                                    <button
                                        onClick={handleTriggerSpin}
                                        disabled={event.mustSpin}
                                        style={{ width: '100%', padding: '12px', backgroundColor: event.mustSpin ? '#ccc' : '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: event.mustSpin ? 'not-allowed' : 'pointer' }}
                                    >
                                        {event.mustSpin ? '🔴 SEDANG MENGUNDI...' : '🎯 EKSEKUSI UNDIAN SEKARANG'}
                                    </button>
                                ) : (
                                    <p style={{ fontSize: '14px', color: 'gray', margin: 0 }}>Tombol Spin akan otomatis terbuka pada tanggal {event.draw_date}.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* PANEL KANAN: RODA UNDIAN */}
                    <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                        <h3>Live Roda Undian ({participants.length})</h3>
                        <div style={{ transform: 'scale(0.8)', margin: '-20px 0' }}>
                            {participants.length > 0 ? (
                                <Wheel
                                    mustStartSpinning={mustSpin}
                                    prizeNumber={prizeNumber}
                                    data={participants}
                                    backgroundColors={['#3e3e3e', '#df3428', '#1084b1', '#f9c006', '#4CAF50']}
                                    textColors={['#ffffff']}
                                />
                            ) : (
                                <div style={{ padding: '50px', border: '2px dashed #ccc', borderRadius: '50%', width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p style={{ color: 'gray', textAlign: 'center' }}>Belum ada peserta.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}