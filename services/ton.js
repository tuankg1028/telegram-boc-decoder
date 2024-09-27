const TonWeb = require('tonweb');
const TonWebMnemonic = require('tonweb-mnemonic');

const {
    IS_MAINNET,
    MNEMONIC,
    TON_API_KEY
} = process.env;

const BN = TonWeb.utils.BN;
const tonweb = IS_MAINNET === "1" ?
    new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', { apiKey: TON_API_KEY })) :
    new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', { apiKey: TON_API_KEY }));


const getWalletInfo = async () => {
    const seed = await TonWebMnemonic.mnemonicToSeed(MNEMONIC.split(' '));
    const keyPair = TonWeb.utils.keyPairFromSeed(seed);

    const WalletClass = tonweb.wallet.all.v3R2;

    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey
    });

    const address = await wallet.getAddress()
    const nonBounceableAddress = address.toString(true, true, true);

    const balance = await tonweb.provider.getBalance((address).toString(true, true, true))
    return {
        address: nonBounceableAddress,
        balance: TonWeb.utils.fromNano(balance)
    };
}
const doWithdraw = async (withdrawalRequest) => {
    
    try {
        const seed = await TonWebMnemonic.mnemonicToSeed(MNEMONIC.split(' '));
        // const seed = TonWeb.utils.base64ToBytes('YOU_PRIVATE_KEY_IN_BASE64');  // your hot wallet seed, see `common.js`
        const keyPair = TonWeb.utils.keyPairFromSeed(seed);

        const WalletClass = tonweb.wallet.all.v3R2;

        const wallet = new WalletClass(tonweb.provider, {
            publicKey: keyPair.publicKey
        });

        if (!withdrawalRequest.seqno) {
            withdrawalRequest.seqno = await wallet.methods.seqno().call() || 0;
            // after we set `seqno`, it should never change again for this transfer to prevent double withdrawal
        }
        
        const address = await wallet.getAddress()
        // const nonBounceableAddress = address.toString(true, true, true);
        // console.log({nonBounceableAddress})
        const balance = new BN(await tonweb.provider.getBalance((address).toString(true, true, true)));
        // console.log({balance, withdrawalRequest})

        if (withdrawalRequest.amount.gte(balance)) {
            console.log('there is not enough balance to process the withdrawal');
            return {
                error: 'there is not enough balance to process the withdrawal'
            };
        }

        // If the recipient is a not yet initialized wallet
        // then you need to send a non-bounce transfer
        // As an option, you can always make non-bounce transfers for withdrawals

        let toAddress = withdrawalRequest.toAddress;

        const info = await tonweb.provider.getAddressInfo(toAddress);
        if (info.state !== 'active') {
            toAddress = new TonWeb.utils.Address(toAddress).toString(true, true, false); // convert to non-bounce
        }

        // sign transfer (offline operation)
        const transfer = await wallet.methods.transfer({
            secretKey: keyPair.secretKey,
            toAddress: toAddress,
            amount: withdrawalRequest.amount,
            seqno: withdrawalRequest.seqno,
            payload: '123' // if necessary, here you can set a unique payload to distinguish the operation
        });

        // send transfer

        const isOfflineSign = false; // Some services sign transactions on one server and send signed transactions from another server
        const estimatedFee = await transfer.estimateFee(); // estimate fee for transfer
        if (isOfflineSign) {
            const query = await transfer.getQuery(); // transfer query
            const boc = await query.toBoc(false); // serialized transfer query in binary BoC format
            const bocBase64 = TonWeb.utils.bytesToBase64(boc); // in base64 format

            await tonweb.provider.sendBoc(bocBase64); // send transfer request to network
        } else {
            await transfer.send().then(console.log); // send transfer request to network
        }
        console.log(`request ${withdrawalRequest.seqno} sent`);

        return {
            fee: estimatedFee,
        };
    } catch (error) {
        console.error('Failed to process withdrawal request', error);
        return {
            error: 'Failed to process withdrawal request'
        };
    }
}

module.exports = {
    doWithdraw,
    getWalletInfo
}