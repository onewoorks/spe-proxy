import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = join(__dirname, '../..');


import express from 'express';


const router = express.Router();

router.get('/read', (req, res) => {
    const scriptfile = `${rootPath}/src/controllers/mykad/mykad.py`
    exec(`python3 ${scriptfile}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Error executing Python script');
        }
        // Assuming the Python script outputs JSON
        // const result = JSON.parse(stdout);
        let result;
        try {
            result = JSON.parse(stdout);
        } catch (error) {
            console.warn('Invalid JSON output:', stdout);
            result = { error: 'Invalid response from mykad reader' };
        }

        res.send(result);
    });
});

export default router;