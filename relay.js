import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayServer, circuitRelayTransport } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { floodsub } from '@libp2p/floodsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { bootstrap } from '@libp2p/bootstrap'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { rid } from './rid.js';

async function main () {
  const node = await createLibp2p({
    peerId: await createFromJSON(rid),
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/5040/ws'],
      announce: ['/dns4/auto-relay.smoothly.money/tcp/443/wss/']
    },
    transports: [
      webSockets(),
      circuitRelayTransport()
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux({
        maxMessageSize: 1 << 20 // 1 MB
      })
    ],
    services: {
      identify: identifyService(),
      relay: circuitRelayServer({
        reservations: {
          defaultDataLimit: BigInt(1 << 20), // the default maximum number of bytes that can be transferred over a relayed connection
        }
      }),
      pubsub: floodsub() 
    },
    peerDiscovery: [
      pubsubPeerDiscovery({
        interval: 1000
      })	
    ]
  })

  node.services.pubsub.subscribe('checkpoint');
  console.log(`Node started with id ${node.peerId.toString()}`)
  console.log('Listening on:')
  node.getMultiaddrs().forEach((ma) => console.log(ma.toString()))
}

main()
