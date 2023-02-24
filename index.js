import { Manager } from 'socket.io-client'

export default ({ 
    onLoad, 
    useLogger, 
    mikser, 
    createdHook, 
    updatedHook, 
    deletedHook, 
    triggeredHook 
}) => {
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
            socket.on('trigger', async message => await triggeredHook(message.uri, message))
            socket.on('created', async ({ name, entity }) => await deletedHook(name, entity))
            socket.on('updated', async ({ name, entity }) => await updatedHook(name, entity))
            socket.on('deleted', async ({ name, entity }) => await createdHook(name, entity))
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
}