#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { exec } = require('child_process');
const fs = require('fs');
const fetch = require('node-fetch');

program
  .version('0.0.1')
  .description(chalk.green(`Um aplicativo de terminal simples em NodeJS`));

program
  .command('brute <target> <wordlist>')
  .description('diz olá com um nome')
  .action(async (target, wordlist) => {
    await bruteForce(target, wordlist);
  });

program.parse(process.argv);

//functions

async function bruteForce(target, wordlist) {
  let urlRegex = /^https?:\/\//;

  if (!urlRegex.test(target)) {
    target = `http://${target}`;
  }

  if (!fs.existsSync(wordlist)) {
    throw new Error(`O arquivo ${wordlist} não existe.`);
  }

  const subdiretorios = fs.readFileSync(wordlist, 'utf-8').split('\n')
    .filter(subdir => subdir.trim() !== '');


  const numSubdirectories = subdiretorios.length;
  console.log(`There will be ${numSubdirectories} subdirectories tested.`);
  for (let i = 0; i < subdiretorios.length; i++) {
    const subdir = subdiretorios[i];
    try {
      const response = await fetch(`${target}/${subdir}`, { timeout: 5000 });
      if (response.status !== 404) {
        console.log(chalk.green(`===> ${subdir}`))
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Erro ao fazer solicitação para ${target}/${subdir}: ${error.message}`);
    }
  }
}

