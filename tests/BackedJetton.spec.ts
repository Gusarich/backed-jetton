import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { BackedJetton } from '../wrappers/BackedJetton';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('BackedJetton', () => {
    let code: Cell;
    let wallet: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        code = await compile('BackedJetton');
    });

    let blockchain: Blockchain;
    let backedJetton: SandboxContract<BackedJetton>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        const deployer = await blockchain.treasury('deployer');
        wallet = await blockchain.treasury('wallet');

        backedJetton = blockchain.openContract(
            BackedJetton.createFromConfig(
                {
                    admin: wallet.address,
                    content: Cell.EMPTY,
                    walletCode: Cell.fromBoc(
                        Buffer.from(
                            'B5EE9C7241021201000334000114FF00F4A413F4BCF2C80B0102016202030202CC0405001BA0F605DA89A1F401F481F481A8610201D40607020148080900C30831C02497C138007434C0C05C6C2544D7C0FC02F83E903E900C7E800C5C75C87E800C7E800C1CEA6D0000B4C7E08403E29FA954882EA54C4D167C0238208405E3514654882EA58C511100FC02780D60841657C1EF2EA4D67C02B817C12103FCBC2000113E910C1C2EBCB853600201200A0B020120101101F100F4CFFE803E90087C007B51343E803E903E90350C144DA8548AB1C17CB8B04A30BFFCB8B0950D109C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C032483E401C1D3232C0B281F2FFF274013E903D010C7E800835D270803CB8B11DE0063232C1540233C59C3E8085F2DAC4F3200C03F73B51343E803E903E90350C0234CFFE80145468017E903E9014D6F1C1551CDB5C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C0327E401C1D3232C0B281F2FFF274140371C1472C7CB8B0C2BE80146A2860822625A020822625A004AD8228608239387028062849F8C3C975C2C070C008E00D0E0F00AE8210178D4519C8CB1F19CB3F5007FA0222CF165006CF1625FA025003CF16C95005CC2391729171E25008A813A08208E4E1C0AA008208989680A0A014BCF2E2C504C98040FB001023C85004FA0258CF1601CF16CCC9ED5400705279A018A182107362D09CC8CB1F5230CB3F58FA025007CF165007CF16C9718010C8CB0524CF165006FA0215CB6A14CCC971FB0010241023000E10491038375F040076C200B08E218210D53276DB708010C8CB055008CF165004FA0216CB6A12CB1F12CB3FC972FB0093356C21E203C85004FA0258CF1601CF16CCC9ED5400DB3B51343E803E903E90350C01F4CFFE803E900C145468549271C17CB8B049F0BFFCB8B0A0823938702A8005A805AF3CB8B0E0841EF765F7B232C7C572CFD400FE8088B3C58073C5B25C60063232C14933C59C3E80B2DAB33260103EC01004F214013E809633C58073C5B3327B55200083200835C87B51343E803E903E90350C0134C7E08405E3514654882EA0841EF765F784EE84AC7CB8B174CFCC7E800C04E81408F214013E809633C58073C5B3327B552093150AD4',
                            'hex'
                        )
                    )[0],
                    beginPrice: 1000n,
                },
                code
            )
        );

        const deployResult = await backedJetton.sendDeploy(deployer.getSender(), toNano('0.1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: backedJetton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {});

    it('should calculate tokens for toncoins', async () => {
        expect(await backedJetton.getTokensForToncoins(toNano('0.001'))).toEqual(1414213562n);
        expect(await backedJetton.getTokensForToncoins(toNano('1'))).toEqual(44721359549n);
        expect(await backedJetton.getTokensForToncoins(toNano('100'))).toEqual(447213595499n);
    });

    it('should mint new jettons on a `purchase` call', async () => {
        await backedJetton.sendPurchase(wallet.getSender(), toNano('100'), toNano('1'));
        const address = await backedJetton.getWalletAddressOf(wallet.address);
        let jettonWallet = blockchain.provider(address);
        let balance = await (await jettonWallet.get('get_wallet_data', [])).stack.readBigNumber();
        expect(balance).toBeLessThanOrEqual(447213595499n);
        expect(balance).toBeGreaterThanOrEqual(440000000000n);

        await backedJetton.sendPurchase(wallet.getSender(), toNano('100'), toNano('1'));
        balance = await (await jettonWallet.get('get_wallet_data', [])).stack.readBigNumber();
        console.log(balance);
        expect(balance).toBeLessThanOrEqual(632455532033n);
        expect(balance).toBeGreaterThanOrEqual(630000000000n);
    });
});
