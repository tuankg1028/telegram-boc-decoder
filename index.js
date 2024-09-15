require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const { Cell } = require('@ton/core');
const TonWeb = require('tonweb');
const axios = require('axios');

const TonService = require('./services/ton')
const {
    IS_MAINNET,
} = process.env;

const app = express();
const port = 4000;
const TELEGRAM_API_URL = IS_MAINNET === "1" ? 'https://tonapi.io': 'https://testnet.tonapi.io'
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'healthy' });
});

app.post('/hash', async (req, res) => {
    const { boc } = req.body;

    if (!boc) {
        return res.status(400).send('boc is required');
    }

    try {
        const cell = Cell.fromBase64(boc);
        const buffer = cell.hash();
        const hashHex = buffer.toString('hex');

        const transactionRes = await fetch(`${TELEGRAM_API_URL}/v2/blockchain/messages/${hashHex}/transaction`)
        const transaction = await transactionRes.json();
      
        res.send(transaction);
    } catch (error) {
        res.status(500).send('Error processing the base64 string');
    }
});

app.post('/withdraw', async (req, res) => {
    const { transaction_id,
        wallet_address,
        amount,
        notify_url } = req.body;

    if (!transaction_id || !wallet_address || !amount || !notify_url) {
        return res.status(400).send('invalid request');
    }

    try {
        const withdrawalRequest = {
            amount: TonWeb.utils.toNano(amount.toString()), 
            toAddress: wallet_address,
        }
        
        await TonService.doWithdraw(withdrawalRequest)

        axios.get(`${notify_url}?transaction_id=${transaction_id}`, {})
        res.send({
            status: 'success',
            message: 'withdrawal request sent'
        });
    } catch (error) {
        console.log(error)
        res.status(500).send('Error processing the withdrawal request');
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
// hashHex: 57123dffb9029bdaa9187b5d035737eea94a1b8c018e2ab1885f245eb95c6e30
// const hashBase64 = buffer.toString('base64');
// https://testnet.tonapi.io/v2/blockchain/messages/ffd1f9323c10b840629baaa528bcb6622ecc3cad491d0236bb8e49b00b3e3744/transaction
// https://tonapi.io/api-v2/blockchain/messages/ffd1f9323c10b840629baaa528bcb6622ecc3cad491d0236bb8e49b00b3e3744/transaction