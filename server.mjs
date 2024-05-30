import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' }); // Configure multer to save files to 'uploads/' directory

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

// Route to handle PDF deletion
app.delete('/api/proses/pdf/delete/:idKelas/:idPdf', async (req, res) => {
    const { idKelas, idPdf } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/pdf/delete/${idKelas}/${idPdf}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText}, Details: ${errorDetails}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting PDF:', error);
        res.status(500).json({ error: 'An error occurred while deleting the PDF' });
    }
});

// Route to handle PDF upload
app.post('/api/proses/pdf/upload/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const file = req.file; // multer adds the file object to req

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const apiUrl = `${API_BASE_URL}/proses/pdf/upload/${id}`;
    const formData = new FormData();
    
    // Extract file name from the file path
    const fileName = path.basename(file.originalname);

    formData.append('fileName', fileName);
    
    // Check if the file exists and append it to the FormData
    if (fs.existsSync(file.path)) {
        const fileStream = fs.createReadStream(file.path);
        const blob = new Blob([file.buffer], { type: 'application/pdf' }); // Create a Blob object from the file buffer
        formData.append('file', blob, file.originalname); // Append the Blob object to FormData
    } else {
        return res.status(400).json({ error: 'File does not exist' });
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            },
            body: formData
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText}, Details: ${errorDetails}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).json({ error: 'An error occurred while uploading the PDF' });
    }
});

// Start the server on port 3500
const port = 3500;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
