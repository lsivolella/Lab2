# 🧩 Diagrama de Classes

Modelo de domínio do **Rentacar** (pacote `com.lucas.rentacar.model` e enums de `com.lucas.rentacar.enums`). As classes são entidades JPA; `Address` e `EmploymentIncome` são objetos embutidos (`@Embeddable`), sem identidade própria.

```mermaid
classDiagram
    direction LR

    class User {
        -Long id
        -String email
        -String passwordHash
        -Role role
        -Instant createdAt
        -Instant updatedAt
        -Instant deletedAt
    }

    class Customer {
        -Long id
        -String name
        -String rg
        -String cpf
        -String profession
        +int MAX_INCOMES = 3
    }

    class Address {
        <<embeddable>>
        -String street
        -String number
        -String complement
        -String district
        -String city
        -String state
        -String zipCode
    }

    class EmploymentIncome {
        <<embeddable>>
        -String employer
        -BigDecimal amount
    }

    class Agent {
        -Long id
        -String name
        -String cnpj
        -AgentType type
    }

    class Car {
        -Long id
        -String registration
        -Integer year
        -String brand
        -String model
        -String plate
        -BigDecimal dailyRate
        -String imageUrl
        -Instant deletedAt
    }

    class RentalOrder {
        -Long id
        -LocalDate startDate
        -LocalDate endDate
        -BigDecimal dailyRate
        -BigDecimal totalAmount
        -boolean creditRequested
        -OrderStatus status
        -String agentOpinion
        -Instant evaluatedAt
        -Instant createdAt
        -Instant updatedAt
    }

    class CreditContract {
        -Long id
        -BigDecimal amount
        -BigDecimal monthlyInterestRate
        -Integer installments
        -BigDecimal installmentAmount
        -Instant createdAt
    }

    class Contract {
        -Long id
        -OwnershipType ownershipType
        -Instant signedAt
    }

    class Role {
        <<enumeration>>
        CUSTOMER
        AGENT
    }

    class AgentType {
        <<enumeration>>
        COMPANY
        BANK
    }

    class OrderStatus {
        <<enumeration>>
        SUBMITTED
        APPROVED
        REJECTED
        CONTRACTED
        CANCELLED
    }

    class OwnershipType {
        <<enumeration>>
        CUSTOMER
        COMPANY
        BANK
    }

    class ContractPhase {
        <<enumeration>>
        UPCOMING
        IN_PROGRESS
        FINISHED
        +of(startDate, endDate, today)$ ContractPhase
    }

    Customer "0..1" --> "1" User : conta
    Agent "0..1" --> "1" User : conta
    Customer "1" *-- "1" Address : endereço
    Customer "1" *-- "0..3" EmploymentIncome : rendimentos

    Car "*" --> "1" Agent : owner (locadora)
    RentalOrder "*" --> "1" Customer : cliente
    RentalOrder "*" --> "1" Car : carro
    RentalOrder "*" --> "0..1" Agent : evaluatedBy

    CreditContract "0..1" --> "1" RentalOrder : pedido
    CreditContract "*" --> "1" Agent : bank (banco)
    Contract "0..1" --> "1" RentalOrder : pedido
    Contract "*" --> "1" Agent : executedBy (locadora)

    User ..> Role
    Agent ..> AgentType
    RentalOrder ..> OrderStatus
    RentalOrder ..> ContractPhase : calculada
    Contract ..> OwnershipType
```

## Classes

| Classe             | Responsabilidade                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `User`             | Conta de acesso: e-mail, senha (hash BCrypt) e papel. A exclusão é lógica (`deletedAt`).                                  |
| `Customer`         | Dados do cliente pedidos no enunciado: nome, RG, CPF, profissão, endereço e até 3 empregadores com os rendimentos.        |
| `Address`          | Endereço do cliente, gravado nas colunas da própria tabela `customers`.                                                   |
| `EmploymentIncome` | Entidade empregadora e rendimento mensal; gravado na tabela `customer_incomes`.                                           |
| `Agent`            | Locadora (`COMPANY`) ou banco (`BANK`), com um login por organização.                                                     |
| `Car`              | Automóvel com matrícula (RENAVAM), ano, marca, modelo, placa, diária, foto e a locadora dona.                             |
| `RentalOrder`      | Pedido de aluguel: período, valores (diária copiada no momento do pedido), status, pedido de crédito e parecer do agente. |
| `CreditContract`   | Crédito concedido por um banco para pagar o aluguel: valor, juros ao mês, parcelas e valor da parcela (Tabela Price).     |
| `Contract`         | Contrato executado pela locadora, com o tipo de propriedade do carro durante o aluguel.                                   |
| `ContractPhase`    | Fase de um pedido contratado, calculada pelas datas (não é gravada).                                                      |

## Regras representadas

- Um `User` tem **um** perfil: `Customer` (papel `CUSTOMER`) **ou** `Agent` (papel `AGENT`).
- Um cliente tem **no máximo 3** rendimentos.
- `Car.owner` é sempre uma locadora; `CreditContract.bank` é sempre um banco; `Contract.executedBy` é a locadora dona do carro.
- Um pedido tem **no máximo um** contrato de crédito (só se `creditRequested` e aprovado por um banco) e **no máximo um** contrato.
- `OwnershipType.BANK` só é aceito quando o pedido tem contrato de crédito.
- O ciclo de vida de `OrderStatus` está no [README](../README.md#-regras-de-negócio-e-decisões-de-projeto).
