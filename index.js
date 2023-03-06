#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { exec } = require('child_process');

program
  .version('0.0.1')
  .description('Um aplicativo de terminal simples em NodeJS');

program
  .command('brute <target>')
  .option('<wordlist>')
  .description('diz olá com um nome')
  .action((target) => {
    const result = target ? `o ip do seu alvo: ${target}` : 'bad request';
    console.log(chalk.green(
      result
    ));
  });

program
  .command('ping <endereco>')
  .description('executa o comando de ping para verificar a conectividade com um endereço')
  .option('-c, --count <n>', 'número de pacotes de ping a enviar (padrão: 4)', '4')
  .action((endereco, opcoes) => {
    // Executa o comando de ping com o número de pacotes especificado
    exec(`ping -c ${opcoes.count} ${endereco}`, (erro, stdout, stderr) => {
      if (erro) {
        throw `Ocorreu um erro ao executar o comando de ping: ${erro}`;
      }

      console.log(stdout);
    });
  });

program.parse(process.argv);
