import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    TupleBuilder,
} from 'ton-core';

export type BackedJettonConfig = {
    admin: Address;
    content: Cell;
    walletCode: Cell;
    beginPrice: bigint;
};

export function backedJettonConfigToCell(config: BackedJettonConfig): Cell {
    return beginCell()
        .storeCoins(0)
        .storeAddress(config.admin)
        .storeRef(config.content)
        .storeRef(config.walletCode)
        .storeUint(config.beginPrice, 64)
        .endCell();
}

export class BackedJetton implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

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

    async sendPurchase(provider: ContractProvider, via: Sender, value: bigint, minTokens: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x3828dc96, 32).storeUint(12345, 64).storeCoins(minTokens).endCell(),
        });
    }

    async getWalletAddressOf(provider: ContractProvider, address: Address) {
        return (
            await provider.get('get_wallet_address', [
                { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
            ])
        ).stack.readAddress();
    }

    async getTokensForToncoins(provider: ContractProvider, coins: bigint) {
        return (await provider.get('get_tokens_for_toncoins', [{ type: 'int', value: coins }])).stack.readBigNumber();
    }

    async getToncoinsForTokens(provider: ContractProvider, tokens: bigint) {
        return (await provider.get('get_toncoins_for_tokens', [{ type: 'int', value: tokens }])).stack.readBigNumber();
    }
}
