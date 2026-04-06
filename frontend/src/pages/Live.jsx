import { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import { db } from '../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export default function Live() {
    const [participants, setParticipants] = useState([]);
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const [winnerName, setWinnerName] = useState('');
    const [showWinnerAlert, setShowWinnerAlert] = useState(false);

    // 1. Listener untuk Daftar Peserta (Agar roda selalu update otomatis)
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'participants'), (snapshot) => {
            // Library roda membutuhkan format array of object dengan key 'option'
            const data = snapshot.docs.map(doc => ({
                option: doc.data().name
            }));
            setParticipants(data);
        });
        return () => unsubscribe();
    }, []);

    // 2. Listener untuk Status Roda dari Admin (Sutradara)
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'gameState', 'wheelStatus'), (docSnap) => {
            if (docSnap.exists()) {
                const status = docSnap.data();

                // Jika Admin menekan tombol spin (status.mustSpin menjadi true)
                if (status.mustSpin === true) {
                    setPrizeNumber(status.prizeNumber);
                    setWinnerName(status.winnerName);
                    setShowWinnerAlert(false); // Sembunyikan pemenang sebelumnya
                    setMustSpin(true); // PUTAR RODA!
                }
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px', fontFamily: 'sans-serif' }}>

            <h1 style={{ color: '#f9c006', fontSize: '36px', marginBottom: '10px' }}>🎯 Soul-Spin Live Event 🎯</h1>
            <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '40px' }}>Total Peserta Terdaftar: {participants.length}</p>

            {/* Tampilan Utama: Roda Putar */}
            <div style={{ transform: 'scale(1.2)', margin: '40px 0' }}>
                {participants.length > 0 ? (
                    <Wheel
                        mustStartSpinning={mustSpin}
                        prizeNumber={prizeNumber}
                        data={participants}
                        backgroundColors={['#3e3e3e', '#df3428', '#1084b1', '#f9c006', '#4CAF50', '#9c27b0']}
                        textColors={['#ffffff']}
                        onStopSpinning={() => {
                            setMustSpin(false);
                            setShowWinnerAlert(true); // Munculkan nama pemenang saat roda berhenti
                        }}
                    />
                ) : (
                    <div style={{ padding: '50px', border: '2px dashed #555', borderRadius: '50%', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h3 style={{ color: '#555' }}>Menunggu Peserta...</h3>
                    </div>
                )}
            </div>

            {/* Pengumuman Pemenang */}
            {showWinnerAlert && (
                <div style={{
                    marginTop: '30px',
                    padding: '20px 50px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '10px',
                    animation: 'fadeIn 1s'
                }}>
                    <h2 style={{ margin: 0, fontSize: '28px' }}>🎉 SELAMAT KEPADA 🎉</h2>
                    <h1 style={{ margin: '10px 0 0 0', fontSize: '48px', textTransform: 'uppercase' }}>{winnerName}</h1>
                </div>
            )}
        </div>
    );
}