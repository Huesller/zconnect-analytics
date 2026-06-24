# Login do Z Connect Analytics

## Objetivo

Proteger o dashboard Analytics com usuário e senha simples.

Não existe cadastro público online.

O acesso é configurado somente por quem administra o projeto.

---

## Variáveis necessárias

No ambiente local ou na Vercel, configure:

```txt
VITE_ANALYTICS_LOGIN_USER
VITE_ANALYTICS_LOGIN_PASSWORD
```

Exemplo:

```txt
VITE_ANALYTICS_LOGIN_USER=huesller
VITE_ANALYTICS_LOGIN_PASSWORD=uma-senha-forte-aqui
```

---

## Como configurar localmente

Na raiz do projeto Analytics, crie ou edite o arquivo:

```txt
.env
```

Adicione:

```txt
VITE_ANALYTICS_API_URL=https://script.google.com/macros/s/SEU_SCRIPT/exec
VITE_ANALYTICS_LOGIN_USER=huesller
VITE_ANALYTICS_LOGIN_PASSWORD=sua-senha-aqui
```

Depois rode:

```bash
npm install
npm run dev
```

Abra o dashboard e teste o login.

---

## Como configurar na Vercel

Entre no projeto do Analytics na Vercel.

Caminho atual da interface:

```txt
Project
↓
Settings
↓
Environments
↓
Production
↓
Environment Variables
```

Adicione:

```txt
Key: VITE_ANALYTICS_LOGIN_USER
Value: huesller
```

Adicione também:

```txt
Key: VITE_ANALYTICS_LOGIN_PASSWORD
Value: sua-senha-forte
```

Salve.

Depois faça novo deploy.

---

## Como subir online

Depois de configurar as variáveis na Vercel:

```bash
npm run build
git add .
git commit -m "Adiciona login no analytics"
git push origin main
```

A Vercel deve publicar automaticamente.

---

## Como alterar usuário ou senha

Altere os valores na Vercel em Environment Variables e faça um novo redeploy.

Não precisa alterar código.

---

## Observação de segurança

Este login é uma barreira simples para impedir acesso público casual ao painel.

Como o projeto é frontend Vite, variáveis `VITE_` são embutidas no navegador. Para segurança corporativa avançada no futuro, usar proteção server-side, Vercel Authentication, middleware, Auth0 ou Supabase Auth.
