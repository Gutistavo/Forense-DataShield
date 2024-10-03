const { ipcRenderer } = require('electron');
const { shell } = require('electron');
const { extractFile } = require('./extract');
const { generateFileHash } = require('./hash');
const { logForensicOperation } = require('./logger');
const path = require('path');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', async () => {
  const selectFolderButton = document.getElementById('selectFolderButton');
  const folderPathDisplay = document.getElementById('folderPathDisplay');
  const startButton = document.getElementById('startButton');
  const progressBar = document.getElementById('progressBar');
  const resultDiv = document.getElementById('result');
  const finalMessage = document.getElementById('finalMessage');
  const openExtractionDirButton = document.getElementById('openExtractionDir');
  const openLogDirButton = document.getElementById('openLogDir');
  const newOperationButton = document.getElementById('newOperationButton'); // Botão de Nova Operação
  let folderPath = '';
  let extractionDir = '';
  let logDir = '';
  let exeDir = await ipcRenderer.invoke('getAppPath');  // Obtém o caminho da pasta do executável

  // Função de seleção de diretório
  const selectFolder = async () => {
    const { filePaths } = await ipcRenderer.invoke('dialog:openDirectory');
    if (filePaths && filePaths.length > 0) {
      folderPath = filePaths[0];  // Guarda o caminho do diretório
      folderPathDisplay.textContent = `Diretório selecionado: ${folderPath}`;
    }
  };

  /**
   * Função recursiva para navegar em diretórios e processar arquivos.
   * @param {string} dir - Diretório atual.
   * @param {string} extractionDir - Diretório de extração.
   * @param {string} logDir - Diretório de logs.
   * @param {string} user - Nome do usuário.
   * @param {string} operationName - Nome da operação.
   * @param {number} totalFiles - Número total de arquivos para progresso.
   * @param {object} progressData - Objeto para acompanhar o progresso.
   */
  async function processDirectoryRecursively(dir, extractionDir, logDir, user, operationName, totalFiles, progressData) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);

      if (fs.statSync(itemPath).isDirectory()) {
        // Se for um diretório, navegue recursivamente
        await processDirectoryRecursively(itemPath, extractionDir, logDir, user, operationName, totalFiles, progressData);
      } else {
        // Se for um arquivo, processe-o
        try {
          const relativePath = path.relative(folderPath, itemPath);
          const destinationDir = path.join(extractionDir, path.dirname(relativePath));

          const extractedFilePath = extractFile(itemPath, destinationDir);
          const fileHash = await generateFileHash(extractedFilePath);
          const fileStats = fs.statSync(itemPath);

          logForensicOperation(extractedFilePath, fileHash, user, logDir, operationName, itemPath, fileStats);

          // Atualiza o progresso
          progressData.processedFiles++;
          const progressPercentage = (progressData.processedFiles / totalFiles) * 100;
          progressBar.style.width = `${progressPercentage}%`;
        } catch (err) {
          console.error('Erro ao processar o arquivo:', err);
          resultDiv.textContent = `Erro ao processar o arquivo: ${item}`;
        }
      }
    }
  }

  // Função para contar total de arquivos
  const countFilesRecursively = (dir) => {
    let count = 0;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        count += countFilesRecursively(itemPath);
      } else {
        count++;
      }
    }
    return count;
  };

  // Função para iniciar extração
  const startExtraction = async () => {
    const userInput = document.getElementById('userInput').value;
    const operationInput = document.getElementById('operationInput').value;

    if (!folderPath || !userInput || !operationInput) {
      resultDiv.textContent = 'Por favor, preencha todos os campos.';
      return;
    }

    const operationName = operationInput.replace(/[<>:"/\\|?*]/g, '_');  // Sanitizar nome da operação
    extractionDir = path.join(exeDir, 'extractions', operationName);  // Extrai para o diretório do executável
    logDir = path.join(exeDir, 'logs', operationName);  // Salva logs no diretório do executável

    if (!fs.existsSync(extractionDir)) {
      fs.mkdirSync(extractionDir, { recursive: true });
    }
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const totalFiles = countFilesRecursively(folderPath);
    let progressData = { processedFiles: 0 };

    try {
      await processDirectoryRecursively(folderPath, extractionDir, logDir, userInput, operationName, totalFiles, progressData);
      progressBar.style.width = '100%';  // Certifica que a barra de progresso chega a 100%
      resultDiv.textContent = `Extração completada com sucesso.`;

      // Exibe mensagem final e os botões para abrir pastas
      finalMessage.classList.remove('hidden');

      // Adiciona o event listener para abrir a pasta de extração
      openExtractionDirButton.removeEventListener('click', openExtractionDir); // Remove listener antigo, se houver
      openExtractionDirButton.addEventListener('click', openExtractionDir);

      // Adiciona o event listener para abrir a pasta de logs
      openLogDirButton.removeEventListener('click', openLogDir); // Remove listener antigo, se houver
      openLogDirButton.addEventListener('click', openLogDir);
    } catch (err) {
      console.error('Erro durante a operação:', err);
      resultDiv.textContent = 'Erro durante a operação.';
    }
  };

  // Função para abrir a pasta de extração
  const openExtractionDir = () => {
    shell.openPath(extractionDir);
  };

  // Função para abrir a pasta de logs
  const openLogDir = () => {
    shell.openPath(logDir);
  };

  // Ação para nova operação
  const resetOperation = () => {
    folderPath = '';
    folderPathDisplay.textContent = '';
    document.getElementById('userInput').value = '';
    document.getElementById('operationInput').value = '';
    progressBar.style.width = '0%';
    resultDiv.textContent = '';
    finalMessage.classList.add('hidden');  // Esconde a mensagem final
  };

  // Atribui os event listeners
  selectFolderButton.addEventListener('click', selectFolder);
  startButton.addEventListener('click', startExtraction);
  newOperationButton.addEventListener('click', resetOperation);
});
