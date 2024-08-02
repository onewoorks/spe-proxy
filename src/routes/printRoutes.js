// routes/printRoutes.js
import express from 'express';
import { getPrinters } from "unix-print";
import { printResit } from '../controllers/printer/resit.js';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();

router.get('/printer-list', async (req, res) => {
    getPrinters().then(printers => {
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

router.get('/resit/:domain/:tag/:resit/:module', async (req, res) =>{
    const data = {
        domain: req.params.domain,
        tenant_id: req.params.tag,
        resit_no: req.params.resit,
        module: req.params.module,
        url: `${process.env.SPE_HELPERS}/api/resit/create-terus`
      }
    try {
        const result = printResit(data);
        res.json(result);
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Printing failed' });
    }
})

export default router;