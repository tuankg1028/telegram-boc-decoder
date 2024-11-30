require("buffer");

const { TonConnectUI } = require("@tonconnect/ui");
const { Address, JettonMaster, TonClient } = require("@ton/ton");
const { toNano } = require("@ton/core");

const { JettonWallet } = require("./wrappers/JettonWallet.js");

const IS_MAINNET = "0";
const JETTON_TRANSFER_GAS_FEES = toNano("0.038");
const TON_API_KEY =
  IS_MAINNET === "1"
    ? "ce3bc2ecbb46fadc220e408d8c3c81520efddf6f1ca876944468a47b1a1c9620"
    : "d6f13f48471eeb336b501ea04ec169f5cfdb70425c7f0472952b9e023d6f878a";
const USDT_MASTER_ADDRESS_TESTNET = Address.parse(
  "kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy"
);
const USDT_MASTER_ADDRESS_MAINNET = Address.parse(
  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
);
const TEST_WALLET = "0QCVZCZQ9qRSksx-OIw8tMywKmU7jl0sOxOBfpYrZRbaKZpz";
const USDT_MASTER_ADDRESS =
    IS_MAINNET === "1"
      ? USDT_MASTER_ADDRESS_MAINNET
      : USDT_MASTER_ADDRESS_TESTNET,
  TON_API_ENDPOINT =
    IS_MAINNET === "1"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC";

const tonConnectUI = new TonConnectUI({
  manifestUrl: "https://ox-bot.s3.amazonaws.com/tonconnect-manifest.json",
  buttonRootId: "ton-connect",
});
const tonClient = new TonClient({
  apiKey: TON_API_KEY,
  endpoint: TON_API_ENDPOINT,
});

tonConnectUI.onStatusChange((wallet) => {
  if (wallet) {
    const address = Address.parse(wallet.account.address).toString({
      bounceable: false,
      testOnly: true,
    });

    console.log(2, { address });
    $("#sender-wallet-address").val(address);
  } else {
    $("#sender-wallet-address").val("");
  }
});

async function connectToWallet() {
  const connectedWallet = await tonConnectUI.connectWallet();

  console.log({ connectedWallet });
}

// Call the function
connectToWallet().catch((error) => {
  console.error("Error connecting to wallet:", error);
});

async function sendTransaction() {
  let amount = $("#deposit-amount").val() / $("#ton-price").val();
  let address =
    $.trim(
      $(".bank-listing .form-check-input:checked")
        .parent()
        .find(".address")
        .text()
    ) || TEST_WALLET;

  const transaction = {
    validUntil: Math.round(Date.now() / 1000) + 10,
    messages: [
      {
        address: address,
        amount: amount.toFixed(2) * 1000000000,
      },
    ],
  };

  try {
    let res = await tonConnectUI.sendTransaction(transaction);
    if (res.boc) {
      $("#boc").val(res.boc);
      document.getElementById("bank-transfer").submit();
      console.log(JSON.stringify(res));
    }
  } catch (e) {
    console.log(e);
  }
}

async function sendUSDTTransaction() {
  console.log(1, tonConnectUI.wallet);
  const walletAddress = tonConnectUI.wallet?.account?.address
    ? Address.parse(tonConnectUI.wallet.account.address)
    : undefined;
  let amount = $("#deposit-amount").val();
  let depositWallet =
    $.trim(
      $(".bank-listing .form-check-input:checked")
        .parent()
        .find(".address")
        .text()
    ) || TEST_WALLET;

  console.log({ depositWallet });
  console.log(1.1, USDT_MASTER_ADDRESS);
  const jettonMaster = tonClient.open(JettonMaster.create(USDT_MASTER_ADDRESS));
  console.log(1.2, jettonMaster);
  const userAddress = await jettonMaster.getWalletAddress(walletAddress);
  console.log(2, userAddress.toString());
  const jettonWallet = tonClient.open(
    JettonWallet.createFromAddress(userAddress)
  );
  console.log(3, jettonWallet, jettonWallet.address.toString());

  const depositJettonAddress = await jettonMaster.getWalletAddress(
    Address.parse(depositWallet)
  );
  const depositjettonWallet = tonClient.open(
    JettonWallet.createFromAddress(depositJettonAddress)
  );
  console.log(4, depositjettonWallet, depositjettonWallet.address.toString());

  const sender = {
    send: async (args) => {
      await tonConnectUI.sendTransaction({
        messages: [
          {
            address: args.to.toString(),
            amount: args.value.toString(),
            payload: args.body?.toBoc()?.toString("base64"),
          },
        ],
        validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes for user to approve
      });
    },
    address: walletAddress,
  };

  await jettonWallet.sendTransfer(sender, {
    fwdAmount: BigInt(1),
    comment: "",
    jettonAmount: BigInt(Number(amount) * 100 * 10000),
    toAddress: Address.parse(depositWallet),
    value: JETTON_TRANSFER_GAS_FEES,
  });

  return { boc: "123123" };
}

$("#send-transaction").on("click", function (e) {
  sendTransaction();
});

$("#send-usdt-transaction").on("click", async function (e) {
  const { boc } = await sendUSDTTransaction();

  if (boc) {
    document.getElementById("bank-transfer").submit();
  }
});
