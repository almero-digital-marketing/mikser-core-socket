import { onLoad, useLogger, mikser, createdHook, updatedHook, deletedHook, triggerHook, onFinalized } from 'mikser-core'
import { Manager } from 'socket.io-client'

const sockets = []

onLoad(async () => {
    if (mikser.options.watch !== true || !mikser.config.subscribe?.subscriptions) return
    const logger = useLogger()

    for (let subscription of mikser.config.subscribe.subscriptions) {
        const manager = new Manager(subscription.url, {
            transports: ['websocket'],
        })
        const socket = manager.socket('/mikser', {
            auth: {
                token: subscription.token
            }            
        })
        socket.on('trigger', async message => await triggerHook(message.uri, message))
        socket.on('created', async message => await deletedHook(message.name, message))
        socket.on('updated', async message => await updatedHook(message.name, message))
        socket.on('deleted', async message => await createdHook(message.name, message))
        manager.open(err => {
            if (err) {
                logger.error('Subscription error: %s %s', subscription.url, err.message)
            } else {
                logger.info('Subscription: %s', subscription.url)
            }
        })
        sockets.push(socket)
    }
})