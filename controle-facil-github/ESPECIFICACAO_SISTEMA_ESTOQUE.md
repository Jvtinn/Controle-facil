# Especificação Técnica e Operacional: Sistema de Controle de Estoque
**Público-alvo:** Comércio local, lojistas seniores e equipe com baixa familiaridade tecnológica.

---

## 1. Protótipo Interativo em Web App (Acesso Imediato)

O protótipo funcional já se encontra desenvolvido e em execução no ambiente:
- **URL de Acesso:** `https://3000-iad18zl3t8m0t9wruvng4-a54666a6.us1.manus.computer`
- **Características de Acessibilidade:**
  - Tipografia de alto contraste com fontes ampliadas (18px a 36px).
  - Botões táteis com área de toque aumentada (mínimo 56px de altura).
  - Cores semânticas intuitivas: **Vermelho (-) para Venda**, **Verde (+) para Entrada**.
  - Alerta Vermelho pulsante automático para **Estoque Crítico** (quando Atual ≤ Mínimo).
  - Alerta Amarelo automático para **Inventário Lento** (quando sem movimentação há 45 a 60+ dias).
  - Sugestões automáticas acionáveis de **Kits de Festa** e **Promoções com Desconto**.
  - **Lista de Compras Automática** com botão de copiar formatado para WhatsApp ou impressão.
  - Persistência contínua via `localStorage` (os dados não se perdem ao recarregar).

---

## 2. Solução Alternativa / Complementar: Google Sheets & AppSheet

Para comércios que preferem operar via **Google Sheets** (planilha) ou transformá-la em aplicativo de celular pelo **AppSheet**, segue a arquitetura completa e pronta para implementação.

### 2.1 Estrutura das Tabelas (Google Planilhas)

#### Tabela 1: `PRODUTOS` (Aba Principal de Cadastro e Status)
| Coluna | Cabeçalho | Tipo | Fórmula / Regra |
| :--- | :--- | :--- | :--- |
| **A** | `ID_PRODUTO` | Texto/ID | Ex: `P001`, `P002` |
| **B** | `NOME_PRODUTO` | Texto | Nome claro do produto |
| **C** | `CATEGORIA` | Texto | Alimentos, Limpeza, Descartáveis |
| **D** | `PRECO_VENDA` | Moeda | R$ 0,00 |
| **E** | `ESTOQUE_ATUAL` | Número | Quantidade física na loja |
| **F** | `ESTOQUE_MINIMO` | Número | Quantidade de segurança |
| **G** | `DATA_ULTIMA_MOVIMENTACAO` | Data | Atualizada automaticamente em cada venda ou entrada |
| **H** | `DIAS_PARADO` | Número | `=SE(G2=""; 0; HOJE() - G2)` |
| **I** | `STATUS_REPOSICAO` | Texto | `=SE(E2<=F2; "🔴 ESTOQUE CRÍTICO"; "🟢 NORMAL")` |
| **J** | `STATUS_GIRO` | Texto | `=SE(H2>=60; "🟡 PARADO (+60 DIAS) - LIQUIDAR!"; SE(H2>=45; "🟡 ATENÇÃO (+45 DIAS) - FAZER PROMOÇÃO"; "🟢 GIRO REGULAR"))` |
| **K** | `SUGESTAO_ACAO` | Texto | `=SE(H2>=60; "Criar Kit com Desconto Máximo / Leve 2 Pague 1"; SE(H2>=45; "Criar Kit de Festa ou Fazer Promoção com Desconto"; "Manter preço regular"))` |
| **L** | `SUGESTAO_COMPRA` | Número | `=SE(E2<=F2; MAX(1; (F2*2) - E2); 0)` |

---

#### Tabela 2: `MOVIMENTACOES` (Aba de Histórico e Auditoria)
| Coluna | Cabeçalho | Tipo | Descrição |
| :--- | :--- | :--- | :--- |
| **A** | `ID_MOV` | ID | Ex: `MOV-1001` |
| **B** | `DATA_HORA` | Data/Hora | `=AGORA()` |
| **C** | `ID_PRODUTO` | Referência | Chave do produto |
| **D** | `TIPO` | Lista | `VENDA` ou `ENTRADA` |
| **E** | `QUANTIDADE` | Número | Quantidade movimentada |
| **F** | `ESTOQUE_ANTERIOR` | Número | Saldo anterior |
| **G** | `NOVO_ESTOQUE` | Número | Saldo atualizado |
| **H** | `RESPONSAVEL` | Texto | Nome do funcionário |

---

#### Tabela 3: `LISTA_COMPRAS_AUTO` (Aba Dinâmica com `FILTER` ou `QUERY`)
Insira na célula `A1` da aba a fórmula:
```excel
=QUERY(PRODUTOS!A:L; "SELECT B, C, E, F, L WHERE E <= F AND E IS NOT NULL ORDER BY L DESC LABEL B 'Produto', C 'Categoria', E 'Estoque Atual', F 'Estoque Mínimo', L 'Comprar (Sugestão)'"; 1)
```

---

### 2.2 Formatação Condicional Visual (Para a Dona da Loja e Funcionários)

No Google Sheets, selecione o intervalo `E2:I100` e adicione as seguintes regras:
1. **Regra Vermelha (Estoque Crítico):**
   - Fórmula personalizada: `=$E2<=$F2`
   - Formatação: Fundo Vermelho Claro (`#FCE8E6`), Texto Vermelho Escuro Negrito (`#C5221F`).
