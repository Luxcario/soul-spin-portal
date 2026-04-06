const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000; // Kita gunakan port 5000 untuk backend

// Middleware
app.use(cors()); // Wajib! Agar React (port 5173) diizinkan mengambil data dari sini
app.use(express.json());

// Endpoint Test
app.get('/api/test', (req, res) => {
    // Backend mengirimkan response dalam bentuk JSON
    res.json({ message: "Sistem Undian Backend Berhasil Terhubung! 🚀" });
});

// Menyalakan Server
app.listen(PORT, () => {
    console.log(`Backend Server berjalan di http://localhost:${PORT}`);
});