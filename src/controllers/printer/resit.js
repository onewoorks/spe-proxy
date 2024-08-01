import axios from 'axios'
import wkhtmltopdf from 'wkhtmltopdf'
import fs from 'fs'
import { print } from "unix-print";
import path from 'path';

export function printResit(payload) {
    printPage(payload)
}

async function printPage(payload) {
    const outputPath  = path.join(`./tmp/resit/${Math.random().toString(36).substr(7)}.pdf`);
    try {
        const response = await axios.post(`${payload.url}`, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        await downloadPDF(response.data, outputPath);
        await printPDFToPrinter(outputPath, 'Pantum_P2500W_series_F8997E__auto');
        // fs.unlinkSync(outputPath);
        return response.data
    } catch (error) {
        console.error('Error:', error)
        throw error
    }
}

async function downloadPDF(url,outputPath) {
    try {
      const response = await axios({
        method: 'get',
        url: 'http://localhost:8000/'+url,
        responseType: 'arraybuffer'
      });
    
  
      const contentType = response.headers['content-type'];
      if (contentType === 'application/pdf') {
        fs.writeFileSync(outputPath, response.data);
        console.log('PDF downloaded successfully');
      } else {
        console.log('The URL did not return a PDF. Content-Type:', contentType);
        // Handle non-PDF response here
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }
  

async function printPDFToPrinter(pdfPath, printerName) {
    try {
      // const options = ["-o landscape", "-o fit-to-page", "-o media=A5"];
      const options = [];
      await print(pdfPath,printerName, options).then(console.log('......print....'));
      console.log(`PDF sent to printer: ${printerName}`);
    } catch (error) {
      console.error('Error printing PDF:', error);
      throw error;
    }
  }
// module.exports = { printResit };