2. **Regra Amarela (Produtos Parados há 45+ dias):**
   - Fórmula personalizada: `=$H2>=45`
   - Formatação: Fundo Amarelo Claro (`#FEF7E0`), Texto Marrom Escuro Negrito (`#7A4B04`).

---

### 2.3 Google Apps Script: Botões de Ação Rápida (+ e -)

Para que qualquer pessoa possa dar baixa na venda ou entrada clicando em botões ilustrados (sem ter que digitar fórmulas), insira este script no menu **Extensões > Apps Script**:

```javascript
/**
 * SISTEMA SIMPLES DE GESTÃO DE ESTOQUE
 * Scripts para botões visuais no Google Sheets
 */

// Registrar Venda (-1) na linha atualmente selecionada pelo cursor
function registrarVenda() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PRODUTOS");
  const cell = sheet.getActiveCell();
  const row = cell.getRow();
  
  // Evita modificar o cabeçalho
  if (row < 2) {
    SpreadsheetApp.getUi().alert("Selecione um produto na lista antes de clicar.");
    return;
  }
  
  const colEstoque = 5; // Coluna E (Estoque Atual)
  const colData = 7;    // Coluna G (Data Última Movimentação)
  const nomeProduto = sheet.getRange(row, 2).getValue();
  const estoqueAtual = sheet.getRange(row, colEstoque).getValue();
  
  if (estoqueAtual <= 0) {
    SpreadsheetApp.getUi().alert("Atenção: O produto '" + nomeProduto + "' já está zerado!");
    return;
  }
  
  // Atualiza estoque e data de hoje
  sheet.getRange(row, colEstoque).setValue(estoqueAtual - 1);
  sheet.getRange(row, colData).setValue(new Date());
  
  SpreadsheetApp.getActiveSpreadsheet().toast("Venda registrada: 1 un de " + nomeProduto, "Sucesso", 3);
}

// Registrar Entrada / Reposição (+1)
function registrarEntrada() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PRODUTOS");
  const cell = sheet.getActiveCell();
  const row = cell.getRow();
  
  if (row < 2) {
    SpreadsheetApp.getUi().alert("Selecione um produto na lista antes de clicar.");
    return;
  }
  
  const colEstoque = 5;
  const colData = 7;
  const nomeProduto = sheet.getRange(row, 2).getValue();
  const estoqueAtual = sheet.getRange(row, colEstoque).getValue();
  
  sheet.getRange(row, colEstoque).setValue(estoqueAtual + 1);
  sheet.getRange(row, colData).setValue(new Date());
  
  SpreadsheetApp.getActiveSpreadsheet().toast("Reposição registrada: +1 un de " + nomeProduto, "Sucesso", 3);
}

// Como vincular aos botões na planilha:
// 1. Vá em Inserir > Desenho.
// 2. Desenhe um retângulo com cantos arredondados, pinte de Vermelho e escreva "VENDI 1 (-)".
// 3. Clique nos 3 pontinhos do desenho e selecione "Atribuir Script". Digite: registrarVenda
// 4. Repita para o botão Verde "CHEGOU +1", atribuindo o script: registrarEntrada
```

---

### 2.4 Configuração no AppSheet (Para Celular e Tablet)

Caso prefira conectar o Google Sheets ao **AppSheet** (gerando um app nativo para Android/iOS sem programação):

1. **Importação:** Vá em [AppSheet.com](https://www.appsheet.com), conecte a conta do Google e escolha a planilha criada acima.
2. **Visualização (UX View):**
   - Crie uma View do tipo **Card** ou **Deck** para a tabela `PRODUTOS`.
   - Configure o tamanho de fonte como **Large** nas opções de tema do app.
3. **Ações Rápidas (Behavior Actions):**
   - **Ação 1: "Vendi 1"**
     - *Do this:* `Data: set the values of some columns in this row`
     - *Set columns:*
       - `ESTOQUE_ATUAL` = `[ESTOQUE_ATUAL] - 1`
       - `DATA_ULTIMA_MOVIMENTACAO` = `TODAY()`
     - *Prominence:* `Display overlay` ou `Display prominently` (com ícone de carrinho ou sinal de menos).
   - **Ação 2: "Chegou +1"**
     - *Do this:* `Data: set the values of some columns in this row`
     - *Set columns:*
       - `ESTOQUE_ATUAL` = `[ESTOQUE_ATUAL] + 1`
       - `DATA_ULTIMA_MOVIMENTACAO` = `TODAY()`
     - *Prominence:* `Display prominently` (com ícone de caminhão ou sinal de mais).
4. **Alerta Visual no AppSheet:**
   - Adicione uma **Format Rule**:
     - *Condition:* `[ESTOQUE_ATUAL] <= [ESTOQUE_MINIMO]`
     - *Format:* Ícone de alerta vermelho gigante (`alert-octagon`), texto em vermelho negrito.
   - Adicione uma segunda **Format Rule**:
     - *Condition:* `(TODAY() - [DATA_ULTIMA_MOVIMENTACAO]) >= 45`
     - *Format:* Cor de destaque amarelo ouro, ícone de relógio/etiqueta.
5. **View Dedicada "Compras Automáticas":**
   - Crie uma Slice chamada `Itens_Para_Comprar` com a fórmula: `[ESTOQUE_ATUAL] <= [ESTOQUE_MINIMO]`.
   - Crie uma aba no menu inferior do AppSheet apontando para essa Slice.
