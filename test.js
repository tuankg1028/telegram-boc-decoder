const { TonClient, Address } = require("ton-core");
const client = new TonClient({
  endpoint: "https://toncenter.com/api/v2/jsonRPC",
});

async function getOwnerFromJettonWallet(jettonWalletAddress) {
  const address = Address.parse(jettonWalletAddress);

  // Fetch the contract state
  const state = await client.getContractState(address);

  if (state.data) {
    // Decode owner address from the state
    const ownerSlice = state.data.beginParse().loadRef().loadSlice(256);
    const ownerAddress = Address.parseRaw(ownerSlice.loadBuffer(32));
    return ownerAddress.toString();
  } else {
    throw new Error("Failed to fetch contract data.");
  }
}

const jettonWalletAddress = "EQCCPUcp-lxJdGSGENIgPh6GQYJ0OjHjtcMZU_fxlwMLqZct";
getOwnerFromJettonWallet(jettonWalletAddress)
  .then((owner) => {
    console.log("Owner TON Wallet Address:", owner);
  })
  .catch(console.error);
