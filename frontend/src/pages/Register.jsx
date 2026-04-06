import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Register() {
    const [name, setName] = useState('');
    const [status, setStatus] = useState(''); // Untuk memberi tahu peserta apakah sukses/gagal

    const handleRegister = async (e) => {
        e.preventDefault(); // Mencegah halaman refresh saat tombol ditekan
        if (name.trim() === '') return;

        setStatus('Mendaftarkan...');

        try {
            // Menyimpan data ke koleksi "participants" di Firebase
            await addDoc(collection(db, 'participants'), {
                name: name
            });

            setStatus('✅ Berhasil mendaftar! Silakan tonton Live Stream di Discord.');
            setName(''); // Kosongkan form setelah berhasil
        } catch (error) {
            console.error("Error menambah data:", error);
            setStatus('❌ Gagal mendaftar. Terjadi kesalahan sistem.');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
            <h1>Pendaftaran Undian Soul-Spin 📝</h1>
            <p>Masukkan Username / Discord ID kamu untuk bergabung ke dalam roda undian.</p>

            <form onSubmit={handleRegister} style={{ marginTop: '30px' }}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi#1234"
                    required
                    style={{
                        padding: '12px',
                        fontSize: '16px',
                        width: '250px',
                        borderRadius: '5px',
                        border: '1px solid #ccc'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '12px 20px',
                        fontSize: '16px',
                        marginLeft: '10px',
                        cursor: 'pointer',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px'
                    }}
                >
                    Daftar Sekarang
                </button>
            </form>

            {/* Menampilkan pesan sukses/error */}
            {status && (
                <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: 'bold', color: status.includes('✅') ? 'green' : 'black' }}>
                    {status}
                </p>
            )}
        </div>
    );
}