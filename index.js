#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');

program
  .version('0.0.1')
  .description('Um aplicativo de terminal simples em NodeJS');

program
  .command('brute <target>')
  .option('<wordlist>')
  .description('diz olá com um nome')
  .action((target, wordlist) => {
    const result = target ? `o ip do seu alvo: ${target}` : 'bad request';
    console.log(chalk.green(
      result
    ));
  });

program.parse(process.argv);
