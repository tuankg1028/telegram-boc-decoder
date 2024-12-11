const { Worker, isMainThread, parentPort } = require("worker_threads");
require("dotenv").config();
const TonWeb = require("tonweb");
const TonWebMnemonic = require("tonweb-mnemonic");
const bip39 = require("bip39");
const fs = require("fs");
const _ = require("lodash");

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: "ce3bc2ecbb46fadc220e408d8c3c81520efddf6f1ca876944468a47b1a1c9620",
  })
);

const API_KEYS = [
  "6a1c2f88187d51a4f53fa11a80b54bbcc02228754ebe13a244f8b65b1cda0c1e",
  "c0299274f827733e0962b3d8cf9bda47adc7ad8a7769cf7e137f3c61c2b5ba44",
  "bf65e32f5ee138878ea865b25938c0a570a25875b26341dca26c6dc99ea6a34b",
  "ad585cd5e5cd9cd094b43e98d772ae6aa28c348548f87851c305c1791e4c3680",
];

const tonwebs = API_KEYS.map((apiKey) => {
  return new TonWeb(
    new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
      apiKey: apiKey,
    })
  );
});

const WalletClass = tonweb.wallet.all.v4R2;

function generateMnemonic() {
  return bip39.generateMnemonic(256); // 128 bits of entropy will generate a 12-word mnemonic
}

var count = 0;

if (isMainThread) {
  const numThreads = (API_KEYS.length + 1) * 2; // Number of threads you want to run
  for (let i = 0; i < numThreads; i++) {
    new Worker(__filename);
  }
} else {
  async function runParallel() {
    while (true) {
      try {
        const MNEMONIC = generateMnemonic();
        const MNEMONIC_ARRAY = MNEMONIC.split(" ");

        const seed = await TonWebMnemonic.mnemonicToSeed(MNEMONIC_ARRAY);

        const keyPair = TonWeb.utils.keyPairFromSeed(seed);
        const wallet = new WalletClass(tonweb.provider, {
          publicKey: keyPair.publicKey,
        });

        const address = await wallet.getAddress();

        const balance = await _.sample([
          tonweb,
          ...tonwebs,
        ]).provider.getBalance(address.toString(true, true, true));

        console.log(
          `[${++count}]` +
            "My address is " +
            address.toString() +
            " with balance " +
            balance
        );

        if (Number(balance) > 0) {
          let mnemonics = [];
          if (fs.existsSync("mnemonic.txt")) {
            mnemonics = JSON.parse(fs.readFileSync("mnemonic.txt", "utf8"));
          }
          mnemonics.push(MNEMONIC_ARRAY);
          fs.writeFileSync("mnemonic.txt", JSON.stringify(mnemonics));
        }
      } catch (e) {
        console.error(e.message);
      }
    }
  }

  const numParallel = 15; // Set the number of parallel executions
  const parallelTasks = Array(numParallel).fill(runParallel);
  Promise.all(parallelTasks.map((task) => task()));
}
