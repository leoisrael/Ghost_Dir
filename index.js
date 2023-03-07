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

//functions

const urlRegex = /^https?:\/\//;

async function bruteForce(target, wordlist) {
  if (!urlRegex.test(target)) {
    target = `http://${target}`;
  }
  console.log(target);
  console.log(wordlist);
  
  if (!fs.existsSync(wordlist)) {
    throw new Error(`O arquivo ${wordlist} não existe.`);
  }
  
  const subdiretorios = fs.readFileSync(wordlist, 'utf-8').split('\n')
    .filter(subdir => subdir.trim() !== '');
  
  const diretoriosExistentes = [];

  for (let i = 0; i < subdiretorios.length; i++) {
    const subdir = subdiretorios[i];
    if (!/^[a-zA-Z0-9_-]+$/.test(subdir)) {
      console.error(`O subdiretório ${subdir} contém caracteres inválidos.`);
      continue;
    }
    try {
      const response = await fetch(`${target}/${subdir}`, { timeout: 5000 });
      if (response.status === 200) {
        diretoriosExistentes.push(subdir);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Erro ao fazer solicitação para ${target}/${subdir}: ${error.message}`);
    }
  }

  return diretoriosExistentes.join('\n');
}

