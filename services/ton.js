const TonWeb = require("tonweb");
const TonWebMnemonic = require("tonweb-mnemonic");
const axios = require("axios");

const { IS_MAINNET, MNEMONIC, TON_API_KEY, WALLET_ADDRESS } = process.env;

const USDT_MASTER_ADDRESS_TESTNET =
  "kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy";
const USDT_MASTER_ADDRESS = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

const TON_API_ENDPOINT =
  IS_MAINNET === "1"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const TON_KEEPER_API_ENDPOINT =
  IS_MAINNET === "1" ? "https://tonapi.io" : "https://testnet.tonapi.io";
const USDT_JETTON_ADDRESS =
  IS_MAINNET === "1" ? USDT_MASTER_ADDRESS : USDT_MASTER_ADDRESS_TESTNET;
const BN = TonWeb.utils.BN;
const tonweb = new TonWeb(
  new TonWeb.HttpProvider(TON_API_ENDPOINT, { apiKey: TON_API_KEY })
);
const WalletClass = tonweb.wallet.all.v2R2;

const getWalletInfo = async () => {
  const seed = await TonWebMnemonic.mnemonicToSeed(MNEMONIC.split(" "));
  const keyPair = TonWeb.utils.keyPairFromSeed(seed);

  const WalletClass = tonweb.wallet.all.v3R2;

  const wallet = new WalletClass(tonweb.provider, {
    publicKey: keyPair.publicKey,
  });

  const address = await wallet.getAddress();
  const nonBounceableAddress = address.toString(true, true, true);

  const balance = await tonweb.provider.getBalance(
    address.toString(true, true, true)
  );
  // const history = await tonweb.provider.getTransactions(address);

  return {
    address: nonBounceableAddress,
    balance: TonWeb.utils.fromNano(balance),
    // history
  };
};

let wallet = null;
let keyPair = null;
(async function initWallet() {
  const seed = await TonWebMnemonic.mnemonicToSeed(MNEMONIC.split(" "));
  // const seed = TonWeb.utils.base64ToBytes('YOU_PRIVATE_KEY_IN_BASE64');  // your hot wallet seed, see `common.js`
  keyPair = TonWeb.utils.keyPairFromSeed(seed);
  wallet = new WalletClass(tonweb.provider, {
    publicKey: keyPair.publicKey,
  });
})();

const doWithdraw = async (withdrawalRequest) => {
  try {
    if (!withdrawalRequest.seqno) {
      withdrawalRequest.seqno = (await wallet.methods.seqno().call()) || 0;
      // after we set `seqno`, it should never change again for this transfer to prevent double withdrawal
    }

    const address = await wallet.getAddress();
    // const nonBounceableAddress = address.toString(true, true, true);
    // console.log({nonBounceableAddress})
    const balance = new BN(
      await tonweb.provider.getBalance(address.toString(true, true, true))
    );

    if (withdrawalRequest.amount.gte(balance)) {
      console.log("there is not enough balance to process the withdrawal");
      return {
        error: "there is not enough balance to process the withdrawal",
      };
    }

    // If the recipient is a not yet initialized wallet
    // then you need to send a non-bounce transfer
    // As an option, you can always make non-bounce transfers for withdrawals

    let toAddress = withdrawalRequest.toAddress;

    const info = await tonweb.provider.getAddressInfo(toAddress);
    if (info.state !== "active") {
      toAddress = new TonWeb.utils.Address(toAddress).toString(
        true,
        true,
        false
      ); // convert to non-bounce
    }

    // sign transfer (offline operation)
    const transfer = await wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: toAddress,
      amount: withdrawalRequest.amount,
      seqno: withdrawalRequest.seqno,
      payload: "123", // if necessary, here you can set a unique payload to distinguish the operation
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
    console.error("Failed to process withdrawal request", error);
    return {
      error: "Failed to process withdrawal request",
    };
  }
};

const getSenderDepositJetton = async (senderAddress) => {
  const eventsRes = await axios.get(
    `${TON_KEEPER_API_ENDPOINT}/v2/accounts/${WALLET_ADDRESS}/events?initiator=false&subject_only=false&limit=20`
  );

  const events = eventsRes.data.events;
  let depositJetton = null;
  for (const event of events) {
    const actions = event.actions;
    const eventId = event.event_id;
    if (actions[0].type !== "JettonTransfer") {
      continue;
    }

    const {
      JettonTransfer: { sender, recipient, amount },
    } = actions[0];

    console.log(event);

    if (sender.address === senderAddress) {
      depositJetton = {
        eventId,
        sender,
        recipientAddress: recipient.address,
        amount,
      };
      break;
    }
  }

  return depositJetton;
};

const doJettonWithdraw = async (withdrawalRequest) => {
  const seqno = (await wallet.methods.seqno().call()) || 0;
  if (!withdrawalRequest.seqno) {
    withdrawalRequest.seqno = seqno;
    // after we set `seqno`, it should never change again for this transfer to prevent double withdrawal
  }

  const toncoinAmount = TonWeb.utils.toNano("0.05"); // 0.05 TON

  const address = await wallet.getAddress();

  const balance = await tonweb.provider.getBalance(
    address.toString(true, true, true)
  );
  console.log("My balance is " + balance);

  if (toncoinAmount.gte(new BN(balance))) {
    console.log(
      "there is not enough Toncoin balance to process the Jetton withdrawal"
    );
    return false;
  }

  const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
    address: USDT_JETTON_ADDRESS,
  });
  const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(
    address
  );
  console.log(
    "My jetton wallet for " +
      " is " +
      jettonWalletAddress.toString(true, true, true)
  );
  const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
    address: jettonWalletAddress,
  });

  const jettonData = await jettonWallet.getData();

  const jettonBalance = jettonData.balance;
  console.log("My jetton balance is " + jettonBalance);
  if (withdrawalRequest.amount.gt(new BN(jettonBalance))) {
    console.log(
      "there is not enough Jetton balance to process the Jetton withdrawal"
    );
    return false;
  }

  const transfer = await wallet.methods.transfer({
    secretKey: keyPair.secretKey,
    toAddress: jettonWalletAddress,
    amount: toncoinAmount,
    seqno: seqno,
    payload: await jettonWallet.createTransferBody({
      queryId: seqno, // any number
      jettonAmount: withdrawalRequest.amount, // jetton amount in units
      toAddress: new TonWeb.utils.Address(withdrawalRequest.toAddress),
      responseAddress: address,
    }),
  });

  // send transfer

  const isOfflineSign = true; // Some services sign transactions on one server and send signed transactions from another server

  if (isOfflineSign) {
    const query = await transfer.getQuery(); // transfer query
    const boc = await query.toBoc(false); // serialized transfer query in binary BoC format
    const bocBase64 = TonWeb.utils.bytesToBase64(boc); // in base64 format

    await tonweb.provider.sendBoc(bocBase64); // send transfer request to network
  } else {
    await transfer.send().then(console.log); // send transfer request to network
  }
  console.log(`request ${withdrawalRequest.seqno} sent`);

  return false;
};
module.exports = {
  doWithdraw,
  doJettonWithdraw,
  getWalletInfo,
  getSenderDepositJetton,
};
