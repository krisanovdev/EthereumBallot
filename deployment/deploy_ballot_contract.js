const deployContract = require('./deploy_contract.js').deployContract
const ballotContract = require('../build/contracts/Ballot.json')
const {
  DEPLOYER_ADDRESS,
  DEPLOYER_PRIVATE_KEY,
  NETWORK_RPC_URL
} = process.env

async function deployElections() {
  const args = []
  const from = DEPLOYER_ADDRESS
  const nonce = 0
  const ganacheUrl = NETWORK_RPC_URL
  const gasPrice = 20
  const gasLimit = 800000
  const privateKey = Buffer.from(DEPLOYER_PRIVATE_KEY.substr(2), 'hex')
  const address = await deployContract(
    ballotContract,
    args,
    from,
    nonce,
    ganacheUrl,
    gasPrice,
    gasLimit,
    privateKey
  )

  console.log(`Deployed ${address}`)
}

deployElections().catch(console.error)
