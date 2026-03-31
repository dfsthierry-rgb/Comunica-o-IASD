# Como Publicar a sua Aplicação

Para gerar a versão final para publicação, siga os passos abaixo:

1. **Gere os arquivos de produção:**
   No terminal, execute o comando:
   ```bash
   npm run build
   ```

2. **Localize a pasta `dist`:**
   Este comando criará uma pasta chamada `dist` na raiz do projeto. Esta pasta contém tudo o que você precisa para hospedar o site (index.html, arquivos JavaScript e CSS).

3. **Hospedagem:**
   Você pode subir o conteúdo da pasta `dist` para qualquer serviço de hospedagem estática, como Firebase Hosting, GitHub Pages, Netlify ou Vercel.

   - **Importante:** Se você estiver hospedando em uma subpasta (por exemplo, `https://seu-dominio.com/projeto/`), a configuração `base: './'` que eu adicionei no `vite.config.ts` garantirá que os caminhos funcionem corretamente.

4. **Teste local da build:**
   Se quiser testar a versão de produção localmente antes de subir, você pode usar o comando:
   ```bash
   npm run preview
   ```

## Solução de problemas (Tela em Branco)

Se ao acessar o site a tela ainda ficar em branco:
- Certifique-se de que você está acessando através de um servidor web (não abra o arquivo `index.html` diretamente no navegador). O comando `npm run dev` já faz isso para você durante o desenvolvimento.
- Verifique o console do navegador (F12) para ver se há erros de rede.
- **Correções Aplicadas:**
    - Adicionamos um sistema que força o tipo de arquivo correto (JavaScript) para evitar o erro de "MIME type".
    - Configuramos caminhos relativos para que o site encontre seus arquivos mesmo em redes com proxy ou subpastas.
    - Implementamos um "Error Boundary". Se ocorrer um erro interno, você verá uma mensagem de erro com um botão para recarregar a página, em vez de uma tela branca.
