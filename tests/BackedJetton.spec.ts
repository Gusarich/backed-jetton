import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { BackedJetton } from '../wrappers/BackedJetton';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('BackedJetton', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('BackedJetton');
    });

    let blockchain: Blockchain;
    let backedJetton: SandboxContract<BackedJetton>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        backedJetton = blockchain.openContract(BackedJetton.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await backedJetton.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: backedJetton.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and backedJetton are ready to use
    });
});
