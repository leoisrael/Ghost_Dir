#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const lodash = require('lodash');


const program = new Command();

program
  .name("Ghost_Dir")
  .version('0.0.1')
  .description(chalk.red(`
       @@@@@@@@  @@@  @@@   @@@@@@    @@@@@@   @@@@@@@     @@@@@@@   @@@  @@@@@@@   
      @@@@@@@@@  @@@  @@@  @@@@@@@@  @@@@@@@   @@@@@@@     @@@@@@@@  @@@  @@@@@@@@  
      !@@        @@!  @@@  @@!  @@@  !@@         @@!       @@!  @@@  @@!  @@!  @@@  
      !@!        !@!  @!@  !@!  @!@  !@!         !@!       !@!  @!@  !@!  !@!  @!@  
      !@! @!@!@  @!@!@!@!  @!@  !@!  !!@@!!      @!!       @!@  !@!  !!@  @!@!!@!   
      !!! !!@!!  !!!@!!!!  !@!  !!!   !!@!!!     !!!       !@!  !!!  !!!  !!@!@!    
      :!!   !!:  !!:  !!!  !!:  !!!       !:!    !!:       !!:  !!!  !!:  !!: :!!   
      :!:   !::  :!:  !:!  :!:  !:!      !:!     :!:       :!:  !:!  :!:  :!:  !:!  
       ::: ::::  ::   :::  ::::: ::  :::: ::      ::       :::: ::    ::  ::   :::  
       :: :: :    :   : :   : :  :   :: : :       :        :: :  :   :     :   : :  
                                                                               
       Developed by Israel_Albuquerque
       GitHub https://github.com/leoisrael

  `));

program
  .command('brute <target> <wordlist>')
  .description('Scan subdirectories on a web page')
  .option('-c, --concurrency <num>', 'Number of parallel requests', 10)
  .option('-t, --timeout <ms>', 'Timeout for each request (in milliseconds)', 5000)
  .action(async (target, wordlist, options) => {
    try {
      const subdirectories = await getSubdirectories(wordlist);
      const results = await scanSubdirectories(target, subdirectories, options);
      printResults(results);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
});


async function getSubdirectories(wordlistPath) {
  try {
    const wordlistContent = await fs.readFile(wordlistPath, 'utf-8');
    return wordlistContent.trim().split('\n');
  } catch (error) {
    console.error(chalk.red(`Erro ao ler o arquivo de wordlist: ${error.message}`));
    process.exit(1);
  }
}

let targetUrlGlobal

async function scanSubdirectories(targetUrl, subdirectories, options) {
  // Arrays para armazenar os subdiretórios válidos, inválidos e falhados
  const validSubdirectories = [];
  const invalidSubdirectories = [];
  const failedSubdirectories = [];

  // Expressão regular para verificar se a URL alvo começa com "http://" ou "https://"
  const urlRegex = /^https?:\/\//;
  if (!urlRegex.test(targetUrl)) {
    targetUrl = `http://${targetUrl}`;
  }

  // Cria uma função de solicitação throttledFetch que limita o número de solicitações por segundo
  const throttledFetch = lodash.throttle(fetch, options.requestsPerSecond * 1000);

  // Cria um array de promessas para solicitar cada subdiretório com a função throttledFetch
  const requests = subdirectories.map(async (subdir) => {
    const url = `${targetUrl}/${subdir}`;
    // Gera um atraso aleatório entre o intervalo de tempo mínimo e máximo para evitar sobrecarregar o site alvo
    const delay = Math.floor(Math.random() * (options.maxDelay - options.minDelay + 1)) + options.minDelay;
    // Aguarda o atraso antes de fazer a solicitação
    await new Promise(resolve => setTimeout(resolve, delay));
    // Faz a solicitação usando a função throttledFetch
    return throttledFetch(url, { timeout: options.timeout })
      .then((response) => {
        if (response.status === 404) {
          invalidSubdirectories.push(url);
        } else {
          validSubdirectories.push(url);
        }
      })
      .catch((error) => {
        failedSubdirectories.push({ url, error: error.message });
      });
  });

  try {
    // Espera que todas as solicitações sejam concluídas
    await Promise.all(requests);
  } catch (error) {
    // Se ocorrer um erro, exibe uma mensagem de erro e sai do processo com um código de saída de 1
    console.error(chalk.red(`Erro na varredura de subdiretórios: ${error.message}`));
    process.exit(1);
  }

  // Se houver subdiretórios com falha, exibe uma mensagem de aviso com as URLs e erros
  if (failedSubdirectories.length > 0) {
    console.warn(chalk.yellow('Algumas solicitações falharam:'));
    failedSubdirectories.forEach(({ url, error }) => {
      console.warn(chalk.red(`==> ${url} (${error})`));
    });
  }

  // Retorna os subdiretórios válidos, inválidos e falhados em um objeto
  return { validSubdirectories, invalidSubdirectories, failedSubdirectories };
}

function printResults({ validSubdirectories, invalidSubdirectories, failedSubdirectories }) {
  console.log(`Starting subdirectory scan on ${targetUrlGlobal} (${validSubdirectories.length + invalidSubdirectories.length} subdirectories found)...`);

  console.log(chalk.green(`Scan completed: ${validSubdirectories.length} subdirectories found.`));

  if (validSubdirectories.length > 0) {
    console.log(chalk.yellow('Valid subdirectories:'));
    validSubdirectories.forEach((url) => console.log(chalk.green(`==> ${url}`)));
  }

  if (invalidSubdirectories.length > 0) {
    console.log(chalk.yellow('Invalid subdirectories(404):'));
    invalidSubdirectories.forEach((url) => console.log(chalk.gray(`==> ${url}`)));
  }

  if (failedSubdirectories.length > 0) {
    console.log(chalk.yellow('Failed subdirectories:'));
    failedSubdirectories.forEach((result) => console.log(chalk.red(`==> ${result.url} (${result.error})`)));
  }
}

program.parse(process.argv);
