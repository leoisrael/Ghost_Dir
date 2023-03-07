#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { exec } = require('child_process');
const fs = require('fs');
const fetch = require('node-fetch');

program
  .version('0.0.1')
  .description('Um aplicativo de terminal simples em NodeJS');

program
  .command('brute <target> <wordlist>')
  .description('diz olá com um nome')
  .action(async (target, wordlist) => {
    let result = await bruteForce(target, wordlist);
    console.log(chalk.green(result));
  });

program.parse(process.argv);

//funcoes

async function bruteForce(target, wordlist) {
  console.log(target);
  console.log(wordlist);
  const subdiretorios = fs.readFileSync(wordlist, 'utf-8').split('\n');
  const diretoriosExistentes = [];

  for (const subdir of subdiretorios) {
    try {
      const response = await fetch(`${target}/${subdir}`);
      if (response.status === 200) {
        diretoriosExistentes.push(subdir);
      }
    } catch (error) {
      // trata erro
    }
  }

  return diretoriosExistentes.join('\n');
}
