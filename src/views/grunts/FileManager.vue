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
      ref="fileManager"
      v-if="!isLoading"
      :file-system-provider="customFileSystemProvider"
      :on-current-directory-changed="updateCurrentDir"
      :on-selected-file-opened="displayImagePopup"
      :current-path="currentDir"
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
      imageItemToDisplay: {
        name: '',
        url: ''
      },
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
      currentDir: '/', // 设置初始路径为根目录
      initialDir: '', // 保存查询到的初始目录
      rootPath: '',
      retryCount: 0,
      maxRetries: 5,
      fileItems: []
    }
  },
  methods: {
    generateClientId (length = 10) {
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      return result
    },
    initCustomFileSystemProvider () {
      const customFileSystemProvider = new CustomFileSystemProvider({
        getItems: this.getItems,
        createDirectory: this.createDirectory,
        deleteItem: this.deleteItem,
        renameItem: this.renameItem,
        moveItem: this.moveItem,
        copyItem: this.copyItem
      })
      return customFileSystemProvider
    },
    getItems (parentDir) {
      const parentPath = parentDir && parentDir.path ? parentDir.dataItem.path : '/'
      return new Promise((resolve, reject) => {
        this.sendMqttCommand('DirectoryBrowse', [parentPath])
          .then((response) => {
            if (response.entries && Array.isArray(response.entries)) {
              const fileItems = response.entries.map(item => ({
                name: item.name,
                isDirectory: item.is_directory,
                size: item.size,
                dateModified: new Date(item.date_modified),
                thumbnail: item.thumbnail || folderIcon,
                hasSubDirectories: item.has_sub_directories,
                path: `${parentPath}/${item.name}` // 保留完整的路径信息
              }))
              resolve(fileItems)
            } else {
              console.error('Invalid response format:', response)
              reject(new Error('Invalid response format'))
            }
          })
          .catch(reject)
      })
    },
    createDirectory (parentDir, name) {
      const fullPath = `${this.rootPath}${parentDir.path}/${name}`
      return this.sendMqttCommand('DirectoryCreate', [fullPath])
    },
    deleteItem (item) {
      const fullPath = `${this.rootPath}${item.path}`

      if (item.isDirectory) {
        return this.sendMqttCommand('DirectoryDelete', [fullPath])
      } else {
        return this.sendMqttCommand('FileDelete', [fullPath])
      }
    },
    renameItem (item, name) {
      const fullPath = `${this.rootPath}${item.path}`
      return this.sendMqttCommand('RenameItem', [fullPath, name])
    },
    moveItem (item, destinationDir) {
      const sourcePath = `${this.rootPath}${item.path}`
      const destinationPath = `${this.rootPath}${destinationDir.path}/${item.name}`
      return this.sendMqttCommand('MoveItem', [sourcePath, destinationPath])
    },
    copyItem (item, destinationDir) {
      const sourcePath = `${this.rootPath}${item.path}`
      const destinationPath = `${this.rootPath}${destinationDir.path}/${item.name}`
      return this.sendMqttCommand('CopyItem', [sourcePath, destinationPath])
    },
    displayImagePopup (e) {
      this.imageItemToDisplay = {
        name: e.file.name,
        url: e.file.dataItem.url
      }
      this.popupVisible = true
    },
    updateCurrentDir (e) {
      this.currentDir = e.component.option('currentPath')
      // this.browseDirectory(this.currentDir) // 每次更新当前目录时浏览该目录
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
                    // console.log('Received response:', response)
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
    async createConnection () {
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
        this.client.on('connect', async () => {
          this.isConnecting = false
          this.client.connected = true
          console.log('Connection succeeded!')
          this.doSubscribe()
          await this.queryCurrentPath() // 查询当前路径
          this.customFileSystemProvider = this.initCustomFileSystemProvider() // 初始化文件系统提供者
          this.isLoading = false
          await this.browseToInitialPath() // 浏览到初始路径
        })
        this.client.on('error', (error) => {
          this.isConnecting = false
          this.isLoading = false
          console.log('Connection failed', error)
        })
        this.client.on('message', (topic, message) => {
          // console.log(`Received message from topic: ${topic}`, message.toString())
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
    async queryCurrentPath () {
      try {
        const response = await this.sendMqttCommand('GetCurrentPath', [])
        this.initialDir = response // 将返回的路径设置为 initialDir
        this.rootPath = response.split('/')[0] || '/'
        console.log('Initial Path:', this.initialDir)
      } catch (error) {
        console.error('Query current path error:', error)
      }
    },
    async browseToInitialPath () {
      const pathSegments = this.initialDir.split('/').filter(segment => segment)
      let currentPath = this.rootPath // 使用动态设置的根路径

      for (const segment of pathSegments) {
        currentPath = `${currentPath}${segment}/` // 将当前路径设置为当前路径段
        try {
          await this.getItems({ dataItem: { path: currentPath } }) // 调用 getItems 获取当前路径的内容
        } catch (error) {
          console.error(`Failed to browse directory: ${currentPath}`, error)
          break
        }
      }

      this.currentDir = this.initialDir
      this.$nextTick(() => {
        this.$refs.fileManager.instance.refresh() // 手动触发文件管理器的重绘
      })
    },
    browseDirectory (path) {
      return new Promise((resolve, reject) => {
        this.sendMqttCommand('DirectoryBrowse', [path])
          .then((response) => {
            if (response.entries && Array.isArray(response.entries)) {
              this.fileItems = response.entries.map(item => ({
                name: item.name,
                isDirectory: item.is_directory,
                size: item.size,
                dateModified: new Date(item.date_modified),
                thumbnail: item.thumbnail || folderIcon,
                hasSubDirectories: item.has_sub_directories,
                path: `${path}/${item.name}` // 保留完整的路径信息
              }))
              this.$forceUpdate() // 强制 Vue 重新渲染组件
              resolve()
            } else {
              console.error('Invalid response format:', response)
              reject(new Error('Invalid response format'))
            }
          })
          .catch((error) => {
            console.error('Browse directory error:', error)
            reject(error)
          })
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
