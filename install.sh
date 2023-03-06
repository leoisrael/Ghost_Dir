#!/bin/bash

# Instalação do Node.js
# curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
# sudo apt-get install -y nodejs

# Cria o link simbólico para o executável do GhostDir
sudo ln -sf "$(pwd)/ghost_dir" /usr/local/bin/ghostdir

# Informa ao usuário que a instalação foi concluída com sucesso
echo "A instalação do GhostDir foi concluída com sucesso!"
