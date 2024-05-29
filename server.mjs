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
    const apiUrl = `${API_BASE_URL}/proses/pdf/download/${idKelas}/${idPdf}`;

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

        // Get content disposition from response headers
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = `${idPdf}`;

        // Extract filename from content disposition if available
        if (contentDisposition) {
            const matches = contentDisposition.match(/filename="(.+?)"/);
            if (matches && matches.length > 1) {
                fileName = matches[1];
            }
        }

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', response.headers.get('content-type'));

        // Stream the file data directly to the response
        response.body.pipe(res);
    } catch (error) {
        console.error('Error fetching the file:', error);
        res.status(500).json({ error: 'An error occurred while fetching the file' });
    }
});

// Start the server on port 3000
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
