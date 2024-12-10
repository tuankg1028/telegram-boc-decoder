require("dotenv").config();
const TonWeb = require("tonweb");
const TonWebMnemonic = require("tonweb-mnemonic");
const bip39 = require("bip39");
const fs = require("fs");

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: "ce3bc2ecbb46fadc220e408d8c3c81520efddf6f1ca876944468a47b1a1c9620",
  })
);
const WalletClass = tonweb.wallet.all.v4R2;

function generateMnemonic() {
  return bip39.generateMnemonic(256); // 128 bits of entropy will generate a 12-word mnemonic
}

main();
async function main() {
  const numParallel = 3; // Set the number of parallel executions
  const parallelTasks = Array(numParallel).fill(runParallel);
  await Promise.all(parallelTasks.map((task) => task()));
}

async function runParallel() {
  while (true) {
    const MNEMONIC = generateMnemonic();
    const MNEMONIC_ARRAY = MNEMONIC.split(" ");

    const seed = await TonWebMnemonic.mnemonicToSeed(MNEMONIC_ARRAY);

    const keyPair = TonWeb.utils.keyPairFromSeed(seed);
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
    });

    const address = await wallet.getAddress();

    const balance = await tonweb.provider.getBalance(
      address.toString(true, true, true)
    );

    console.log(
      "My address is " + address.toString() + " with balance " + balance
    );

    if (Number(balance) > 0) {
      let mnemonics = [];
      if (fs.existsSync("mnemonic.txt")) {
        mnemonics = JSON.parse(fs.readFileSync("mnemonic.txt", "utf8"));
      }
      mnemonics.push(MNEMONIC_ARRAY);
      fs.writeFileSync("mnemonic.txt", JSON.stringify(mnemonics));
    }
  }
}
