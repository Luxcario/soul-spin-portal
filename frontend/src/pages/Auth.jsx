import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                // PROSES LOGIN
                await signInWithEmailAndPassword(auth, email, password);
                alert("✅ Berhasil Login!");
                navigate('/');
            } else {
                // PROSES REGISTER
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Simpan data profil ke Firestore koleksi "users"
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: email,
                    username: username,
                    role: "user"
                });

                alert("✅ Berhasil Membuat Akun!");
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError("❌ Terjadi kesalahan: " + err.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', fontFamily: 'sans-serif' }}>
            <h2 style={{ textAlign: 'center' }}>{isLogin ? '🔑 Login Soul-Spin' : '📝 Daftar Akun Baru'}</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>

                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Username (Nama Tampilan)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '5px' }}
                    />
                )}

                <input
                    type="email"
                    placeholder="Alamat Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '5px' }}
                />

                <input
                    type="password"
                    placeholder="Password (minimal 6 karakter)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '5px' }}
                />

                {error && <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{error}</p>}

                <button type="submit" style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {isLogin ? 'MASUK' : 'BUAT AKUN'}
                </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <span
                    style={{ color: '#1084b1', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? 'Daftar di sini' : 'Login di sini'}
                </span>
            </p>
        </div>
    );
}