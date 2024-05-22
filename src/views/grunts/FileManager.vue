<template>
  <div>
    <dx-load-panel
      :visible="isLoading"
      shading-color="rgba(0,0,0,0.4)"
      message="Loading..."
      :show-indicator="true"
      :show-pane="true"
      :shading="true"
    ></dx-load-panel>

    <dx-file-manager
      v-if="!isLoading"
      :file-system-provider="customFileSystemProvider"
      :on-selected-file-opened="displayImagePopup"
      current-path="."
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
import { DxFileManager, DxPermissions, DxLoadPanel } from 'devextreme-vue/file-manager'
import { DxPopup } from 'devextreme-vue/popup'
import 'devextreme/dist/css/dx.light.css'
import CustomFileSystemProvider from 'devextreme/file_management/custom_provider'
import mqtt from 'mqtt'
import folderIcon from '@/core/icons'

export default {
  name: 'FileManager',
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
  components: {
    DxFileManager,
    DxPermissions,
    DxPopup,
    DxLoadPanel
  },
  data () {
    return {
      popupVisible: false,
      imageItemToDisplay: {},
      customFileSystemProvider: null,
      isConnecting: false,
      isLoading: true,
      connection: {
        broker: `${this.mqttChannel.emqx_broker_protocol}://${this.mqttChannel.emqx_broker_host}:${this.mqttChannel.emqx_broker_port}`,
        websocket_url: `${this.mqttChannel.ws_broker_protocol}://${this.mqttChannel.ws_broker_host}:${this.mqttChannel.ws_broker_port}`,
        clean: this.mqttChannel.clean_start,
        connectTimeout: this.mqttChannel.connect_timeout, // ms
        reconnectPeriod: 10, // ms
        clientId: this.generateClientId(),
        username: this.mqttChannel.username,
        password: this.mqttChannel.password
      },
      file_command_receive: {
        topic: this.mqttChannel.file_command_receive_topic,
        qos: 1
      },
      file_command_send: {
        topic: this.mqttChannel.file_command_send_topic,
        qos: 1
      },
      client: {
        connected: false
      },
      subscribeSuccess: false,
      connecting: false,
      currentDir: '.',
      retryCount: 0,
      maxRetries: 5,
      fileItems: []
    }
  },
  methods: {
    initCustomFileSystemProvider () {
      const customFileSystemProvider = new CustomFileSystemProvider({
        getItems: this.getItems,
        createDirectory: this.createDirectory,
        deleteItem: this.deleteItem,
        renameItem: this.renameItem
      })
      return customFileSystemProvider
    },
    getItems (parentDir) {
      return new Promise((resolve, reject) => {
        this.sendMqttCommand('DirectoryBrowse', [parentDir.path || '.'])
          .then((response) => {
            const fileItems = response.entries.map(item => ({
              name: item.name,
              isDirectory: item.is_directory,
              size: item.size,
              dateModified: new Date(item.date_modified),
              thumbnail: item.thumbnail || folderIcon,
              hasSubDirectories: item.has_sub_directories
            }))
            resolve(fileItems)
          })
          .catch(reject)
      })
    },
    createDirectory (parentDir, name) {
      return this.sendMqttCommand('DirectoryCreate', [`${parentDir.path}/${name}`])
    },
    deleteItem (item) {
      if (item.isDirectory) {
        return this.sendMqttCommand('DirectoryDelete', [item.path])
      } else {
        return this.sendMqttCommand('FileDelete', [item.path])
      }
    },
    renameItem (item, name) {
      return this.sendMqttCommand('RenameItem', [item.path, name])
    },
    displayImagePopup (e) {
      this.imageItemToDisplay = {
        name: e.file.name,
        url: e.file.dataItem.url
      }
      this.popupVisible = true
    },
    sendMqttCommand (commandType, parameters) {
      return new Promise((resolve, reject) => {
        if (this.client.connected) {
          const message = JSON.stringify({ command_type: commandType, parameters })
          this.client.publish(this.file_command_send.topic, message, { qos: this.file_command_send.qos }, (err) => {
            if (err) {
              reject(err)
            } else {
              this.client.once('message', (topic, message) => {
                if (topic === this.file_command_receive.topic) {
                  try {
                    const response = JSON.parse(message.toString())
                    console.log('Received response:', response)
                    resolve(response)
                  } catch (error) {
                    reject(error)
                  }
                }
              })
            }
          })
        } else {
          reject(new Error('MQTT client is not connected'))
        }
      })
    },
    createConnection () {
      if (!this.isMqttActive) {
        this.$message.error('Grunt已离线，通道已关闭')
        return
      }
      this.isConnecting = true
      this.retryCount = 0
      try {
        const connectUrl = `${this.connection.websocket_url}/mqtt`
        // eslint-disable-next-line camelcase
        const { broker, topic, websocket_url, ...options } = this.connection
        this.client = mqtt.connect(connectUrl, options)
        this.client.on('connect', () => {
          this.isConnecting = false
          this.client.connected = true
          console.log('Connection succeeded!')
          this.doSubscribe()
          this.customFileSystemProvider = this.initCustomFileSystemProvider()
          this.isLoading = false
          this.queryCurrentPath()
          this.browseDirectory(this.currentDir)
        })
        this.client.on('error', (error) => {
          this.isConnecting = false
          this.isLoading = false
          console.log('Connection failed', error)
        })
        this.client.on('message', (topic, message) => {
          console.log(`Received message from topic: ${topic}`, message.toString())
        })
        this.client.on('reconnect', () => {
          this.retryCount++
          if (this.retryCount > this.maxRetries) {
            this.client.end()
            console.error('Max reconnect attempts reached. Stopping retries.')
          }
        })
      } catch (error) {
        this.isLoading = false
        console.error('Connection error:', error)
      }
    },
    queryCurrentPath () {
      this.sendMqttCommand('GetCurrentPath', []) // 发送获取当前路径的命令
        .then((response) => {
          this.currentDir = response // 将返回的路径设置为 currentPath
        })
        .catch((error) => {
          console.error('Query current path error:', error)
        })
    },
    generateClientId (length = 10) {
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      return result
    },
    doSubscribe () {
      if (!this.client.connected) {
        this.$message.error('Client not connected, cannot publish.')
        return
      }
      const { topic, qos } = this.file_command_receive
      this.client.subscribe(topic, { qos }, (error, res) => {
        if (error) {
          console.log('Subscribe to topics error', error)
          return
        }
        this.subscribeSuccess = true
        console.log('Subscribe to topics res', res)
      })
    },
    browseDirectory (path) {
      this.sendMqttCommand('DirectoryBrowse', [path])
        .then((response) => {
          this.fileItems = response.entries.map(item => ({
            name: item.name,
            isDirectory: item.is_directory,
            size: item.size,
            dateModified: new Date(item.date_modified),
            thumbnail: item.thumbnail || folderIcon,
            hasSubDirectories: item.has_sub_directories
          }))
          // You can comment out this part if you do not want to automatically browse the first directory
          // if (this.fileItems.length > 0 && this.fileItems[0].isDirectory) {
          //   this.browseDirectory(this.fileItems[0].name)
          // }
        })
        .catch((error) => {
          console.error('Browse directory error:', error)
        })
    }
  },
  created () {
    this.createConnection()
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
