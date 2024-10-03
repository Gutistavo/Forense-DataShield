const fs = require('fs');
const path = require('path');

/**
 * Grava um log forense para uma operação em um único arquivo.
 * @param {string} filePath - Caminho do arquivo extraído.
 * @param {string} hash - Hash SHA-256 do arquivo.
 * @param {string} user - Usuário que realizou a extração.
 * @param {string} logDir - Diretório onde o log da operação será salvo.
 * @param {string} operationName - Apelido da operação, usado no nome do arquivo de log.
 * @param {string} originalFilePath - Caminho original do arquivo extraído.
 * @param {object} fileStats - Metadados do arquivo (criação, modificação).
 */
function logForensicOperation(filePath, hash, user, logDir, operationName, originalFilePath, fileStats) {
  // Cria o nome do arquivo de log com base no apelido da operação
  const logFilePath = path.join(logDir, `${operationName}-forensic-log.txt`);

  // Dados de log incluindo o caminho original e metadados do arquivo
  const logData = `
  === Forensic Log ===
  Operação: ${operationName}
  Data: ${new Date().toISOString()}
  Arquivo Original: ${originalFilePath}
  Arquivo Extraído: ${filePath}
  Hash (SHA-256): ${hash}
  Usuário: ${user}
  Data de Criação do Arquivo: ${new Date(fileStats.birthtime).toISOString()}
  Última Modificação do Arquivo: ${new Date(fileStats.mtime).toISOString()}
  ====================
  `;

  // Cria o diretório de log se não existir
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Escreve ou anexa os detalhes forenses no arquivo de log
  fs.writeFileSync(logFilePath, logData, { flag: 'a' });

  console.log(`Detalhes forenses salvos no log: ${logFilePath}`);
}

module.exports = { logForensicOperation };
