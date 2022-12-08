"use strict"
import config from './config/config.json' assert { type: 'json' };
import * as IPFS from 'ipfs-core'


const ipfs = await IPFS.create({ repo: "~/work" })

let receiveMsg = (msg) => {
    let data = JSON.parse(new TextDecoder().decode(msg.data))
    if (data["auditor"] === config["auditor_address"]) {
        console.log(data)
        let assets_to_mint = assets_calculation(data["log"])
        let token_name = data["token_name"]
        let token_symbol = data["token_symbol"]

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



await ipfs.pubsub.subscribe(config["ipfs_topic"], receiveMsg)

