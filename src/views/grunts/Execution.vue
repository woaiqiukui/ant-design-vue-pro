<template>
  <div class="home-container">
    <a-card class="control-card">
      <a-space>
        <a-button type="primary" @click="createConnection" :loading="isConnecting" :disabled="isConnecting || client.connected">连接</a-button>
        <a-button type="danger" @click="destroyConnection" :disabled="!client.connected">断开连接</a-button>
      </a-space>
    </a-card>
    <a-card class="chat-card">
      <div class="messages">
        <div v-for="(msg, index) in messages" :key="index" class="message" :class="{ 'is-user': msg.isUser }">
          <div v-if="msg.isUser" class="message-content user-message">{{ msg.text }}</div>
          <div v-else class="message-content mqtt-message">{{ msg.text }}</div>
        </div>
      </div>
      <div class="message-input">
        <a-input v-model="newMessage" @keypress.enter="sendNewMessage" placeholder="输入消息..."></a-input>
      </div>
    </a-card>
  </div>
</template>

<script>
import mqtt from 'mqtt'

export default {
  name: 'Execution',
  props: {
    mqttChannel: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      isConnecting: false,
      connection: {
        broker: this.mqttChannel.broker,
        topic: this.mqttChannel.topic,
        // for more options, please refer to https://github.com/mqttjs/MQTT.js#mqttclientstreambuilder-options
        clean: true,
        connectTimeout: 30 * 1000, // ms
        reconnectPeriod: 4000, // ms
        clientId: this.mqttChannel.client_id,
        // auth
        username: this.mqttChannel.username,
        password: this.mqttChannel.password
      },
      subscription: {
        topic: this.mqttChannel.command_receive_topic,
        qos: this.mqttChannel.qos
      },
      publish: {
        topic: this.mqttChannel.command_send_topic,
        qos: this.mqttChannel.qos,
        payload: '{ "msg": "Hello, I am browser." }'
      },
      receiveNews: '',
      qosList: [0, 1, 2],
      client: {
        connected: false
      },
      subscribeSuccess: false,
      connecting: false,
      retryTimes: 0,
      messages: []
    }
  },
  methods: {
    initData () {
      this.client = {
        connected: false
      }
      this.retryTimes = 0
      this.connecting = false
      this.subscribeSuccess = false
    },
    handleOnReConnect () {
      this.retryTimes += 1
      if (this.retryTimes > 5) {
        try {
          this.client.end()
          this.initData()
          this.$message.error('Connection maxReconnectTimes limit, stop retry')
        } catch (error) {
          this.$message.error(error.toString())
        }
      }
    },
    createConnection () {
      this.isConnecting = true
      try {
        // 假设的连接逻辑...
        const connectUrl = `${this.connection.broker}`
        const { broker, topic, ...options } = this.connection
        this.client = mqtt.connect(connectUrl, options)
        this.client.on('connect', () => {
          this.isConnecting = false
          this.client.connected = true
          console.log('Connection succeeded!')
        })
        this.client.on('error', (error) => {
          this.isConnecting = false
          console.log('Connection failed', error)
        })
      } catch (error) {
        this.isConnecting = false
        console.log('mqtt.connect error', error)
      }
    },
    // subscribe topic
    // https://github.com/mqttjs/MQTT.js#mqttclientsubscribetopictopic-arraytopic-object-options-callback
    doSubscribe () {
      const { topic, qos } = this.subscription
      this.client.subscribe(topic, { qos }, (error, res) => {
        if (error) {
          console.log('Subscribe to topics error', error)
          return
        }
        this.subscribeSuccess = true
        console.log('Subscribe to topics res', res)
      })
    },
    // unsubscribe topic
    // https://github.com/mqttjs/MQTT.js#mqttclientunsubscribetopictopic-array-options-callback
    doUnSubscribe () {
      const { topic } = this.subscription
      this.client.unsubscribe(topic, error => {
        if (error) {
          console.log('Unsubscribe error', error)
        }
      })
    },
    // publish message
    // https://github.com/mqttjs/MQTT.js#mqttclientpublishtopic-message-options-callback
    doPublish () {
      const { topic, qos, payload } = this.publish
      this.client.publish(topic, payload, { qos }, error => {
        if (error) {
          console.log('Publish error', error)
        }
      })
    },
    // disconnect
    // https://github.com/mqttjs/MQTT.js#mqttclientendforce-options-callback
    destroyConnection () {
      if (this.client.connected) {
        try {
          this.client.end(false, () => {
            this.initData()
            console.log('Successfully disconnected!')
          })
        } catch (error) {
          console.log('Disconnect failed', error.toString())
        }
      }
    }
  }
}
</script>

<style scoped>
.messages {
  height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse;
}

.message {
  display: flex;
  justify-content: flex-start;
}

.message-content {
  max-width: 60%;
  padding: 5px 10px;
  margin: 5px;
  border-radius: 15px;
}

.user-message {
  background-color: #d3f261;
  margin-left: auto;
}

.mqtt-message {
  background-color: #69c0ff;
}

.message-input {
  margin-top: 20px;
}
</style>
