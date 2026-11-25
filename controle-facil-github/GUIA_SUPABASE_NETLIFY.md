# Faby Festas: sincronização online e publicação gratuita

## O que foi preparado

O aplicativo continua funcionando localmente quando as variáveis do Supabase ainda não existem. Quando a conexão é configurada, ele passa a oferecer login, criação de conta, perfil de dona ou funcionário, estoque compartilhado, registro de movimentações e atualização em tempo real entre o celular e o computador.

A primeira conta criada para uma loja vira **dona**. Funcionários entram com contas próprias e recebem o papel `employee`. As políticas de segurança do banco impedem que uma pessoa de uma loja leia dados de outra loja.

## 1. Criar o projeto gratuito no Supabase

1. Acesse `https://supabase.com` e crie uma conta.
2. Clique em **New project**.
3. Escolha uma organização, dê um nome como `faby-festas-estoque` e crie uma senha forte para o banco.
4. Escolha uma região próxima do Brasil, se estiver disponível.
5. No painel, abra **Project Settings → API**.
6. Copie o **Project URL** e a chave pública **anon**. Nunca use a chave `service_role` no navegador.

## 2. Criar as tabelas e permissões

1. No Supabase, abra **SQL Editor → New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto.
3. Copie o conteúdo inteiro, cole no SQL Editor e clique em **Run**.
4. Abra **Table Editor** e confirme as tabelas `profiles`, `stores`, `store_memberships`, `products` e `stock_movements`.
5. Em **Database → Replication**, confirme que `products` e `stock_movements` estão habilitadas para realtime.

O arquivo cria RLS (Row Level Security). Não remova essas políticas: elas são o que separa os dados da Faby Festas dos dados de outros usuários.

## 3. Configurar o desenvolvimento local

Crie um arquivo `.env.local` na raiz do projeto, sem publicá-lo no Git:

```text
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Depois execute:

```bash
pnpm install
pnpm check
pnpm dev
```

Abra o endereço local, clique em **Modo local / Entrar online**, crie a conta da dona e teste o lançamento de uma venda em duas abas do navegador. Com a mesma conta, o estoque deverá ser compartilhado.

## 4. Publicar gratuitamente no Netlify

### Opção recomendada: GitHub + Netlify

1. Crie um repositório privado no GitHub.
2. Envie o conteúdo deste projeto para o repositório, sem incluir `.env.local`.
3. Entre em `https://app.netlify.com` e clique em **Add new site → Import an existing project**.
4. Escolha GitHub e selecione o repositório.
5. O arquivo `netlify.toml` já define:
   - Build command: `pnpm build`
   - Publish directory: `dist/public`
   - Node: `22`
6. Antes de publicar, abra **Site configuration → Environment variables** e adicione:
   - `VITE_SUPABASE_URL`: o Project URL do Supabase.
   - `VITE_SUPABASE_ANON_KEY`: a chave pública anon do Supabase.
7. Clique em **Deploy site**.
8. Em **Domain management**, personalize o subdomínio gratuito do Netlify ou conecte um domínio próprio.
9. No Supabase, abra **Authentication → URL Configuration** e coloque o endereço final do Netlify em **Site URL**. Adicione também o mesmo endereço em **Redirect URLs**.

Cada novo push no GitHub fará um novo deploy automaticamente.

### Opção sem GitHub

No computador, execute `pnpm build`, abra o Netlify e use **Add new site → Deploy manually**. Arraste a pasta `dist/public`. Para o login online funcionar, ainda será necessário cadastrar as duas variáveis do Supabase no painel do site e publicar novamente após cada mudança.

## 5. Criar os acessos

1. Abra o endereço publicado.
2. Clique em **Entrar online → Criar conta**.
3. Crie primeiro a conta da dona da loja.
4. Confirme o e-mail caso a confirmação esteja ativada no Supabase.
5. A primeira conta vinculada à loja recebe o papel `owner`.
6. Para funcionários, crie contas adicionais e inclua seus `user_id` na tabela `store_memberships` com `role = 'employee'`.

Exemplo para adicionar um funcionário já cadastrado:

```sql
insert into public.store_memberships (user_id, store_id, role)
values ('UUID_DO_USUARIO', 'UUID_DA_LOJA', 'employee');
```

O funcionário deverá sair e entrar novamente para atualizar o perfil.

## Permissões previstas

| Ação | Dona | Funcionário |
|---|---:|---:|
| Ver estoque e alertas | Sim | Sim |
| Registrar venda e entrada | Sim | Sim |
| Ver histórico e relatórios | Sim | Sim |
| Cadastrar/editar produto | Sim | Sim |
| Excluir produto | Sim | Não |
| Editar despesas | Sim | Não |
| Gerenciar usuários | Sim | Não |

## Como acompanhar de casa

Depois que o Netlify e o Supabase estiverem configurados, você e sua tia devem acessar o mesmo endereço publicado e entrar em contas da mesma loja. Uma venda registrada no celular é gravada no Supabase; o computador recebe a alteração pelo canal realtime, sem backup manual.

O aplicativo ainda mantém cache local para funcionar quando a internet cair. A sincronização online depende de conexão com a internet. A base de dados fica no Supabase, não no Manus.

## Diagnóstico rápido

- **Aparece “Modo local”**: as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não foram configuradas no Netlify ou o site não foi redeployado depois delas.
- **Cadastro criado, mas sem loja**: execute novamente o `supabase/schema.sql` e confira as políticas de insert de `store_memberships`.
- **Sem atualização em tempo real**: confirme a publicação de `products` e `stock_movements` em Database → Replication.
- **Login retorna para endereço errado**: confira Site URL e Redirect URLs em Authentication → URL Configuration.
- **Não use service_role no Netlify**: somente a chave anon deve ficar disponível ao navegador.

## Limite importante

A sincronização de fornecedores e despesas extras ainda pode continuar local até receber as tabelas correspondentes. Produtos e movimentações — o núcleo para acompanhar vendas e estoque — já estão preparados para sincronização. Para operação financeira completa, crie tabelas equivalentes para fornecedores e despesas e replique as mesmas políticas RLS antes de usá-las como fonte oficial.
