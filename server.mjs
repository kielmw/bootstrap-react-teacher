import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// Define the base URL for the external API
const API_BASE_URL = 'http://localhost:8080/api';

app.use(cors({
    origin: 'http://127.0.0.1:5555' // Allow requests from this origin
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Function to fetch data from external API
async function fetchData(apiUrl) {
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText}, Details: ${errorDetails}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Route to handle GET requests for /api/proses/guru/:id
app.get('/api/proses/guru/:id', async (req, res) => {
    const { id } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/guru/${id}`;

    try {
        const data = await fetchData(apiUrl);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Route to handle GET requests for /api/proses/:id
app.get('/api/proses/:id', async (req, res) => {
    const { id } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/${id}`;

    try {
        const data = await fetchData(apiUrl);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Route to handle PDF download
app.get('/api/proses/pdf/download/:idKelas/:idPdf', async (req, res) => {
    const { idKelas, idPdf } = req.params;
    const apiUrl = `${API_BASE_URL}/pdf/download/${idKelas}/${idPdf}`;

    try {
        const data = await fetchData(apiUrl);
        res.setHeader('Content-Disposition', `attachment; filename="${data.fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(data.pdfBytes, 'base64'));
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the PDF' });
    }
});

// Start the server on port 3000
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
