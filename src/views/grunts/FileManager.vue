<template>
  <div>
    <dx-file-manager
      :file-system-provider="remoteProvider"
      :on-selected-file-opened="displayImagePopup"
      current-path="Widescreen"
    >
      <dx-permissions
        :create="true"
        :copy="true"
        :move="true"
        :delete="true"
        :rename="true"
        :upload="true"
        :download="true"
      ></dx-permissions>
    </dx-file-manager>

    <dx-popup
      :hide-on-outside-click="true"
      :show-close-button="true"
      v-model="popupVisible"
      :title="imageItemToDisplay.name"
      max-height="600"
      class="photo-popup-content"
    >
      <template #content>
        <img :src="imageItemToDisplay.url" class="photo-popup-image">
      </template>
    </dx-popup>
  </div>
</template>

<script>
import { DxFileManager, DxPermissions } from 'devextreme-vue/file-manager'
import { DxPopup } from 'devextreme-vue/popup'
import 'devextreme/dist/css/dx.light.css'

export default {
  name: 'FileManager',
  props: {
    mqttChannel: {
      type: Object,
      required: true
    }
  },
  components: {
    DxFileManager,
    DxPermissions,
    DxPopup
  },
  data () {
    return {
      popupVisible: false,
      imageItemToDisplay: {},
      remoteProvider: this.initRemoteProvider(),
      // 使用 customFileSystemProvider 作为 remoteProvider 的值
      // remoteProvider: this.customFileSystemProvider
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
      file_subscription: {
        topic: this.mqttChannel.file_receive_topic,
        qos: 1
      },
      file_publish: {
        topic: this.mqttChannel.file_send_topic,
        qos: 1
      },
      client: {
        connected: false
      },
      subscribeSuccess: false,
      connecting: false,
      // 文件相关
      currentDir: '.'
    }
  },
  methods: {
    initRemoteProvider () {
      const RemoteFileSystemProvider = require('devextreme/file_management/remote_provider').default
      return new RemoteFileSystemProvider({
        endpointUrl: 'https://js.devexpress.com/Demos/Mvc/api/file-manager-file-system-images'
      })
    },
    displayImagePopup (e) {
      this.imageItemToDisplay = {
        name: e.file.name,
        url: e.file.dataItem.url
      }
      this.popupVisible = true
    },
    initData () {
      this.client = {
        connected: false
      }
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
      // if (!this.isMqttActive) {
      //   // 显示提示消息并退出方法
      //   this.$message.error('Grunt已离线，通道已关闭')
      //   return
      // }
      this.isConnecting = true
      try {
        const mqtt = require('mqtt')
        this.client = mqtt.connect(this.connection)
        this.client.on('connect', () => {
          this.connecting = false
          this.subscribeSuccess = true
          this.$message.success('Connected to MQTT broker successfully')
          this.client.subscribe(this.file_subscription.topic, { qos: this.file_subscription.qos }, (err) => {
            if (err) {
              this.$message.error(err.toString())
            }
          })
        })
        this.client.on('message', (topic, message) => {
          this.$message.success(`Received message from topic: ${topic}`)
          this.$message.success(`Message content: ${message.toString()}`)
        })
        this.client.on('error', (error) => {
          this.$message.error(error.toString())
        })
        this.client.on('reconnect', () => {
          this.handleOnReConnect()
        })
      } catch (error) {
        this.$message.error(error.toString())
      }
    },
    doUploadFile (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileContent = e.target.result
        this.client.publish(this.file_publish.topic, fileContent, { qos: this.file_publish.qos }, (err) => {
          if (err) {
            this.$message.error(err.toString())
          } else {
            this.$message.success('File uploaded successfully')
          }
        })
      }
      reader.readAsArrayBuffer(file)
    },
    doDownloadFile (file) {
      this.client.subscribe(this.file_subscription.topic, { qos: this.file_subscription.qos }, (err) => {
        if (err) {
          this.$message.error(err.toString())
        } else {
          this.client.publish(this.file_publish.topic, file, { qos: this.file_publish.qos }, (err) => {
            if (err) {
              this.$message.error(err.toString())
            } else {
              this.$message.success('File downloaded successfully')
            }
          })
        }
      })
    },
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
    generateClientId (length = 10) {
      // 生成长度为length的随机字符串
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const charactersLength = characters.length
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      console.log('generateClientId', result)
      return result
    }
  },
  created () {
    this.clientId = this.generateClientId()
  }
}
</script>

<style>
.photo-popup-content {
  text-align: center;
}

.photo-popup-content .photo-popup-image {
  height: 100%;
  max-width: 100%;
}
</style>
