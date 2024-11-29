// const MY_WALLET_ADDRESS = "UQD7TVT8vkMpUFfuSuOqUCbWtvQyv8z7z-6KXbBHv1rwZlsh"; // your HOT wallet
// // const MY_WALLET_ADDRESS = "0QDTWdtCCfl3w5b86pyVVx6g_7lSAWhTEQXIJeoScZnTJTEH"; // your HOT wallet

// // Supported jettons config

// const USDT_JETTON_ADDRESS_MAINNET =
//   "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

// const USDT_JETTON_ADDRESS_TESTNET =
//   "kQD5l75tbhYoCcYMAPzlD1GRTAIdJZ9y-fgI-5xTnEeVIitl";
// const JETTONS_INFO = {
//   USDT: {
//     address: isMainnet
//       ? USDT_JETTON_ADDRESS_MAINNET
//       : USDT_JETTON_ADDRESS_TESTNET,
//     decimals: 6,
//   },
//   //   jUSDC: {
//   //     address: "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",
//   //     decimals: 6,
//   //   },
//   //   KOTE: {
//   //     address: "EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj",
//   //     decimals: 9,
//   //   },
// };
require("dotenv").config();

const TonWeb = require("tonweb");
const { AccountSubscription } = require("./account/AccountSubscription.js");
const { Address } = require("@ton/core");
const axios = require("axios");
const { TON_API_KEY } = process.env;
const isMainnet = true;

const USDT_MASTER_ADDRESS_TESTNET = Address.parse(
  "kQD5l75tbhYoCcYMAPzlD1GRTAIdJZ9y-fgI-5xTnEeVIitl"
);
const USDT_MASTER_ADDRESS = Address.parse(
  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
);

const USDT_JETTON_ADDRESS = isMainnet
  ? USDT_MASTER_ADDRESS
  : USDT_MASTER_ADDRESS_TESTNET;

const tonweb = isMainnet
  ? new TonWeb(
      new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
        apiKey: TON_API_KEY,
      })
    )
  : new TonWeb(
      new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", {
        apiKey: TON_API_KEY,
      })
    );

main();
async function main() {
  console.log(
    1,
    Address.parse(
      "0:fb4d54fcbe43295057ee4ae3aa5026d6b6f432bfccfbcfee8a5db047bf5af066"
    ).toString(true, false, true)
  );
  const eventsRes = await axios.get(
    `https://tonapi.io/v2/accounts/0%3Afb4d54fcbe43295057ee4ae3aa5026d6b6f432bfccfbcfee8a5db047bf5af066/events?initiator=false&subject_only=false&limit=20`
  );
  const events = eventsRes.data.events;

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

    // tonweb.
    console.log({ sender, recipient, amount });
  }
}
