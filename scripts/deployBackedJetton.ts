import { toNano } from 'ton-core';
import { BackedJetton } from '../wrappers/BackedJetton';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const backedJetton = provider.open(BackedJetton.createFromConfig({}, await compile('BackedJetton')));

    await backedJetton.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(backedJetton.address);

    // run methods on `backedJetton`
}
