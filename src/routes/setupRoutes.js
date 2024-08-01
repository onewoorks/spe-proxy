import express from 'express';
import fs from 'fs'
import path from "path";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getPrinters } from 'unix-print';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootPath = join(__dirname, '..');
const router = express.Router();

router.post('/save-settings', async (req, res) => {
    try {
        const settings = req.body;
        await fs.writeFileSync(join(rootPath, 'config/setting.json'), JSON.stringify(settings, null, 2));
        res.json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});


router.get('/printer-list',  async (req, res) => {
    try {
        const printerList = await getPrinters();
        res.json(printerList);
    } catch (error) {
        console.error('Error getting printer list:', error);
        res.status(500).json({ error: 'Failed to get printer list' });
    }
});

export default router;