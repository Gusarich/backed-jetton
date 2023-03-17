import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type BackedJettonConfig = {};

export function backedJettonConfigToCell(config: BackedJettonConfig): Cell {
    return beginCell().endCell();
}

export class BackedJetton implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new BackedJetton(address);
    }

    static createFromConfig(config: BackedJettonConfig, code: Cell, workchain = 0) {
        const data = backedJettonConfigToCell(config);
        const init = { code, data };
        return new BackedJetton(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
