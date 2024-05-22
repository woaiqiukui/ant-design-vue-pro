<template>
  <div class="home-container">
    <a-card class="control-card">
      <a-space>
        <a-button type="primary" @click="createConnection" :loading="isConnecting" :disabled="isConnecting || client.connected || !isMqttActive">连接至WebSocket通道</a-button>
        <a-button type="danger" @click="destroyConnection" :disabled="!client.connected">断开连接</a-button>
        <a-button type="default" @click="doSubscribe" :disabled="!client.connected || subscribeSuccess">订阅</a-button>
        <a-button type="warning" @click="doUnSubscribe" :disabled="!client.connected || !subscribeSuccess">取消订阅</a-button>
      </a-space>
    </a-card>
    <a-card class="chat-card">
      <div class="messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" class="message" :class="{ 'is-user': msg.isUser }">
          <div class="message-time">{{ msg.timestamp }}</div>
          <div v-if="msg.isUser" class="message-content user-message">{{ msg.text }}</div>
          <div v-else class="message-content mqtt-message">{{ msg.text }}</div>
        </div>
      </div>
      <div class="message-input">
        <a-input v-model="newMessage" placeholder="输入消息..." style="width: 80%"></a-input>
        <a-button @click="sendNewMessage" type="primary" :disabled="!isMqttActive">发送</a-button>
      </div>
    </a-card>
  </div>
</template>

<script>
import mqtt from 'mqtt'
import { getHistoryMessagesByClientId } from '@/api/mqtt_channel'

