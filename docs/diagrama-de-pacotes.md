# 📦 Diagrama de Pacotes (Visão Lógica)

Organização lógica do **Rentacar** em pacotes e as dependências entre eles. As setas indicam "depende de" (usa classes de). As dependências foram levantadas dos `import` do código.

## Visão geral

```mermaid
flowchart LR
    subgraph FE["Frontend · React + Vite (SPA)"]
        direction TB
        fe_ui["Apresentação<br/>pages · components"]
        fe_state["Estado e navegação<br/>context · hooks · routes"]
        fe_api["Acesso à API<br/>api"]
        fe_base["Base<br/>types · utils"]
        fe_ui --> fe_state
        fe_ui --> fe_api
        fe_state --> fe_api
        fe_ui --> fe_base
        fe_api --> fe_base
    end

    subgraph BE["Backend · Spring Boot (MVC em camadas)"]
        direction TB
        be_controller["controller"]
        be_service["service"]
        be_repository["repository"]
        be_model["model"]
        be_controller --> be_service
        be_service --> be_repository
        be_repository --> be_model
    end

    subgraph EXT["Serviços externos"]
        db[("Supabase PostgreSQL<br/>schema app")]
        storage[("Supabase Storage<br/>car-images")]
        viacep["ViaCEP"]
    end

    fe_api -- "HTTP/JSON · /api" --> be_controller
    be_repository -- "JDBC / JPA" --> db
    be_service -- REST --> storage
    be_service -- REST --> viacep
```

## Backend (`com.lucas.rentacar`)

```mermaid
flowchart TB
    application["application<br/><i>RentacarApplication</i>"]
    config["config<br/><i>SecurityConfig, CsrfCookieFilter,<br/>AgentSeeder, CarSeeder, StorageProperties</i>"]
    controller["controller<br/><i>Auth, User, Customer, Car,<br/>RentalOrder, Address, ApiExceptionHandler</i>"]
    service["service<br/><i>Customer, User, Car, RentalOrder,<br/>ImageStorage, AddressLookup, AppUserDetails</i>"]
    repository["repository<br/><i>Spring Data JPA</i>"]
    model["model<br/><i>entidades JPA</i>"]
    dto["dto<br/><i>auth · user · customer · car · order · address</i>"]
    enums["enums<br/><i>Role, AgentType, OrderStatus,<br/>OwnershipType, ContractPhase</i>"]

    application -. "component scan" .-> config
    application -. "component scan" .-> controller
    controller --> service
    controller --> dto
    controller --> enums
    service --> repository
    service --> model
    service --> dto
    service --> enums
    service --> config
    config --> service
    config --> repository
    config --> model
    config --> enums
    repository --> model
    repository --> enums
    dto --> model
    dto --> enums
    model --> enums
```

| Pacote        | Camada (MVC)                  | Responsabilidade                                                                                                 |
| ------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `application` | —                             | Classe principal; inicia o Spring e define o pacote base.                                                        |
| `controller`  | **Controller**                | Endpoints REST: recebe e valida os DTOs, chama os services e devolve DTOs. Inclui o tratamento de erros em JSON. |
| `service`     | **Model** (regras de negócio) | Regras do domínio: cadastro, pedidos, avaliação, crédito, contrato, frota; integrações com o Storage e o ViaCEP. |
| `repository`  | **Model** (persistência)      | Interfaces Spring Data JPA e consultas (disponibilidade, filtros).                                               |
| `model`       | **Model** (entidades)         | Entidades JPA mapeadas para as tabelas do schema `app`.                                                          |
| `dto`         | Contrato da API               | Objetos de entrada (com Bean Validation) e de saída; as entidades nunca são expostas.                            |
| `enums`       | Domínio                       | Papéis, tipos de agente, status do pedido, tipo de propriedade e fase do contrato.                               |
| `config`      | Infraestrutura                | Segurança (sessão, CSRF, CORS, permissões por papel), _seeds_ de agentes e carros, propriedades do Storage.      |

> A **View** do MVC é o frontend React, que consome a API em JSON.

## Frontend (`frontend/src`)

```mermaid
flowchart TB
    pages["pages<br/><i>Login, Register, Cars,<br/>Orders, Profile</i>"]
    components["components<br/><i>AppLayout, OrderCard, BookingForm,<br/>CarFormModal, customer/, ui/</i>"]
    routes["routes<br/><i>RequireAuth, PublicOnly</i>"]
    hooks["hooks<br/><i>useAuth</i>"]
    context["context<br/><i>AuthProvider</i>"]
    api["api<br/><i>client, auth, customers, cars,<br/>orders, addresses, messages</i>"]
    types["types<br/><i>espelham os DTOs</i>"]
    utils["utils<br/><i>máscaras, datas, crédito,<br/>permissões</i>"]

    pages --> components
    pages --> api
    pages --> hooks
    pages --> types
    pages --> utils
    components --> api
    components --> hooks
    components --> types
    components --> utils
    routes --> hooks
    hooks --> context
    context --> api
    context --> types
    api --> types
    utils --> types
```

| Pacote              | Responsabilidade                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `pages`             | Uma tela por rota.                                                                          |
| `components`        | Layout, cards, formulários e componentes de interface reutilizáveis (`ui/`).                |
| `routes`            | Proteção das rotas conforme o login.                                                        |
| `context` · `hooks` | Sessão do usuário compartilhada pelo app.                                                   |
| `api`               | Cliente HTTP (sessão e CSRF), chamadas por recurso e tradução das mensagens da API.         |
| `types`             | Tipos TypeScript equivalentes aos DTOs do backend.                                          |
| `utils`             | Máscaras (CPF, CEP), datas e moeda, cálculo de parcelas e regras de permissão na interface. |
