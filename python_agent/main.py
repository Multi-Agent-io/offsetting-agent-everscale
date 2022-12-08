"""
This agant subscribes to ipfs topic and catches incoming messages for the certain address (auditor). Then it checks log in the message and calculates assets to mint.
"""
import json
import sys
import typing as tp
import logging
import base64
import argparse
import time
import ipfshttpclient
from ipfshttpclient.exceptions import ConnectionError

logger = logging.getLogger(__name__)
logger.propagate = False
handler = logging.StreamHandler(sys.stdout)
logger.addHandler(handler)
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.setLevel(logging.INFO)


class Agent:
    def __init__(self, path: str = "./config/config.json") -> None:
        try:
            with open(path) as f:
                content = f.read()
                self.config = json.loads(content)
                logger.debug(f"Configuration dict: {content}")

        except Exception as e:
            while True:
                logger.error("Configuration file is broken or not readable!")
                logger.error(e)
                time.sleep(5)
        endpoint: str = self.config["ipfs_provider"]
        try:
            self.ipfs_client = ipfshttpclient.connect(endpoint, session=True)
        except ConnectionError:
            logger.error("Could not connect to ipfs. Is the daemon running?")
        except Exception as e:
            logger.error(f"Could not connect to ipfs: {e}")
        self.ipfs_subscriber()

    def ipfs_subscriber(self) -> None:
        with self.ipfs_client.pubsub.subscribe(self.config["ipfs_topic"]) as sub:
            for msg in sub:
                message = base64.b64decode(msg["data"]).decode("UTF-8")
                logger.debug(f"Catch new message: {message}")
                json_msg = json.loads(message)
                if json_msg["auditor"] == self.config["auditor_address"]:
                    logger.info(f"Got message for me: {json_msg}")
                    assets_to_mint = self.assets_calculation(json_msg["log"])
                    token_name = json_msg["token_name"]
                    token_symbol = json_msg["token_symbol"]
                    logger.info(
                        f"Report: to mint: {assets_to_mint}, token name: {token_name}, token symbol: {token_symbol}"
                    )

    def assets_calculation(self, log: str) -> float:
        """
        Check log and calculate assets to mint
        """
        # TO DO: calculation
        total_assets = 5
        return total_assets


def run() -> None:
    parser = argparse.ArgumentParser(description="Add config path")
    parser.add_argument("config_path", type=str, help="config path")
    args = parser.parse_args()
    Agent(args.config_path).ipfs_subscriber()


if __name__ == "__main__":
    run()
