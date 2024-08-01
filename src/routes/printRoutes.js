// routes/printRoutes.js
import express from 'express';
import { getPrinters } from "unix-print";
import { printResit } from '../controllers/printer/resit.js';

const router = express.Router();

router.get('/printer-list', async (req, res) => {
    getPrinters().then(printers => {
        console.log(printers);
        res.send({
            result: "ok",
            printers: printers
        });
    }).catch(error => {
        console.error(error);
        res.status(500).send({
            result: "error",
            message: "Failed to get printers"
        });
    });
});

router.post('/resit', async(req, res) => {
    try {
        const result = printResit(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Printing failed' });
    }
});

export default router;