<template>
  <div class="home-container">
    <a-card shadow="always" style="margin-bottom:30px;">
      <div class="emq-title">
        Configuration
      </div>
      <a-form ref="configForm" hide-required-asterisk size="small" laba-position="top" :model="connection">
        <a-row :gutter="20">
          <a-col :span="8">
            <a-form-item prop="host" label="Host">
              <a-row :gutter="10">
                <a-col :span="17">
                  <a-input v-model="connection.host"></a-input>
                </a-col>
              </a-row>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="port" label="Port">
              <a-input v-model.number="connection.port" type="number" placeholder="8083/8084"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="endpoint" label="Mountpoint">
              <a-input v-model="connection.endpoint" placeholder="/mqtt"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="clientId" label="Client ID">
              <a-input v-model="connection.clientId"> </a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="username" label="Username">
              <a-input v-model="connection.username"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="password" label="Password">
              <a-input v-model="connection.password"></a-input>
            </a-form-item>
          </a-col>

          <a-col :span="24">
            <a-button
              type="success"
              size="small"
              class="conn-btn"
              style="margin-right: 20px;"
              :disabled="client.connected"
              @click="createConnection"
              :loading="connecting"
            >
              {{ client.connected ? 'Connected' : 'Connect' }}
            </a-button>

            <a-button v-if="client.connected" type="danger" size="small" class="conn-btn" @click="destroyConnection">
              Disconnect
            </a-button>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
    <a-card shadow="always" style="margin-bottom:30px;">
      <div class="emq-title">
        Subscribe
      </div>
      <a-form ref="subscription" hide-required-asterisk size="small" laba-position="top" :model="subscription">
        <a-row :gutter="20">
          <a-col :span="8">
            <a-form-item prop="topic" label="Topic">
              <a-input v-model="subscription.topic"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="qos" label="QoS">
              <a-select v-model="subscription.qos">
                <a-option v-for="qos in qosList" :key="qos" :label="qos" :value="qos"></a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-button
              :disabled="!client.connected"
              type="success"
              size="small"
              class="subscribe-btn"
              @click="doSubscribe"
            >
              {{ subscribeSuccess ? 'Subscribed' : 'Subscribe' }}
            </a-button>
            <a-button
              :disabled="!client.connected"
              type="success"
              size="small"
              class="subscribe-btn"
              style="margin-left:20px"
              @click="doUnSubscribe"
              v-if="subscribeSuccess"
            >
              Unsubscribe
            </a-button>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
    <a-card shadow="always" style="margin-bottom:30px;">
      <div class="emq-title">
        Publish
      </div>
      <a-form ref="publish" hide-required-asterisk size="small" laba-position="top" :model="publish">
        <a-row :gutter="20">
          <a-col :span="8">
            <a-form-item prop="topic" label="Topic">
              <a-input v-model="publish.topic"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="payload" label="Payload">
              <a-input v-model="publish.payload"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item prop="qos" label="QoS">
              <a-select v-model="publish.qos">
                <a-option v-for="qos in qosList" :key="qos" :label="qos" :value="qos"></a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
      <a-col :span="24">
        <a-button :disabled="!client.connected" type="success" size="small" class="publish-btn" @click="doPublish">
          Publish
        </a-button>
      </a-col>
    </a-card>
    <a-card shadow="always" style="margin-bottom:30px;">
      <div class="emq-title">
        Receive
      </div>
      <a-col :span="24">
        <a-input type="textarea" :rows="3" style="margin-bottom: 15px" v-model="receiveNews" readOnly></a-input>
      </a-col>
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
      retryTimes: 0
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
      try {
        this.connecting = true
        const { broker, topic, ...options } = this.connection
        const connectUrl = `${broker}${topic}`
        this.client = mqtt.connect(connectUrl, options)
        if (this.client.on) {
          this.client.on('connect', () => {
            this.connecting = false
            console.log('Connection succeeded!')
          })
          this.client.on('reconnect', this.handleOnReConnect)
          this.client.on('error', error => {
            console.log('Connection failed', error)
          })
          this.client.on('message', (topic, message) => {
            this.receiveNews = this.receiveNews.concat(message)
            console.log(`Received message ${message} from topic ${topic}`)
          })
        }
      } catch (error) {
        this.connecting = false
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

<style lang="scss">
@import url('../../assets/style/home.scss');

.home-container {
  max-width: 1100px;
  margin: 0 auto;

  .conn-btn {
    color: #fff;
    background-color: #00b173;
    font-size: 14px;
  }

  .publish-btn {
    margin-bottom: 20px;
    float: right;
  }

  .a-button--success {
    background-color: #34c388 !important;
    border-color: #34c388 !important;
    font-size: 14px !important;
  }

  .a-button--danger {
    background-color: #f5222d !important;
    border-color: #f5222d !important;
  }

  .a-form-item {
    &.is-error {
      .a-input__inner,
      .a-textarea__inner {
        box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.2);
      }
    }
    &.is-success {
      .a-input__inner,
      .a-textarea__inner {
        border-color: #34c388 !important;
      }
    }
  }
}
</style>
