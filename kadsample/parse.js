const fs = require('fs');

fs.readFile('jpn1', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  
  // Process the APDU data here
  parseAPDU(data);
});

function parseAPDU(data) {
    // Assuming the APDU is in hexadecimal format
    const hexString = data.toString('hex');
    
    // Extract APDU components
    const cla = hexString.slice(0, 2);
    const ins = hexString.slice(2, 4);
    const p1 = hexString.slice(4, 6);
    const p2 = hexString.slice(6, 8);
    const lc = hexString.slice(8, 10);
    const dataField = hexString.slice(10, -4);
    const le = hexString.slice(-4);
  
    console.log('CLA:', cla);
    console.log('INS:', ins);
    console.log('P1:', p1);
    console.log('P2:', p2);
    console.log('Lc:', lc);
    console.log('Data:', dataField);
    console.log('Le:', le);
    // console.log('Raw:', Buffer.from(dataField,'hex').toString('utf8'))
  }
  