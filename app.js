import express from "express";
import { getPrinters } from "unix-print";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';;
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

import mykadRoutes from './src/routes/mykadRoutes.js';
import printRoutes from './src/routes/printRoutes.js';
import setupRoutes from './src/routes/setupRoutes.js';

const app = express();
const port = 3000;

app.use(express.static('src/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/:page', (req, res) => {
    const page = req.params.page;
    const localIP = getLocalIP();
    const filePath = path.join(__dirname, 'src/public/pages', `${page}.html`);
    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Error reading file');
                return;
            }
            const modifiedHtml = data.replace('{{LOCAL_IP}}', localIP);
            console.log(localIP)
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

app.listen(port,'0.0.0.0', () => {
    console.log(`SPE Proxy app listening at http://localhost:${port}`);
});
