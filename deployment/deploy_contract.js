const Web3 = require('web3')
const utils = require('web3-utils')
const fetch = require('node-fetch')
const Tx = require('ethereumjs-tx')

async function deployContract(contractJson, args, from, nonce, rpcUrl, gasPrice, gasLimit, deploymentPrivateKey) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  const options = {
    from,
    gasPrice
  }
  const contract = new web3.eth.Contract(contractJson.abi, options)
  const deploy_data = await contract.deploy({
    data: contractJson.bytecode,
    arguments: args
  }).encodeABI()
  
  const tx = await sendRawTx(
    deploy_data,
    utils.toHex(nonce),
    null,
    deploymentPrivateKey,
    rpcUrl,
    gasPrice,
    gasLimit
  )
  if (tx.status !== '0x1') {
    throw new Error('Tx failed');
  }

  return tx.contractAddress;
}

async function sendRawTx(data, nonceHex, to, privateKey, url, gasPrice, gasLimit) {
  try {
    const rawTx = {
      nonce: nonceHex,
      gasPrice: utils.toHex(gasPrice),
      gasLimit: utils.toHex(gasLimit),
      to,
      data
    };

    const tx = new Tx(rawTx);
    tx.sign(privateKey);

    const txHash = await sendNodeRequest(url, 'eth_sendRawTransaction', `0x${tx.serialize().toString('hex')}`);
    const receipt = await getReceipt(txHash, url);
    return receipt;
  } catch (err) {
    console.log(`Can not send raw tx. ${err.toString()}. Exception will thrown.`)
    throw new Error(err)
  }
}
  
async function sendNodeRequest(url, method, signedData) {
  const request = await fetch(url, {
    headers: {
      'Content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params: [signedData],
      id: 1
    })
  });

  const responce = await request.json();
  if (responce.result === undefined) {
    throw new Error(`${JSON.stringify(responce.error)}`)
  }
  if (method === 'eth_sendRawTransaction' && responce.result.length != 66) {
    throw new Error(`Tx wasn't sent ${JSON.stringify(responce)}`);
  }
  
  return responce.result;
}
  
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
  
async function getReceipt(txHash, url) {
  await timeout(3000);
  let receipt = await sendNodeRequest(url, 'eth_getTransactionReceipt', txHash);
  if (receipt === null || !receipt.blockNumber) {
    receipt = await getReceipt(txHash, url);
  }

  return receipt;
}

module.exports = {
  deployContract
};