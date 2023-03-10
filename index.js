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
  // Arrays para armazenar os subdiret??rios v??lidos, inv??lidos e falhados
  const validSubdirectories = [];
  const invalidSubdirectories = [];
  const failedSubdirectories = [];

  // Express??o regular para verificar se a URL alvo come??a com "http://" ou "https://"
  const urlRegex = /^https?:\/\//;
  if (!urlRegex.test(targetUrl)) {
    targetUrl = `http://${targetUrl}`;
  }

  // Cria uma fun????o de solicita????o throttledFetch que limita o n??mero de solicita????es por segundo
  const throttledFetch = lodash.throttle(fetch, options.requestsPerSecond * 1000);

  // Cria um array de promessas para solicitar cada subdiret??rio com a fun????o throttledFetch
  const requests = subdirectories.map(async (subdir) => {
    const url = `${targetUrl}/${subdir}`;
    // Gera um atraso aleat??rio entre o intervalo de tempo m??nimo e m??ximo para evitar sobrecarregar o site alvo
    const delay = Math.floor(Math.random() * (options.maxDelay - options.minDelay + 1)) + options.minDelay;
    // Aguarda o atraso antes de fazer a solicita????o
    await new Promise(resolve => setTimeout(resolve, delay));
    // Faz a solicita????o usando a fun????o throttledFetch
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
    // Espera que todas as solicita????es sejam conclu??das
    await Promise.all(requests);
  } catch (error) {
    // Se ocorrer um erro, exibe uma mensagem de erro e sai do processo com um c??digo de sa??da de 1
    console.error(chalk.red(`Erro na varredura de subdiret??rios: ${error.message}`));
    process.exit(1);
  }

  // Se houver subdiret??rios com falha, exibe uma mensagem de aviso com as URLs e erros
  if (failedSubdirectories.length > 0) {
    console.warn(chalk.yellow('Algumas solicita????es falharam:'));
    failedSubdirectories.forEach(({ url, error }) => {
      console.warn(chalk.red(`==> ${url} (${error})`));
    });
  }

  // Retorna os subdiret??rios v??lidos, inv??lidos e falhados em um objeto
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
