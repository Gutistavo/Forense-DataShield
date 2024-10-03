const crypto = require('crypto');
const fs = require('fs');

/**
 * Gera o hash SHA-256 de um arquivo.
 * @param {string} filePath - Caminho do arquivo.
 * @returns {string} - Hash SHA-256.
 */
function generateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

module.exports = { generateFileHash };
