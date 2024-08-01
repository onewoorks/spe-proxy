import fs from "fs";
import readline from "readline";

const path = './output.txt';
let kadData = {};

function parseAddress() {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        const lines = data.split('\n');
        const startIndex = lines.findIndex(line => line.trim() === 'Address:');
        const endIndex = lines.findIndex((line, index) => index > startIndex && line.startsWith('Reading JPN file 5'));
        const addressLines = lines.slice(startIndex + 1, endIndex); // Start from the line after 'Address:'
        const address = addressLines.join('\n').trim();
        kadData.alamat = address;
        resolve();
      });
    });
  }

function parseOtherData() {
  return new Promise((resolve) => {
    const readInterface = readline.createInterface({
      input: fs.createReadStream(path),
      console: false
    });

    readInterface.on('line', function(line) {
      if (line.startsWith('Name:')) {
        kadData.name = line.substring(6).trim();
      }
      if(line.startsWith('IC:')){
        kadData.ic = line.substring(6).trim();
      }
      if(line.startsWith('State of birth:')){
        kadData.state = line.substring(16).trim();
      }
    });

    readInterface.on('close', resolve);
  });
}

async function processData() {
  await Promise.all([parseAddress(), parseOtherData()]);
  console.log(kadData);
}

processData();
