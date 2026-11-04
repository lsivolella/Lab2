# 📖 Histórias de Usuário

Histórias do **Rentacar — Sistema de Aluguel de Carros**, no formato _"Como [papel], quero [ação], para [benefício]"_, com critérios de aceitação. Os papéis são:

- **Visitante:** pessoa ainda sem login;
- **Cliente:** pessoa física cadastrada;
- **Locadora:** agente do tipo empresa, dona de uma frota;
- **Banco:** agente do tipo banco, que concede crédito;
- **Agente:** locadora ou banco.

| ID                                            | Papel            | História                                       | Prioridade |
| --------------------------------------------- | ---------------- | ---------------------------------------------- | ---------- |
| [US01](#us01--cadastrar-se-como-cliente)      | Visitante        | Cadastrar-se como cliente                      | Alta       |
| [US02](#us02--entrar-e-sair-do-sistema)       | Usuário          | Entrar e sair do sistema                       | Alta       |
| [US03](#us03--consultar-e-editar-o-perfil)    | Cliente          | Consultar e editar o perfil                    | Alta       |
| [US04](#us04--excluir-a-conta)                | Cliente          | Excluir a conta                                | Média      |
| [US05](#us05--trocar-a-senha)                 | Usuário          | Trocar a senha                                 | Média      |
| [US06](#us06--consultar-o-catálogo-de-carros) | Cliente          | Consultar o catálogo de carros                 | Alta       |
| [US07](#us07--fazer-um-pedido-de-aluguel)     | Cliente          | Fazer um pedido de aluguel                     | Alta       |
| [US08](#us08--consultar-meus-pedidos)         | Cliente          | Consultar meus pedidos e o status              | Alta       |
| [US09](#us09--modificar-um-pedido)            | Cliente / Agente | Modificar um pedido                            | Alta       |
| [US10](#us10--cancelar-um-pedido)             | Cliente          | Cancelar um pedido                             | Alta       |
| [US11](#us11--avaliar-um-pedido)              | Agente           | Avaliar um pedido (parecer financeiro)         | Alta       |
| [US12](#us12--conceder-crédito)               | Banco            | Conceder crédito a um pedido                   | Média      |
| [US13](#us13--executar-o-contrato)            | Locadora         | Executar o contrato                            | Alta       |
| [US14](#us14--gerenciar-a-frota)              | Locadora         | Gerenciar a frota                              | Alta       |
| [US15](#us15--acompanhar-os-contratos)        | Usuário          | Acompanhar contratos em andamento e encerrados | Baixa      |

---

## US01 — Cadastrar-se como cliente

> **Como** visitante, **quero** me cadastrar informando meus dados pessoais, endereço, profissão e rendimentos, **para** poder fazer pedidos de aluguel.

**Critérios de aceitação**

- O cadastro pede nome, CPF, RG, profissão, endereço (CEP, rua, número, complemento opcional, bairro, cidade e UF), e-mail e senha.
- Posso informar de **0 a 3** entidades empregadoras, cada uma com o rendimento mensal.
- O CPF é validado pelos dígitos verificadores e não pode estar cadastrado; o e-mail também não pode estar em uso.
- Ao digitar um CEP válido, rua, bairro, cidade e UF são preenchidos automaticamente.
- A senha tem entre 8 e 72 caracteres e precisa ser confirmada.
- Erros aparecem em português, junto ao campo correspondente.
- Ao concluir, entro no sistema sem precisar fazer login.

## US02 — Entrar e sair do sistema

> **Como** usuário cadastrado (cliente, locadora ou banco), **quero** entrar com e-mail e senha, **para** usar as funções do meu perfil.

**Critérios de aceitação**

- Sem login, só as telas de entrada e de cadastro estão acessíveis.
- Credenciais erradas mostram "E-mail ou senha incorretos." sem indicar qual dos dois está errado.
- A sessão continua ativa ao recarregar a página.
- Ao sair, a sessão é encerrada e as páginas internas voltam a exigir login.
- Agentes não se cadastram: suas contas são criadas pelo sistema.

## US03 — Consultar e editar o perfil

> **Como** cliente, **quero** consultar e atualizar meus dados, **para** mantê-los corretos para a análise dos pedidos.

**Critérios de aceitação**

- Vejo todos os dados do cadastro.
- Posso alterar nome, RG, profissão, endereço e rendimentos.
- CPF e e-mail não podem ser alterados.
- As alterações são validadas como no cadastro.

## US04 — Excluir a conta

> **Como** cliente, **quero** excluir minha conta, **para** deixar de usar o sistema.

**Critérios de aceitação**

- A exclusão pede confirmação.
- Depois de excluída, a sessão é encerrada e não consigo mais entrar.
- O histórico de pedidos é preservado (exclusão lógica).

## US05 — Trocar a senha

> **Como** usuário, **quero** trocar minha senha, **para** manter minha conta segura.

**Critérios de aceitação**

- Preciso informar a senha atual.
- A nova senha tem entre 8 e 72 caracteres e precisa ser confirmada.
- Senha atual errada mostra um aviso e nada é alterado.

## US06 — Consultar o catálogo de carros

> **Como** cliente, **quero** ver os carros disponíveis com foto e preço, **para** escolher o que vou alugar.

**Critérios de aceitação**

- Cada carro mostra foto, marca, modelo, ano, placa, locadora e valor da diária.
- Posso buscar por marca ou modelo.
- Carros excluídos não aparecem.

## US07 — Fazer um pedido de aluguel

> **Como** cliente, **quero** pedir o aluguel de um carro para um período, **para** usá-lo nessas datas.

**Critérios de aceitação**

- Informo a data de retirada (hoje ou depois) e a de devolução (depois da retirada).
- Vejo o número de diárias e o total antes de confirmar.
- Posso marcar **"Solicitar crédito bancário"**.
- O pedido é recusado se o carro já tiver outro pedido em andamento com datas sobrepostas.
- O pedido criado fica com o status **Em análise**.

## US08 — Consultar meus pedidos

> **Como** cliente, **quero** consultar meus pedidos e o status de cada um, **para** acompanhar o andamento.

**Critérios de aceitação**

- Vejo apenas os meus pedidos, do mais recente para o mais antigo.
- Cada pedido mostra carro, datas, diárias, total e status.
- Quando existirem, vejo o parecer do agente, o contrato de crédito (parcelas, juros, banco) e o contrato.
- Posso filtrar por status.

## US09 — Modificar um pedido

> **Como** cliente, **quero** alterar as datas de um pedido, **para** ajustar o aluguel antes da análise. **Como** agente responsável pela análise, **quero** alterar as datas de um pedido, **para** ajustá-lo antes de dar o parecer.

**Critérios de aceitação**

- Só pedidos **Em análise** podem ser alterados.
- O total é recalculado e a disponibilidade do carro é verificada de novo.
- O cliente também pode marcar ou desmarcar o pedido de crédito; o agente não.
- Só o agente que avalia o pedido pode alterá-lo (ver US11).

## US10 — Cancelar um pedido

> **Como** cliente, **quero** cancelar um pedido, **para** desistir do aluguel.

**Critérios de aceitação**

- Só pedidos **Em análise** podem ser cancelados.
- O cancelamento pede confirmação.
- O pedido passa a **Cancelado** e as datas do carro ficam livres.

## US11 — Avaliar um pedido

> **Como** agente, **quero** registrar o parecer financeiro de um pedido, **para** aprová-lo para contrato ou recusá-lo.

**Critérios de aceitação**

- Pedidos **sem crédito** são avaliados pela **locadora dona do carro**; pedidos **com crédito**, por um **banco**.
- Escolho aprovar ou recusar e escrevo o parecer (obrigatório).
- O pedido passa a **Aprovado** ou **Recusado**, com o parecer, o agente e a data da avaliação.
- Agentes que não podem avaliar o pedido veem o motivo (por exemplo, "Aguardando análise de um banco.").

## US12 — Conceder crédito

> **Como** banco, **quero** definir as condições do crédito ao aprovar um pedido, **para** financiar o aluguel do cliente.

**Critérios de aceitação**

- Ao aprovar um pedido com crédito, informo os juros ao mês (0% a 20%) e o número de parcelas (1 a 60).
- Vejo a parcela estimada antes de confirmar.
- O sistema gera o **contrato de crédito** com o valor financiado (total do pedido) e a parcela fixa (Tabela Price).

## US13 — Executar o contrato

> **Como** locadora, **quero** executar o contrato de um pedido aprovado, **para** formalizar o aluguel.

**Critérios de aceitação**

- Só a **locadora dona do carro** executa o contrato, e só de pedidos **Aprovados**.
- Escolho em nome de quem o carro fica registrado durante o contrato: locadora, cliente ou banco credor.
- A opção **banco** só existe quando há contrato de crédito.
- O pedido passa a **Contratado**.

## US14 — Gerenciar a frota

> **Como** locadora, **quero** cadastrar, editar e excluir os meus carros, **para** manter o catálogo atualizado.

**Critérios de aceitação**

- Vejo apenas os carros da minha frota.
- O cadastro pede matrícula (RENAVAM), ano, marca, modelo, placa, valor da diária e **foto** (obrigatória).
- A foto deve ser JPEG, PNG ou WebP de até 2 MB.
- Placa e RENAVAM não podem se repetir.
- Na edição, posso trocar a foto.
- Carros com aluguel ainda não terminado não podem ser excluídos.

## US15 — Acompanhar os contratos

> **Como** usuário, **quero** saber se um contrato está em andamento ou encerrado, **para** acompanhar os aluguéis ao longo do tempo.

**Critérios de aceitação**

- Um pedido contratado aparece como **Contratado** antes da retirada, **Em andamento** entre a retirada e a devolução e **Encerrado** a partir da devolução.
- Posso filtrar os pedidos por essas situações.
