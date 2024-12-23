require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const { Cell, Address } = require("@ton/core");
const TonWeb = require("tonweb");
const axios = require("axios");
var morgan = require("morgan");
const fs = require("fs");

const TonService = require("./services/ton");
const { IS_MAINNET, PORT = 4000 } = process.env;

const app = express();
const port = PORT;
const TELEGRAM_API_URL =
  IS_MAINNET === "1" ? "https://tonapi.io" : "https://testnet.tonapi.io";
const TON_EXPLORER_URL =
  IS_MAINNET === "1"
    ? "https://tonviewer.com"
    : "https://testnet.tonviewer.com";

app.use(morgan("combined"));
app.use(bodyParser.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.send({ status: "healthy" });
});

app.get("/walletInfo", async (req, res) => {
  const walletInfo = await TonService.getWalletInfo();

  res.json(walletInfo);
});

app.post("/usdt-deposit", async (req, res) => {
  const {
    senderWallerAddress,
    receiverWallerAddress,
    notify_url,
    transaction_id,
    retry = 3,
    timeInterval = 10_000,
  } = req.body;

  if (!senderWallerAddress) {
    return res.status(400).send({
      error: "senderWallerAddress is required",
    });
  }

  if (!receiverWallerAddress) {
    return res.status(400).send({
      error: "receiverWallerAddress is required",
    });
  }

  res.send({
    notify_url,
    explorerUrl: "",
    status: "success",
    message: "success",
  });

  try {
    let transaction = null;
    let attempts = 0;

    while (!transaction && attempts < retry) {
      console.log(`Attempt ${attempts + 1} to retrieve transaction`);

      transaction = await TonService.getSenderDepositJetton(
        Address.parse(senderWallerAddress).toRawString(),
        Address.parse(receiverWallerAddress).toRawString()
      );

      if (!transaction) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, timeInterval));
      }
    }

    if (!transaction) {
      return res.status(400).send({
        error: "Failed to retrieve transaction after multiple attempts",
      });
    }

    console.log("Transaction:", transaction);
    // save event id
    let checkedEventIds = JSON.parse(
      fs.readFileSync("checkedEventIds.txt", "utf8")
    );
    checkedEventIds.push(transaction.eventId);
    fs.writeFileSync("checkedEventIds.txt", JSON.stringify(checkedEventIds));

    const explorerUrl = ``; //todo: get the explorer url
    axios
      .post(notify_url, {
        ...transaction,
        success: true,
        transaction_id,
        hash: "",
        explorerUrl,
      })
      .catch((error) => {
        console.log("Failed to notify the callback url", error.message);
      });
  } catch (error) {
    res.status(500).send(`Error usdt-deposit: ${error.message}`);
  }
});

app.post("/hash", async (req, res) => {
  const {
    boc,
    notify_url,
    transaction_id,
    retry = 3,
    timeInterval = 10_000,
  } = req.body;

  if (!boc) {
    return res.status(400).send({
      error: "boc is required",
    });
  }

  try {
    const cell = Cell.fromBase64(boc);
    const buffer = cell.hash();
    const hashHex = buffer.toString("hex");
    const explorerUrl = `${TON_EXPLORER_URL}/transaction/${hashHex}`;
    res.send({
      notify_url,
      explorerUrl,
      status: "success",
      message: "decode hash success",
    });

    let transaction = null;
    let attempts = 0;

    while ((!transaction || transaction.error) && attempts < retry) {
      console.log(`Attempt ${attempts + 1} to retrieve transaction`);
      const transactionRes = await fetch(
        `${TELEGRAM_API_URL}/v2/blockchain/messages/${hashHex}/transaction`
      );
      transaction = await transactionRes.json();

      if (!transaction || transaction.error) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, timeInterval));
      }
    }

    if (!transaction || transaction.error) {
      console.error("Failed to retrieve transaction after multiple attempts");
    }

    console.log("Transaction:", transaction);
    axios
      .post(notify_url, {
        ...transaction,
        transaction_id,
        hash: boc,
        explorerUrl,
      })
      .then(() => console.log("Successfully notified the callback url"))
      .catch((error) => {
        console.log("Failed to notify the callback url", error.message);
      });
  } catch (error) {
    res.status(500).send("Error processing the base64 string");
  }
});

app.post("/usdt-withdraw", async (req, res) => {
  const { transaction_id, wallet_address, amount, notify_url } = req.body;

  if (!transaction_id || !wallet_address || !amount || !notify_url) {
    return res.status(400).send({
      error: "invalid request",
    });
  }

  try {
    const withdrawalRequest = {
      amount: TonWeb.utils.toNano((Number(amount) / 1_000).toString()),
      toAddress: wallet_address,
    };

    const withdrawalRes = await TonService.doJettonWithdraw(withdrawalRequest);

    const status = withdrawalRes.error ? "fail" : "success";
    const callbackPayload = {
      transaction_id,
      amount,
      fee: withdrawalRes.fee?.source_fees?.gas_fee,
      status,
      ...(status === "fail" && {
        errorDescription: withdrawalRes.error,
      }),
    };

    axios.post(notify_url, callbackPayload).catch((error) => {
      console.log("Failed to notify the callback url", error.message);
    });

    res.send({
      notify_url,
      status,
      message: "withdrawal request sent",
      ...(status === "fail" && {
        errorDescription: withdrawalRes.error,
      }),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error processing the withdrawal request");
  }
});

app.post("/withdraw", async (req, res) => {
  const { transaction_id, wallet_address, amount, notify_url } = req.body;

  if (!transaction_id || !wallet_address || !amount || !notify_url) {
    return res.status(400).send({
      error: "invalid request",
    });
  }

  try {
    const withdrawalRequest = {
      amount: TonWeb.utils.toNano(amount.toString()),
      toAddress: wallet_address,
    };

    const withdrawalRes = await TonService.doWithdraw(withdrawalRequest);

    const status = withdrawalRes.error ? "fail" : "success";
    const callbackPayload = {
      transaction_id,
      amount,
      fee: withdrawalRes.fee?.source_fees?.gas_fee,
      status,
      ...(status === "fail" && {
        errorDescription: withdrawalRes.error,
      }),
    };

    axios.post(notify_url, callbackPayload).catch((error) => {
      console.log("Failed to notify the callback url", error.message);
    });

    res.send({
      notify_url,
      status,
      message: "withdrawal request sent",
      ...(status === "fail" && {
        errorDescription: withdrawalRes.error,
      }),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error processing the withdrawal request");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// listenForDeposits("EQCutVWKe5Gg7TxVRwWCnmi7BAhXDOSXSzD9OL38bCHojfHE");
// hashHex: 57123dffb9029bdaa9187b5d035737eea94a1b8c018e2ab1885f245eb95c6e30
// const hashBase64 = buffer.toString('base64');
// https://testnet.tonapi.io/v2/blockchain/messages/ffd1f9323c10b840629baaa528bcb6622ecc3cad491d0236bb8e49b00b3e3744/transaction
// https://tonapi.io/api-v2/blockchain/messages/ffd1f9323c10b840629baaa528bcb6622ecc3cad491d0236bb8e49b00b3e3744/transaction
