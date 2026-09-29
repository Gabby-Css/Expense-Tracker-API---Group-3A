const { isUtf8 } = require('buffer');
const fs = require('fs');
const path = require('path');

// The file location can be changed with the DATA_FILE environment variable
const DATA_FILE = (process.env.DATA_FILE)
? path.resolve(process.env.DATA_FILE)
: path.join(__dirname, '..','..', 'data', 'express.json');

// Make sure the file exists before we try to read it.
function ensureFile(){
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

// Read every expense from the file and return them as an array.
function readAll(){
    ensureFile();
    const text = fs.readFileSync (DATA_FILE, 'utf-8')
    try{
        return JSON.parse(text || [])    
    }
    catch{
     // If the file is corrupted, start fresh instead of crashing the server.   
        return[];
    }
}
// Replace the whole file with the given array of expenses.
function writeAll(expenses) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

module.exports = { readAll, writeAll, DATA_FILE};