export default {
  name: 'Execution',
  props: {
    mqttChannel: {
      type: Object,
      required: true
    },
    isMqttActive: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      isConnecting: false,
      connection: {
        broker: `${this.mqttChannel.emqx_broker_protocol}://${this.mqttChannel.emqx_broker_host}:${this.mqttChannel.emqx_broker_port}`,
        websocket_url: `${this.mqttChannel.ws_broker_protocol}://${this.mqttChannel.ws_broker_host}:${this.mqttChannel.ws_broker_port}`,
        // for more options, please refer to https://github.com/mqttjs/MQTT.js#mqttclientstreambuilder-options
        clean: this.mqttChannel.clean_start,
        connectTimeout: this.mqttChannel.connect_timeout, // ms
        reconnectPeriod: 1, // ms
        clientId: '',
        // auth
        username: this.mqttChannel.username,
        password: this.mqttChannel.password
      },
      subscription: {
        topic: this.mqttChannel.result_send_topic,
        qos: this.mqttChannel.subscribe_qos
      },
      publish: {
        topic: this.mqttChannel.command_receive_topic,
        qos: this.mqttChannel.publish_qos
      },
      receiveNews: '',
      qosList: [0, 1, 2],
      client: {
        connected: false
      },
      subscribeSuccess: false,
      connecting: false,
      retryTimes: 0,
      newMessage: '', // 绑定到输入框的新消息
      messages: [] // 存储历史消息的数组
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
      if (!this.isMqttActive) {
        // 显示提示消息并退出方法
        this.$message.error('Grunt已离线，通道已关闭')
        return
      }
      this.isConnecting = true
      try {
        // 假设的连接逻辑...
        const connectUrl = `${this.connection.websocket_url}/mqtt`
        // eslint-disable-next-line camelcase
        const { broker, topic, websocket_url, ...options } = this.connection
        this.client = mqtt.connect(connectUrl, options)
        this.client.on('connect', () => {
          this.isConnecting = false
          this.client.connected = true
          console.log('Connection succeeded!')
          this.doSubscribe()
        })
        this.client.on('error', (error) => {
          this.isConnecting = false
          console.log('Connection failed', error)
        })
        this.client.on('message', (topic, message) => {
          const msg = message.toString()
          this.messages.push({
            text: msg,
            isUser: false, // 标记为接收到的消息
            timestamp: new Date().toLocaleTimeString()
          })
        })
      } catch (error) {
        this.isConnecting = false
        console.log('mqtt.connect error', error)
      }
    },
    // subscribe topic
    // https://github.com/mqttjs/MQTT.js#mqttclientsubscribetopictopic-arraytopic-object-options-callback
    doSubscribe () {
      if (!this.client.connected) {
          this.$message.error('Client not connected, cannot publish.')
          return
        }

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
    doPublish (payload) {
      const { topic, qos } = this.publish
      console.log('doPublish', topic, payload, qos)
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
    },
    sendNewMessage () {
      if (!this.newMessage.trim()) return
      const message = {
        text: this.newMessage,
        isUser: true, // 标记为用户消息
        timestamp: new Date().toLocaleTimeString()
      }
      this.messages.push(message)
      // MQTT 发布消息
      this.doPublish(this.newMessage)

      // 清空输入框
      this.newMessage = ''
    },
    generateClientId (length = 10) {
      // 生成长度为length的随机字符串
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const charactersLength = characters.length
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
    },
    async fetchAndProcessHistoryMessages () {
      try {
        console.log('fetchAndProcessHistoryMessages', this.mqttChannel.client_id)
        const historyMessages = await getHistoryMessagesByClientId(this.mqttChannel.client_id)
        historyMessages.forEach((msg) => {
          const isUserMessage = msg.client_id === this.mqttChannel.client_id // 假设 this.connection.clientId 存储了当前客户端的ID
          const formattedMessage = {
            text: msg.payload.replace(/^"|"$/g, ''), // 将换行符转换为实际的换行
            isUser: !isUserMessage,
            timestamp: new Date(msg.publish_received_at).toLocaleTimeString()
          }
          this.messages.push(formattedMessage)
        })
      } catch (error) {
        console.error('Error fetching history messages:', error)
        this.$message.error('Failed to load history messages.')
      }
    }
  },
  updated () {
    const messagesContainer = this.$refs.messagesContainer
    if (messagesContainer) {
      // 将滚动条位置设置到容器的底部
      // 这样最新的消息就会滚动到可视区域内
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  },
  created () {
    this.clientId = this.generateClientId()
    this.fetchAndProcessHistoryMessages()
  },
  mounted () {
    if (this.isMqttActive) { // 判断isMqttActive是否为true
      this.createConnection()
    }
  }
}
</script>

<style scoped>
.message-time {
  font-size: 0.75rem; /* 设置较小的字体大小 */
  color: #888; /* 较淡的字体颜色，使其不那么显眼 */
  margin-bottom: 4px; /* 在时间戳和消息内容之间添加一些间隙 */
}

.message-content {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px; /* 在消息之间添加一些间隙 */
  display: inline-block;
  max-width: 80%; /* 限制消息内容的最大宽度 */
  background-color: #69c0ff; /* 默认背景色 */
  color: white; /* 默认文字颜色 */
  word-wrap: break-word; /* 确保长单词或URL不会溢出容器 */
}

.user-message {
  background-color: #d3f261; /* 用户消息的背景颜色 */
  color: black; /* 用户消息的字体颜色 */
  text-align: right; /* 文字内容向右对齐 */
}

.message {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.message.is-user .message-time {
  text-align: right; /* 用户消息的时间靠右对齐 */
}

.message:not(.is-user) .message-time {
  text-align: left; /* 其他消息的时间靠左对齐 */
}

.message.is-user .message-content {
  margin-left: auto; /* 用户消息气泡靠右 */
  background-color: #d3f261; /* 重新指定用户消息的背景颜色 */
}

.message:not(.is-user) .message-content {
  margin-right: auto; /* 非用户消息气泡靠左 */
  background-color: #69c0ff; /* 重新指定非用户消息的背景颜色 */
}

.messages {
  height: 300px; /* 设置一个固定的高度 */
  overflow-y: auto; /* 超出部分滚动 */
  display: flex;
  flex-direction: column;
  padding: 10px; /* 在消息框内部添加一些内边距 */
}

.message-input {
  display: flex; /* 使输入框和发送按钮并排显示 */
  margin-top: 20px; /* 在输入区域和消息列表之间添加一些间隙 */
}

.message-input > .a-input {
  flex-grow: 1; /* 输入框占据大部分空间 */
}

.message-input > .a-button {
  margin-left: 10px; /* 在发送按钮和输入框之间添加一些间隙 */
}
</style>
