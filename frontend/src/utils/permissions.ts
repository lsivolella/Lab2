import type { RentalOrderResponse } from '../types/order';
import type { UserResponse } from '../types/user';

type Agent = NonNullable<UserResponse['agent']>;

/**
 * What an agent may do with an order (the backend enforces the same rules):
 * - evaluate a SUBMITTED order: a bank when it requested credit, otherwise the
 *   company that owns the car;
 * - execute the contract of an APPROVED order: the company that owns the car.
 */
export function agentPermissions(order: RentalOrderResponse, agent: Agent) {
    const ownsCar = agent.type === 'COMPANY' && order.car.owner.id === agent.id;
    const evaluates = order.creditRequested ? agent.type === 'BANK' : ownsCar;

    let waitingFor: string | null = null;

    if (order.status === 'SUBMITTED' && !evaluates) {
        waitingFor = order.creditRequested
            ? 'Aguardando análise de um banco.'
            : 'Aguardando análise da locadora dona do carro.';
    } else if (order.status === 'APPROVED' && !ownsCar) {
        waitingFor = 'Aguardando a locadora executar o contrato.';
    }

    return {
        canEvaluate: order.status === 'SUBMITTED' && evaluates,
        canContract: order.status === 'APPROVED' && ownsCar,
        /** For agents that see the order but cannot act on it now. */
        waitingFor,
    };
}
