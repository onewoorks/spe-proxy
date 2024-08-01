const fs = require('fs');
const path = './output.txt'; // Change this to the path of your file

fs.watch(path, (eventType, filename) => {
    if (filename) {
        console.log(`File ${filename} has been modified!`);
        console.log(`Event type: ${eventType}`);
    } else {
        console.log('filename not provided');
    }
});

console.log(`Now watching ${path} for changes...`);