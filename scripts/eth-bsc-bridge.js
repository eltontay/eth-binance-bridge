const Web3 = require('web3');
const BridgeEth = require('../build/contracts/BridgeEth.json');
const BridgeBsc = require('../build/contracts/BridgeBsc.json');

//public testnet for eth and bsc 
const web3Eth = new Web3('wss://rinkeby.infura.io/ws/v3/08405097660d440997b9a242ef6c042d');  
const web3Bsc = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');

//ERC20 wallet private key
const adminPrivKey = '';
const { address: admin } = web3Bsc.eth.accounts.wallet.add(adminPrivKey);

//new contract object for bridge on eth and bsc smart chains
const bridgeEth = new web3Eth.eth.Contract(
  BridgeEth.abi,
  BridgeEth.networks['4'].address
);
const bridgeBsc = new web3Bsc.eth.Contract(
  BridgeBsc.abi,
  BridgeBsc.networks['97'].address
);

//Listen for events 
bridgeEth.events.Transfer(
  {fromBlock: 0, step: 0} 
)
.on('data', async event => {
  const { from, to, amount, date, nonce } = event.returnValues;

  const tx = bridgeBsc.methods.mint(to, amount, nonce);
  const [gasPrice, gasCost] = await Promise.all([
    web3Bsc.eth.getGasPrice(),
    tx.estimateGas({from: admin}),
  ]);
  const data = tx.encodeABI();
  const txData = {
    from: admin,
    to: bridgeBsc.options.address,
    data,
    gas: gasCost,
    gasPrice
  };
  const receipt = await web3Bsc.eth.sendTransaction(txData);
  console.log(`Transaction hash: ${receipt.transactionHash}`);
  console.log(`
    Processed transfer:
    - from ${from} 
    - to ${to} 
    - amount ${amount} tokens
    - date ${date}
  `);
});


