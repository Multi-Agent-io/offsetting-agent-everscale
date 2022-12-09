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
        endpoints: ENDPOINTS,
        message_processing_timeout: 360000
    },
});

const auditorKeyPair = await client.crypto.mnemonic_derive_sign_keys({
    phrase: auditor_seed
});
const assetFactoryAddress = '0:05e30bf3eae57adf9f5b6e45d4f55ffbb0dbf6e9b8d7441a67167631ce2675eb'
const userWalletAdress = "0:8378231949d0945553926f0fd4798c48bcfb4343bea528b6f6383e6bd1b8e4ba"


async function receiveMsg (msg) {
    try {
        const { log, token_name, token_symbol, auditor } = JSON.parse(new TextDecoder().decode(msg.data))
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
    const paramsOfEncodeInternalMessage = {
            address: assetFactoryAddress,
            value: new BigNumber(4).shiftedBy(9).toFixed(0),
            src_address: auditor_address,
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
                    initialSupplyTo: auditor_address,
                    initialSupply: amount * 10 ** 9,
                    deployWalletValue: new BigNumber(0.2).shiftedBy(9).toFixed(0),
                    mintDisabled: false,
                    burnByRootDisabled: false,
                    burnPaused: false,
                    remainingGasTo: auditor_address,
                    upgradeable: false
                },
            },
    };
    console.log(`Minting ${amount} tokens`);
    try {   
        const internalMessage = await client.abi.encode_internal_message(paramsOfEncodeInternalMessage)
        const paramsOfSendMessage = {
            message: internalMessage.message,
            abi: {
                type: 'Contract',
                value: AssetFactory.abi,
            },
            send_events: false
        }
        const resultOfSendMessage = await client.processing.send_message(paramsOfSendMessage)
        const paramsOfWaitForTransaction = {
            message: internalMessage.message,
            abi: {
                type: 'Contract',
                value: AssetFactory.abi,
            },
            send_events: false,
            shard_block_id: resultOfSendMessage.shard_block_id,
            sending_endpoints: resultOfSendMessage.sending_endpoints
        }
        const result = await client.processing.wait_for_transaction(paramsOfWaitForTransaction)
        console.log(result)
    } catch(error) {
        console.log(error)
        console.log(error.data)
    }

    // return response.transaction.lt;
}


await ipfs.pubsub.subscribe(ipfs_topic, receiveMsg)