const { generateFileHash } = require('./hash');
const { logForensicOperation } = require('./logger');
const { extractFile } = require('./extract');  // Função de extração de arquivo
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Função para sanitizar o apelido, removendo caracteres inválidos para criação de pastas
function sanitizeOperationName(operationName) {
  return operationName.replace(/[<>:"/\\|?*]/g, '_'); // Substitui caracteres inválidos por '_'
}

const argv = yargs(hideBin(process.argv)).argv;

// Parâmetros: diretório de extração, usuário e apelido da operação
const directoryPath = argv.dir;
const user = argv.user || 'Desconhecido';
const operationName = argv.operation ? sanitizeOperationName(argv.operation) : 'operacao_sem_nome';

if (!directoryPath) {
  console.error('Por favor, forneça o caminho de um diretório com a opção --dir.');
  process.exit(1);
}

// Diretório da operação (usando o apelido)
const extractionDir = path.join(__dirname, '../extractions', operationName);
const logDir = path.join(__dirname, '../logs', operationName);

// Cria os diretórios de extração e logs, se não existirem
if (!fs.existsSync(extractionDir)) {
  fs.mkdirSync(extractionDir, { recursive: true });
}

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Função recursiva para navegar em diretórios e processar arquivos.
 * @param {string} dir - Diretório atual.
 */
async function processDirectoryRecursively(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);

    if (fs.statSync(itemPath).isDirectory()) {
      // Se for um diretório, navegue recursivamente
      await processDirectoryRecursively(itemPath);
    } else {
      // Se for um arquivo, processe-o
      try {
        // Calcula o caminho relativo para manter a estrutura de pastas no destino
        const relativePath = path.relative(directoryPath, itemPath);
        const destinationDir = path.join(extractionDir, path.dirname(relativePath)); // Ajusta para criar subpastas

        // Extrai o arquivo para o diretório correto mantendo a estrutura
        const extractedFilePath = extractFile(itemPath, destinationDir);

        // Geração do hash
        const fileHash = await generateFileHash(extractedFilePath);

        // Metadados do arquivo original
        const fileStats = fs.statSync(itemPath);

        // Log da operação forense no diretório da operação
        logForensicOperation(extractedFilePath, fileHash, user, logDir, operationName, itemPath, fileStats);

        console.log(`Arquivo ${item} processado com sucesso.`);
      } catch (err) {
        console.error(`Erro ao processar o arquivo ${item}:`, err);
      }
    }
  }
}

(async () => {
  try {
    // Verifica se o diretório existe
    if (!fs.existsSync(directoryPath)) {
      console.error(`O diretório ${directoryPath} não foi encontrado.`);
      return;
    }

    // Inicia a navegação recursiva pelos diretórios e subdiretórios
    await processDirectoryRecursively(directoryPath);

    console.log(`Operação '${operationName}' completada com sucesso para todos os arquivos.`);
  } catch (err) {
    console.error('Erro durante a operação:', err);
  }
})();
