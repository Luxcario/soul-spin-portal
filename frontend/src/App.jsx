import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Import Halaman
import Auth from './pages/Auth';
import Home from './pages/Home';
import Admin from './pages/Admin';
import EventDetail from './pages/EventDetail';

function AppContent() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Yakin ingin keluar?")) {
      await signOut(auth);
      window.location.href = '/';
    }
  };

  return (
    <>
      <nav style={{ padding: '15px', backgroundColor: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}>🏠 Beranda</Link>
        {userData?.role === 'admin' && (
          <Link to="/admin" style={{ color: '#f9c006', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}>⚙️ Admin Panel</Link>
        )}
        {!user ? (
          <Link to="/auth" style={{ color: '#1084b1', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}>🔐 Login</Link>
        ) : (
          <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚪 Logout ({userData?.username})
          </button>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/event/:id" element={<EventDetail />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}