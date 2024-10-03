const fs = require('fs');
const path = require('path');

/**
 * Realiza a cópia de um arquivo para o diretório de extrações, garantindo que a estrutura de diretórios seja preservada.
 * @param {string} sourcePath - Caminho original do arquivo.
 * @param {string} destinationDir - Diretório de destino para a extração.
 * @returns {string} - Caminho do arquivo extraído.
 */
function extractFile(sourcePath, destinationDir) {
  // Certifica que a estrutura de diretórios no destino seja criada
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const fileName = path.basename(sourcePath);
  const destinationPath = path.join(destinationDir, fileName);

  fs.copyFileSync(sourcePath, destinationPath);
  console.log(`Arquivo ${fileName} extraído para ${destinationPath}`);

  return destinationPath;
}

module.exports = { extractFile };
