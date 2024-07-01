import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const app = express();
const upload = multer({ dest: 'uploads/' });

// Define the base URL for the external API
const API_BASE_URL = 'https://kielproses.loca.lt/api';
const STUDENT_API_BASE_URL = 'https://kielkelas.loca.lt/api';

app.use(cors({
    origin: 'http://127.0.0.1:5501' // Allow requests from this origin
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
    const file = req.file;

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
        const fileBuffer = fs.readFileSync(file.path);
        formData.append('file', fileBuffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
    } else {
        return res.status(400).json({ error: 'File does not exist' });
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                ...formData.getHeaders()
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

// Route to handle GET requests for /api/proses/itemPembelajaran/get/:idKelas/:idPertemuan
app.get('/api/proses/itemPembelajaran/get/:idKelas/:idPertemuan', async (req, res) => {
    const { idKelas, idPertemuan } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/itemPembelajaran/get/${idKelas}/${idPertemuan}`;

    try {
        const data = await fetchData(apiUrl);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// New endpoint to get PDFs for a specific class
app.get('/api/proses/:idKelas/pdfs', async (req, res) => {
    const { idKelas } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/${idKelas}/pdfs`;

    try {
        const data = await fetchData(apiUrl);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching PDFs' });
    }
});

// Route to handle PUT requests for updating itemPembelajaran
app.put('/api/proses/itemPembelajaran/update/:idKelas/:idPertemuan', async (req, res) => {
    const { idKelas, idPertemuan } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/itemPembelajaran/update/${idKelas}/${idPertemuan}`;
    const updatedItem = req.body;

    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(updatedItem)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText}, Details: ${errorDetails}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating itemPembelajaran:', error);
        res.status(500).json({ error: 'An error occurred while updating the itemPembelajaran' });
    }
});

// Route to handle DELETE requests for deleting itemPembelajaran
app.delete('/api/proses/itemPembelajaran/delete/:idKelas/:idPertemuan', async (req, res) => {
    const { idKelas, idPertemuan } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/itemPembelajaran/delete/${idKelas}/${idPertemuan}`;

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
        console.error('Error deleting itemPembelajaran:', error);
        res.status(500).json({ error: 'An error occurred while deleting the itemPembelajaran' });
    }
});

// Route to handle POST requests for adding new itemPembelajaran
app.post('/api/proses/itemPembelajaran/add/:idKelas', async (req, res) => {
    const { idKelas } = req.params;
    const apiUrl = `${API_BASE_URL}/proses/itemPembelajaran/add/${idKelas}`;
    const newItem = req.body;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(newItem)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText}, Details: ${errorDetails}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding itemPembelajaran:', error);
        res.status(500).json({ error: 'An error occurred while adding the itemPembelajaran' });
    }
});

// Route to handle GET requests for /api/member/:idKelas
app.get('/api/member/:idKelas', async (req, res) => {
    const { idKelas } = req.params;
    const apiUrl = `${API_BASE_URL}/member/${idKelas}`;

    try {
        const data = await fetchData(apiUrl);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Route to handle GET requests for /api/kontrol-kelas-student
app.get('/api/kontrol-kelas-student/:idKelas/:studentId', async (req, res) => {
    const { idKelas, studentId } = req.params;
    const apiUrl = `${STUDENT_API_BASE_URL}/kontrol-kelas-student/${idKelas}/${studentId}`;

    try {
        const data = await fetchData(apiUrl);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching student control data' });
    }
});

app.put('/api/kontrol-kelas-student/:idKelas/:studentId', async (req, res) => {
    const { idKelas, studentId } = req.params;
    const apiUrl = `${STUDENT_API_BASE_URL}/kontrol-kelas-student/${idKelas}/${studentId}`;
    const updatedNilaiAkhir = req.body.nilaiAkhir;

    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ kontrolKelas: idKelas, student: studentId, nilaiAkhir: updatedNilaiAkhir })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText}, Details: ${errorDetails}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating nilaiAkhir:', error);
        res.status(500).json({ error: 'An error occurred while updating nilaiAkhir' });
    }
});


// Start the server on port 3500
const port = 3500;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
