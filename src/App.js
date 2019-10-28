import React from 'react'


const WEB3_STATUS = {
  Loading: 'loading',
  NoWeb3: 'noweb3',
  Error: 'error',
  Locked: 'locked',
  ChangeAccount: 'changeaccount',
  Ready: 'ready'
}

const networkEther = [
  { key: 1, type: 'Mainnet' },
  { key: 2, type: 'Morden' },
  { key: 3, type: 'Ropsten' },
  { key: 4, type: 'Rinkeby' },
  { key: 42, type: 'Kovan' },
  { key: 5777, type: 'Private' }
]

class HomePage extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      web3Wallet: {}
    }
  }

  componentDidMount() {
    this.intervalId = setInterval(() => {
      this.refreshWeb3()
    }, 1000)
    this.onEnableMetaMask()
  }
  componentWillUnmount(){
    clearInterval(this.intervalId);
  }


  onEnableMetaMask = async (callback = null) => {
    const { web3Wallet } = this.state

    const checkMetaMask = () => {
      return new Promise(async (resolve, reject) => {
        const { web3Wallet } = this.state

        let newStatus = Object.assign({}, web3Wallet)
        try {
          if (typeof window.web3 === 'undefined') {
            if (web3Wallet.status === WEB3_STATUS.Loading) {
              newStatus.status = WEB3_STATUS.NoWeb3
              newStatus.network = 0
              resolve(newStatus)
            } else if (newStatus.status !== WEB3_STATUS.NoWeb3) {
              newStatus.status = WEB3_STATUS.Error
              newStatus.network = 0
              resolve(newStatus)
            }
          } else {
            // Get metamask ether network
            let p1 = new Promise((resolve, reject) => {
              try {
                window.web3.version.getNetwork((err, network) => {
                  if (err) return reject(err)
                  return resolve(network)
                })
              } catch (e) {
                return reject(e)
              }
            })
            // Close p1 promise if over time
            let p2 = new Promise(function (resolve, reject) {
              setTimeout(() => {
                return reject(new Error('request timeout'))
              }, 450)
            })

            Promise.race([p1, p2]).then((networkNew) => {
              const networkParse = parseInt(networkNew)
              const web3 = window.web3
              const findNetwork = networkEther.find(itm => itm.key === networkParse)

              let network = (findNetwork ? findNetwork.key : 'Unknown')

              // Enable open metamask when closed
              const enableMetaMask = () => {
                web3.currentProvider && web3.currentProvider.enable().then(function (accounts) {
                  newStatus.status = WEB3_STATUS.Ready
                  newStatus.network = network
                  newStatus.account = accounts[0].toLowerCase()
                  resolve(newStatus)
                  callback && callback()
                  // window.location.reload(true)
                }).catch(() => {
                  newStatus.status = WEB3_STATUS.Error
                  newStatus.network = network
                  resolve(newStatus)
                })
              }

              web3.eth.getAccounts((err, accounts) => {
                if (err) {
                  newStatus.status = WEB3_STATUS.Error
                  newStatus.network = network
                  resolve(newStatus)
                } else {
                  if (!accounts || accounts.length <= 0) {
                    enableMetaMask()
                  }
                }
              })
            }).catch((e) => {
              newStatus.status = WEB3_STATUS.Locked
              newStatus.network = 0
              resolve(newStatus)
            })
          }
        } catch (e) {
          newStatus.status = WEB3_STATUS.Error
          newStatus.network = 0
          resolve(newStatus)
        }
      })
    }

    const newMetamaskStatus = await checkMetaMask()

    if (((newMetamaskStatus && newMetamaskStatus.status) !== web3Wallet.status)) {
      this.setState({ web3Wallet: newMetamaskStatus })
    }
  }


  refreshWeb3 = async () => {
    clearInterval(this.intervalId);
    const { web3Wallet } = this.state

    const checkMetaMask = () => {

      return new Promise(async (resolve, reject) => {
        const { web3Wallet } = this.state
        const isShowLog = false
        const showLogStatus = (message) => {
          isShowLog && console.log(message)
        }

        let newStatus = Object.assign({}, web3Wallet)
        try {
          if (typeof window.web3 === 'undefined') {
            if (web3Wallet.status === WEB3_STATUS.Loading) {
              showLogStatus('No web3 detected')
              newStatus.status = WEB3_STATUS.NoWeb3
              newStatus.network = 0
              resolve(newStatus)
            } else if (newStatus.status !== WEB3_STATUS.NoWeb3) {
              showLogStatus('Lost web3')
              window.location.reload(true)
              newStatus.status = WEB3_STATUS.Error
              newStatus.network = 0
              resolve(newStatus)
            }
          } else {
            showLogStatus('web3 detected')

            // Get ether network
            let p1 = new Promise((resolve, reject) => {
              try {
                window.web3.version.getNetwork((err, network) => {
                  if (err) return reject(err)
                  return resolve(network)
                })
              } catch (e) {
                showLogStatus('Get netWork error' + e)
                return reject(e)
              }
            })
            // Close p1 promise if over time
            let p2 = new Promise(function (resolve, reject) {
              setTimeout(() => {
                return reject(new Error('request timeout'))
              }, 450)
              // return resolve()
            })

            Promise.race([p1, p2]).then((networkNew) => {
              const networkParse = parseInt(networkNew)
              const web3 = window.web3
              const findNetwork = networkEther.find(itm => itm.key === networkParse)

              showLogStatus('web3 network is ' + (findNetwork ? findNetwork.type : 'Unknown'))

              let network = (findNetwork ? findNetwork.key : 'Unknown')

              web3.eth.getAccounts((err, accounts) => {
                showLogStatus('Ethereum Account detected' + accounts)
                if (accounts && newStatus.account && newStatus.account !== accounts[0]) {
                  // Clear data and reload page when change new account in here
                  newStatus.status = WEB3_STATUS.ChangeAccount
                  newStatus.network = network
                  window.location.reload(true)
                  resolve(newStatus)
                }
                if (err) {
                  newStatus.status = WEB3_STATUS.Error
                  newStatus.network = network
                  resolve(newStatus)
                } else if (accounts && accounts.length > 0) {
                  newStatus.status = WEB3_STATUS.Ready
                  newStatus.network = network
                  newStatus.account = accounts[0].toLowerCase()
                  resolve(newStatus)
                }
              })
            }).catch((e) => {
              showLogStatus('Check network error' + e)
              newStatus.status = WEB3_STATUS.Locked
              newStatus.network = 0
              resolve(newStatus)
            })
          }
        } catch (e) {
          newStatus.status = WEB3_STATUS.Error
          newStatus.network = 0
          resolve(newStatus)
        }
      })
    }

    const newWeb3Status = await checkMetaMask()

    // Need to get signed in here
    if (((newWeb3Status && newWeb3Status.status) !== web3Wallet.status)) {
      this.setState({ web3Wallet: newWeb3Status })
    }
  }

  render() {
    const { web3Wallet } = this.state
    return (
      <div>
        <h1>{'HB DApps Hackathon 2019'}</h1>
      <div>{'Your address: ' + ((web3Wallet && web3Wallet.account) ? web3Wallet.account : '...')}</div>
        <div>{'Your network: ' + ((web3Wallet && web3Wallet.network) ? networkEther.find(itm => itm.key === web3Wallet.network).type  : '...')}</div>
      </div>
    )
  }
}
export default HomePage
