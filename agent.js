/* eslint-disable import/extensions */
import { Account } from '@eversdk/appkit';
import {
  TonClient,
  signerNone,
  MessageBodyType,
} from '@eversdk/core';
import { libNode } from '@eversdk/lib-node';
import BigNumber from 'bignumber.js';
import { Address } from 'everscale-inpage-provider';
import { ResponseType } from '@eversdk/core/dist/bin.js';
import * as IPFS from 'ipfs-core';

import { AssetFactoryContract } from './artifacts/AssetFactory.js';
import { EverwalletContract } from './artifacts/EverwalletContract.js';
import { config } from './config/config.js';

const ipfs = await IPFS.create({ repo: 'ipfs' });
const {
  ipfsTopic, auditorAddressConfig, auditorSeed, endpoint 
} = config;
let { assetFactoryAddress } = config;

TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
  network: {
    endpoints: [endpoint],
  },
});

// eslint-disable-next-line no-unused-vars
const auditorKeyPair = await client.crypto.mnemonic_derive_sign_keys({
  phrase: auditorSeed,
});
assetFactoryAddress = new Address(assetFactoryAddress);

const assetFactoryContract = new Account(AssetFactoryContract, {
  signer: signerNone(),
  client,
  initData: {},
});

function assetsCalculation(log) {
  /**
       * Check log and calculate assets to mint
       * TO DO: calculation
       */
  const totalAssets = 5;
  return totalAssets;
}

async function mintAsset(amount, auditor, tokenName, tokenSymbol, user) {
  console.log(`Minting ${amount} tokens for ${user}`);
  const auditorAddress = new Address(auditor)
  const userAddress = new Address(user)
  const inputDeployRoot = {
    answerId: 0,
    name: tokenName,
    symbol: tokenSymbol,
    decimals: 9,
    owner: auditorAddress,
    initialSupplyTo: userAddress,
    initialSupply: amount * 10 ** 9,
    deployWalletValue: new BigNumber(0.2).shiftedBy(9).toFixed(0),
    mintDisabled: false,
    burnByRootDisabled: false,
    burnPaused: false,
    remainingGasTo: auditorAddress,
    upgradeable: false,
  };

  const deployRootMessage = (await client.abi.encode_message_body({
    abi: assetFactoryContract.abi,
    call_set: {
      function_name: 'deployRoot',
      input: inputDeployRoot,
    },
    is_internal: true,
    signer: signerNone(),
  })).body;

  const messageParams = {
    send_events: false,
    message_encode_params: {
      address: auditorAddress,
      abi: {
        type: 'Contract',
        value: EverwalletContract.abi,
      },
      call_set: {
        function_name: 'sendTransaction',
        input: {
          dest: assetFactoryAddress,
          value: amount * 10 ** 9,
          bounce: true, // Send funds back on any error in desctination account
          flags: 1, // Pay delivery fee from the multisig balance, not from the value.
          payload: deployRootMessage,
        },
      },
      signer: {
        type: 'Keys',
        keys: auditorKeyPair,
      },
    },
  };

  const messageSubscription = await client.net.subscribe_collection({
    collection: 'messages',
    filter: {
      src: { eq: assetFactoryAddress },
      OR: {
        dst: { eq: assetFactoryAddress },
      },
    },
    result: 'boc msg_type id src dst',
  }, async (params, responseType) => {
    try {
      if (responseType === ResponseType.Custom) {
        const { boc } = params.result;
        const decoded = (await client.abi.decode_message({
          abi: assetFactoryContract.abi,
          message: boc,
        }));
        if (decoded.body_type === MessageBodyType.Event) {
          console.log(`${tokenName} Asset deployed at ${decoded.value.root}`);
        }
      }
    } catch (err) {}
  });

  const result = await client.processing.process_message(messageParams);
  await client.net.unsubscribe(messageSubscription);
}

async function receiveMsg(msg) {
  try {
    // eslint-disable-next-line no-unused-vars
    const { log, tokenName, tokenSymbol, auditor, user } = JSON.parse(new TextDecoder().decode(msg.data));
    if (auditor === auditorAddressConfig) {
      const assetsToMint = assetsCalculation(log);
      mintAsset(assetsToMint, auditor, tokenName, tokenSymbol, user);
    }
  } catch (error) {
    console.error(error);
    return;
  }
}

await ipfs.pubsub.subscribe(ipfsTopic, receiveMsg);
