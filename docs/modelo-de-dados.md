# 🗃 Modelo de Dados

Tabelas do **Rentacar** no PostgreSQL do Supabase, todas no schema **`app`**. São geradas pelo Hibernate a partir das entidades (veja o [diagrama de classes](diagrama-de-classes.md)), com nomes em `snake_case`.

```mermaid
erDiagram
    users {
        bigint id PK
        varchar email UK "até 254"
        varchar password_hash "BCrypt"
        varchar role "CUSTOMER | AGENT"
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at "exclusão lógica"
    }

    customers {
        bigint id PK
        bigint user_id FK, UK
        varchar name "até 150"
        varchar rg "até 20"
        varchar cpf UK "11 dígitos"
        varchar profession "até 100"
        varchar street
        varchar number
        varchar complement "opcional"
        varchar district
        varchar city
        varchar state "UF"
        varchar zip_code "8 dígitos"
    }

    customer_incomes {
        bigint customer_id FK
        varchar employer "até 150"
        numeric amount "12,2"
    }

    agents {
        bigint id PK
        bigint user_id FK, UK
        varchar name "até 150"
        varchar cnpj UK "14 dígitos"
        varchar type "COMPANY | BANK"
    }

    cars {
        bigint id PK
        varchar registration UK "RENAVAM, 11 dígitos"
        integer year
        varchar brand "até 50"
        varchar model "até 50"
        varchar plate UK "ABC1234 ou ABC1D23"
        bigint owner_agent_id FK "locadora"
        numeric daily_rate "10,2"
        varchar image_url "até 500"
        timestamptz deleted_at "exclusão lógica"
    }

    rental_orders {
        bigint id PK
        bigint customer_id FK
        bigint car_id FK
        date start_date "retirada"
        date end_date "devolução"
        numeric daily_rate "10,2"
        numeric total_amount "12,2"
        boolean credit_requested
        varchar status "SUBMITTED | APPROVED | REJECTED | CONTRACTED | CANCELLED"
        varchar agent_opinion "parecer, até 1000"
        bigint evaluated_by_agent_id FK
        timestamptz evaluated_at
        timestamptz created_at
        timestamptz updated_at
    }

    credit_contracts {
        bigint id PK
        bigint order_id FK, UK
        bigint bank_agent_id FK "banco"
        numeric amount "12,2"
        numeric monthly_interest_rate "5,2 (% ao mês)"
        integer installments
        numeric installment_amount "12,2"
        timestamptz created_at
    }

    contracts {
        bigint id PK
        bigint order_id FK, UK
        bigint executed_by_agent_id FK "locadora"
        varchar ownership_type "CUSTOMER | COMPANY | BANK"
        timestamptz signed_at
    }

    users ||--o| customers : "perfil de cliente"
    users ||--o| agents : "perfil de agente"
    customers ||--o{ customer_incomes : "até 3"
    agents ||--o{ cars : "possui (locadora)"
    customers ||--o{ rental_orders : "faz"
    cars ||--o{ rental_orders : "é alugado em"
    agents |o--o{ rental_orders : "avalia"
    rental_orders ||--o| credit_contracts : "financiado por"
    agents ||--o{ credit_contracts : "concede (banco)"
    rental_orders ||--o| contracts : "formalizado por"
    agents ||--o{ contracts : "executa (locadora)"
```

## Tabelas

| Tabela             | Conteúdo                   | Observações                                                                |
| ------------------ | -------------------------- | -------------------------------------------------------------------------- |
| `users`            | Contas de acesso           | `email` único; `role` define o perfil                                      |
| `customers`        | Clientes (pessoa física)   | 1:1 com `users`; endereço embutido nas colunas; `cpf` único                |
| `customer_incomes` | Empregadores e rendimentos | Até 3 por cliente (validado na API)                                        |
| `agents`           | Locadoras e bancos         | 1:1 com `users`; `cnpj` único                                              |
| `cars`             | Frota                      | `plate` e `registration` únicos; `owner_agent_id` aponta para uma locadora |
| `rental_orders`    | Pedidos de aluguel         | Diária copiada do carro; `status` gravado; a fase do contrato é calculada  |
| `credit_contracts` | Contratos de crédito       | 1:1 com o pedido; criado quando um banco aprova um pedido com crédito      |
| `contracts`        | Contratos de aluguel       | 1:1 com o pedido; criado quando a locadora executa o contrato              |

## Regras garantidas no banco e na API

- **Unicidade:** e-mail, CPF, CNPJ, placa e RENAVAM; um perfil por usuário; um contrato de crédito e um contrato por pedido.
- **Exclusão lógica:** `users.deleted_at` e `cars.deleted_at`; as linhas não são apagadas, para preservar o histórico de pedidos.
- **Na API (services):** máximo de 3 rendimentos, datas sobrepostas para o mesmo carro, transições de status e quem pode executar cada ação.

## Armazenamento de arquivos

As fotos enviadas pelas locadoras ficam no **Supabase Storage**, no bucket público `car-images` (`cars/{id do carro}/{uuid}.{extensão}`). A coluna `cars.image_url` guarda a URL pública. As fotos da frota inicial ficam em `frontend/public/cars` e são referenciadas por caminho (`/cars/fiat-argo.webp`).
