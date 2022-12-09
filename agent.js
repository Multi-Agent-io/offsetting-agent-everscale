"use strict"
import { config } from './config/config.js';

import BigNumber from "bignumber.js";
import * as IPFS from 'ipfs-core'
import { TonClient, abiContract, signerKeys, signerNone } from '@eversdk/core';
import { libNode } from '@eversdk/lib-node';
import { AssetFactory } from './contracts/AssetFactory.js';

const ipfs = await IPFS.create({ repo: "ipfs" })
const ENDPOINTS = ['https://devnet-sandbox.evercloud.dev/graphql']
const { ipfs_topic, auditor_address_config, auditor_seed } = config

TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
    network: {
        endpoints: ENDPOINTS
    },
});

const keyPair = await client.crypto.mnemonic_derive_sign_keys({
    phrase: auditor_seed
});
console.log(`Generated key pair:`);
console.log(keyPair);

const assetFactoryAddress = '0:05e30bf3eae57adf9f5b6e45d4f55ffbb0dbf6e9b8d7441a67167631ce2675eb'
const userWalletAdress = "0:8378231949d0945553926f0fd4798c48bcfb4343bea528b6f6383e6bd1b8e4ba"



async function receiveMsg (msg) {
    try {
        const { log, token_name, token_symbol, auditor } = JSON.parse(new TextDecoder().decode(msg.data))
        console.log(auditor)
        let convertedAddress = (await client.utils.convert_address({
            address: auditor,
            output_format: {
                type: "AccountId"
            },
        })).address;
        console.log(`Address in HEX format: ${convertedAddress}`)

        if (auditor === auditor_address_config) {
            let assets_to_mint = assets_calculation(log)
            console.log(assets_to_mint)
            mintAsset(assets_to_mint, auditor)
        }
      } catch (error) {
        console.error(error)
        return
      }
}

function assets_calculation(log) {
    /** 
     * Check log and calculate assets to mint
     * TO DO: calculation
     */
    const total_assets = 5
    return total_assets
}

async function mintAsset(amount, auditor_address) {
    const deployRootParams = {
        send_events: false,
        message_encode_params: {
            address: assetFactoryAddress,
            abi: {
                type: 'Contract',
                value: AssetFactory.abi,
            },
            call_set: {
                function_name: 'deployRoot',
                input: {
                    answerId: 0,
                    name: "TestAsset",
                    symbol: "TST",
                    decimals: 9,
                    owner: auditor_address,
                    initialSupplyTo: userWalletAdress,
                    initialSupply: amount * 10 ** 9,
                    deployWalletValue: new BigNumber(0.2).shiftedBy(9).toFixed(0),
                    mintDisabled: false,
                    burnByRootDisabled: false,
                    burnPaused: false,
                    remainingGasTo: auditor_address,
                    upgradeable: false
                },
            },
            signer: signerKeys(keyPair),
        },
    };
    console.log(`Minting ${amount} tokens`);
    // Call `sendValue` function
    try {
        const response = await client.processing.process_message(deployRootParams);
        console.log(response.transaction);
    } catch(error) {
        console.log(error)
        console.log(error.data)
    }

    // return response.transaction.lt;
}


await ipfs.pubsub.subscribe(ipfs_topic, receiveMsg)
