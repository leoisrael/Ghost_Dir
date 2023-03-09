#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const fetch = require('node-fetch');

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
  targetUrlGlobal = targetUrl
  const validSubdirectories = [];
  const invalidSubdirectories = [];
  const failedSubdirectories = [];

  const urlRegex = /^https?:\/\//;
  if (!urlRegex.test(targetUrl)) {
    targetUrl = `http://${targetUrl}`;
  }

  const requests = subdirectories.map((subdir) => {
    const url = `${targetUrl}/${subdir}`;
    return fetch(url, { timeout: options.timeout })
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
    await Promise.all(requests);
  } catch (error) {
    console.error(chalk.red(`Erro na varredura de subdiretórios: ${error.message}`));
    process.exit(1);
  }

  if (failedSubdirectories.length > 0) {
    console.warn(chalk.yellow('Algumas solicitações falharam:'));
    failedSubdirectories.forEach(({ url, error }) => {
      console.warn(chalk.red(`==> ${url} (${error})`));
    });
  }

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
