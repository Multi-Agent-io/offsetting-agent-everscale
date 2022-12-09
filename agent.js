import BigNumber from 'bignumber.js';
import * as IPFS from 'ipfs-core';
import { TonClient } from '@eversdk/core';
import { libNode } from '@eversdk/lib-node';
import { config } from './config/config.js';
import { AssetFactory } from './contracts/AssetFactory.js';

const ipfs = await IPFS.create({ repo: 'ipfs' });
const ENDPOINTS = ['https://devnet-sandbox.evercloud.dev/graphql'];
const { ipfsTopic, auditorAddressConfig, auditorSeed } = config;

TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
  network: {
    endpoints: ENDPOINTS,
    message_processing_timeout: 80000,
    wait_for_timeout: 80000,
  },
});

// eslint-disable-next-line no-unused-vars
const auditorKeyPair = await client.crypto.mnemonic_derive_sign_keys({
  phrase: auditorSeed,
});
const assetFactoryAddress = '0:05e30bf3eae57adf9f5b6e45d4f55ffbb0dbf6e9b8d7441a67167631ce2675eb';
const userWalletAdress = '0:8378231949d0945553926f0fd4798c48bcfb4343bea528b6f6383e6bd1b8e4ba';

function assetsCalculation(log) {
  /**
       * Check log and calculate assets to mint
       * TO DO: calculation
       */
  const totalAssets = 5;
  return totalAssets;
}

async function mintAsset(amount, auditorAddress) {
  const paramsOfEncodeInternalMessage = {
    address: assetFactoryAddress,
    value: new BigNumber(4).shiftedBy(9).toFixed(0),
    src_address: auditorAddress,
    abi: {
      type: 'Contract',
      value: AssetFactory.abi,
    },
    call_set: {
      function_name: 'deployRoot',
      input: {
        answerId: 0,
        name: 'TestAsset',
        symbol: 'TST',
        decimals: 9,
        owner: auditorAddress,
        initialSupplyTo: userWalletAdress,
        initialSupply: amount * 10 ** 9,
        deployWalletValue: new BigNumber(0.2).shiftedBy(9).toFixed(0),
        mintDisabled: false,
        burnByRootDisabled: false,
        burnPaused: false,
        remainingGasTo: auditorAddress,
        upgradeable: false,
      },
    },
  };
  console.log(`Minting ${amount} tokens`);
  try {
    const internalMessage = await client.abi.encode_internal_message(paramsOfEncodeInternalMessage);
    const paramsOfSendMessage = {
      message: internalMessage.message,
      abi: {
        type: 'Contract',
        value: AssetFactory.abi,
      },
      send_events: false,
    };
    const resultOfSendMessage = await client.processing.send_message(paramsOfSendMessage);
    const paramsOfWaitForTransaction = {
      message: internalMessage.message,
      abi: {
        type: 'Contract',
        value: AssetFactory.abi,
      },
      send_events: false,
      shard_block_id: resultOfSendMessage.shard_block_id,
      sending_endpoints: resultOfSendMessage.sending_endpoints,
    };
    const result = await client.processing.wait_for_transaction(paramsOfWaitForTransaction);
    console.log(result);
  } catch (error) {
    console.log(error);
    console.log(error.data);
  }
  // return response.transaction.lt;
}

async function receiveMsg(msg) {
  try {
    // eslint-disable-next-line no-unused-vars
    const { log, tokenName, tokenSymbol, auditor } = JSON.parse(new TextDecoder().decode(msg.data));
    if (auditor === auditorAddressConfig) {
      const assetsToMint = assetsCalculation(log);
      mintAsset(assetsToMint, auditor);
    }
  } catch (error) {
    console.error(error);
    return;
  }
}

await ipfs.pubsub.subscribe(ipfsTopic, receiveMsg);

// for testing
const msg = new TextEncoder().encode('{"auditor": "0:22d976b931c4686dc1eba73bf72dfb618bdf869b5bac77c0025af7917a3571db", "log": "Qm", "tokenName": "TEST", "tokenSymbol": "TESTSymbol"}');
await ipfs.pubsub.publish(ipfsTopic, msg);
