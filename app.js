import express from "express";
import { getPrinters } from "unix-print";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';;
import os from 'os';
import cors from "cors"
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

import mykadRoutes from './src/routes/mykadRoutes.js';
import printRoutes from './src/routes/printRoutes.js';
import setupRoutes from './src/routes/setupRoutes.js';

const app = express();
app.use(cors())
const port = process.env.APP_PORT;
const localIP = getLocalIP();

// app.use(express.static('src/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  let filePath = path.join(__dirname, 'src/public/', 'index.html');
  console.log('.,,')
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading file');
      return;
    }
    const modifiedHtml = data.replace('{{LOCAL_IP}}', localIP);
    res.send(modifiedHtml);
  });
});

app.get('/:page', (req, res) => {
  let page = req.params.page;
  let filePath = path.join(__dirname, 'src/public/pages', `${page}.html`);
  if (fs.existsSync(filePath)) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('Error reading file');
        return;
      }
      const modifiedHtml = data.replace('{{LOCAL_IP}}', localIP);
      res.send(modifiedHtml);
    });
  } else {
    res.status(404).send('Page not found');
  }
});


app.use('/api/mykad', mykadRoutes);
app.use('/api/print', printRoutes);
app.use('/api/setup', setupRoutes);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    for (const iface of networkInterface) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'Unable to determine local IP';
}

app.listen(port, () => {
    console.log(`SPE Proxy app listening at http://${localIP}:${port}`);
});