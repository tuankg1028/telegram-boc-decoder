# Decode BOC to get transaction's information on blockchain

Install dependencies
```bash
npm install
```

Run app
```bash
node index.js
```

## Request:
POST: http://localhost:4000/hash
```
{
    "boc": "te6cckEBAgEAqQAB4YgBt2GODKEwzYo1MjbnMViJc3PAB6nkXPRUAww8DRsFxDAGaFNuyqzKV5S/xlhsDlN8qop+O7ktRWV6PVIycfupiqEjJkswhWuH7auLIsdOjbGxN9fan0YAcx+2P96rVCiAAU1NGLs1mn6QAAAAQAAcAQBmQgBprO2hBPy74ct+dU5Kq49Qf9ypALQpiILkEvUJOMzpkpzEtAAAAAAAAAAAAAAAAAAAVkAufg=="
}
```

## Response:
```
{
   "hash":"f1d0445f86d588fcce1ce07e29c8402d3b5f11902e612b0b1c99d582b228ab79",
   "lt":24514445000001,
   "account":{
      "address":"0:dbb0c706509866c51a991b7398ac44b9b9e003d4f22e7a2a01861e068d82e218",
      "is_scam":false,
      "is_wallet":true
   },
   "success":true,
   "utime":1723027117,
   "orig_status":"active",
   "end_status":"active",
   "total_fees":2066318,
   "end_balance":4900016251,
   "transaction_type":"TransOrd",
   "state_update_old":"1c17a37a0b437af870082521dc12619eea56ff78c2d9345a0d9c48b7e66c914a",
   "state_update_new":"28806c2ebefc4b214237e7aed898abae605e6fd09719d8ac8e130ac1471cc2b1",
   "in_msg":{
      "msg_type":"ext_in_msg",
      "created_lt":0,
      "ihr_disabled":false,
      "bounce":false,
      "bounced":false,
      "value":0,
      "fwd_fee":0,
      "ihr_fee":0,
      "destination":{
         "address":"0:dbb0c706509866c51a991b7398ac44b9b9e003d4f22e7a2a01861e068d82e218",
         "is_scam":false,
         "is_wallet":true
      },
      "import_fee":0,
      "created_at":0,
      "hash":"ffd1f9323c10b840629baaa528bcb6622ecc3cad491d0236bb8e49b00b3e3744",
      "raw_body":"b5ee9c7201010201008600019ccd0a6dd955994af297f8cb0d81ca6f95514fc77725a8acaf47aa464e3f7531542464c96610ad70fdb5716458e9d1b63626fafb53e8c00e63f6c7fbd56a85100029a9a31766b34fd2000000080003010066420069aceda104fcbbe1cb7e754e4aab8f507fdca900b4298882e412f50938cce9929cc4b40000000000000000000000000000",
      "decoded_op_name":"wallet_signed_v4",
      "decoded_body":{
         "signature":"cd0a6dd955994af297f8cb0d81ca6f95514fc77725a8acaf47aa464e3f7531542464c96610ad70fdb5716458e9d1b63626fafb53e8c00e63f6c7fbd56a851000",
         "subwallet_id":698983191,
         "valid_until":1723027410,
         "seqno":8,
         "op":0,
         "payload":[
            {
               "mode":3,
               "message":{
                  "sum_type":"MessageInternal",
                  "message_internal":{
                     "ihr_disabled":true,
                     "bounce":false,
                     "bounced":false,
                     "src":"",
                     "dest":"0:d359db4209f977c396fcea9c95571ea0ffb9520168531105c825ea127199d325",
                     "value":{
                        "grams":"10000000",
                        "other":{
                           
                        }
                     },
                     "ihr_fee":"0",
                     "fwd_fee":"0",
                     "created_lt":0,
                     "created_at":0,
                     "init":null,
                     "body":{
                        "is_right":false,
                        "value":{
                           
                        }
                     }
                  }
               }
            }
         ]
      }
   },
   "out_msgs":[
      {
         "msg_type":"int_msg",
         "created_lt":24514445000002,
         "ihr_disabled":true,
         "bounce":false,
         "bounced":false,
         "value":10000000,
         "fwd_fee":266669,
         "ihr_fee":0,
         "destination":{
            "address":"0:d359db4209f977c396fcea9c95571ea0ffb9520168531105c825ea127199d325",
            "is_scam":false,
            "is_wallet":true
         },
         "source":{
            "address":"0:dbb0c706509866c51a991b7398ac44b9b9e003d4f22e7a2a01861e068d82e218",
            "is_scam":false,
            "is_wallet":true
         },
         "import_fee":0,
         "created_at":1723027117,
         "hash":"8c44d4b7cc70037eb7111406a1a8af33ab6eda637ad1ceb31cf21504d63d4a1f"
      }
   ],
   "block":"(0,e000000000000000,23366455)",
   "prev_trans_hash":"89a3f5193aa8f71e544c1d8c226dd8034a764109d0528224bdfc5d4f94414686",
   "prev_trans_lt":24503724000001,
   "compute_phase":{
      "skipped":false,
      "success":true,
      "gas_fees":1323200,
      "gas_used":3308,
      "vm_steps":68,
      "exit_code":0,
      "exit_code_description":"Ok"
   },
   "storage_phase":{
      "fees_collected":6587,
      "status_change":"acst_unchanged"
   },
   "action_phase":{
      "success":true,
      "result_code":0,
      "total_actions":1,
      "skipped_actions":0,
      "fwd_fees":400000,
      "total_fees":133331
   },
   "aborted":false,
   "destroyed":false,
   "raw":"b5ee9c7201020a010002470003b57dbb0c706509866c51a991b7398ac44b9b9e003d4f22e7a2a01861e068d82e2180000164bb6c93d4189a3f5193aa8f71e544c1d8c226dd8034a764109d0528224bdfc5d4f944146860000164937c3c30166b34ead0003463f0f1c80102030201e004050082721c17a37a0b437af870082521dc12619eea56ff78c2d9345a0d9c48b7e66c914a28806c2ebefc4b214237e7aed898abae605e6fd09719d8ac8e130ac1471cc2b102110c866ec618a1860440080901e18801b7618e0ca130cd8a353236e73158897373c007a9e45cf454030c3c0d1b05c4300668536ecaacca5794bfc6586c0e537caa8a7e3bb92d45657a3d523271fba98aa123264b30856b87edab8b22c74e8db1b137d7da9f4600731fb63fdeab542880014d4d18bb359a7e9000000040001c060101df070066420069aceda104fcbbe1cb7e754e4aab8f507fdca900b4298882e412f50938cce9929cc4b4000000000000000000000000000000af4801b7618e0ca130cd8a353236e73158897373c007a9e45cf454030c3c0d1b05c4310034d676d0827e5df0e5bf3aa72555c7a83fee54805a14c44172097a849c6674c94e625a000608235a00002c976d927a84cd669d5a40009d419d8313880000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020006fc9830d404c08234c00000000000200000000000264a749a6077e7f234e2badd447a939fcb7c801cd3a2f2969ba24fe095cbeb4d4405015cc"
}
```
