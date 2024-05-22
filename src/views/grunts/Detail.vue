<template>
  <page-header-wrapper :title="'Grunt\'s Name: ' + grunt.name">
    <template v-slot:content>
      <a-card type="inner" title="Grunt详情">
        <a-descriptions size="small" :column="isMobile ? 1 : 2">
          <a-descriptions-item label="OS">{{ grunt.os }}</a-descriptions-item>
          <a-descriptions-item label="外部IP">{{ grunt.external_ip }}</a-descriptions-item>
          <a-descriptions-item label="内部IP">{{ grunt.internal_ip }}</a-descriptions-item>
          <a-descriptions-item label="Status">
            <a-tag :color="getGruntStatusColor(grunt.status)">{{ mqtt_channel.status }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Username">{{ grunt.username }}</a-descriptions-item>
          <a-descriptions-item label="Pid">{{ grunt.pid }}</a-descriptions-item>
          <a-descriptions-item label="Process_Name">{{ grunt.process_name }}</a-descriptions-item>
          <a-descriptions-item label="CPU">{{ grunt.cpu }}</a-descriptions-item>
          <a-descriptions-item label="MEMORY">{{ grunt.memory }}</a-descriptions-item>
          <a-descriptions-item label="Hostname">{{ grunt.hostname }}</a-descriptions-item>
          <a-descriptions-item label="最近心跳时间">{{ formatDate(grunt.last_seen) }}</a-descriptions-item>
          <a-descriptions-item label="初次心跳时间">{{ formatDate(grunt.create_time) }}</a-descriptions-item>
        </a-descriptions>
      </a-card>
      <a-card type="inner" title="Mqtt通道信息">
        <a-descriptions size="small" :column="isMobile ? 1 : 2">
          <a-descriptions-item label="Client_ID">{{ mqtt_channel.client_id }}</a-descriptions-item>
          <a-descriptions-item label="Status">
            <a-tag :color="getMqttStatusColor(mqtt_channel.status)">{{ mqtt_channel.status }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="MqttBroker">{{ formattedBrokerUrl }}</a-descriptions-item>
          <a-descriptions-item label="WebsocketBroker">{{ formattedWebsocketBrokerUrl }}</a-descriptions-item>
          <a-descriptions-item label="Mqtt_Version">{{ mqtt_channel.mqtt_version }}</a-descriptions-item>
          <a-descriptions-item label="Connect_Timeout">{{ mqtt_channel.connect_timeout }}</a-descriptions-item>
          <a-descriptions-item label="Keep_Alive">{{ mqtt_channel.keep_alive }}</a-descriptions-item>
          <a-descriptions-item label="Auto_Reconnect">{{ mqtt_channel.auto_reconnect }}</a-descriptions-item>
          <a-descriptions-item label="Min_Retry_Intervel">{{ mqtt_channel.min_retry_interval }}</a-descriptions-item>
          <a-descriptions-item label="Max_Retry_Intervel">{{ mqtt_channel.max_retry_interval }}</a-descriptions-item>
          <a-descriptions-item label="Clean_Start">{{ mqtt_channel.clean_start }}</a-descriptions-item>
          <a-descriptions-item label="Last_Will_Qos">{{ mqtt_channel.last_will_qos }}</a-descriptions-item>
          <a-descriptions-item label="Last_Will_Payload">{{ mqtt_channel.last_will_payload }}</a-descriptions-item>
          <a-descriptions-item label="Publish_Qos">{{ mqtt_channel.publish_qos }}</a-descriptions-item>
          <a-descriptions-item label="Subscribe_Qos">{{ mqtt_channel.subscribe_qos }}</a-descriptions-item>

          <a-descriptions-item label="Username">
            <template v-if="showUsername">{{ mqtt_channel.username }}</template>
            <template v-if="!showUsername">******</template>
            <a-icon
              :type="showUsername ? 'eye-invisible' : 'eye'"
              @click="showUsername = !showUsername"
              class="icon-spacing"
            ></a-icon>
          </a-descriptions-item>

          <a-descriptions-item label="Password">
            <template v-if="showPassword">{{ mqtt_channel.password }}</template>
            <template v-if="!showPassword">******</template>
            <a-icon
              :type="showPassword ? 'eye-invisible' : 'eye'"
              @click="showPassword = !showPassword"
              class="icon-spacing"
            ></a-icon>
          </a-descriptions-item>
          <a-descriptions-item label="Command_Receive_Topic">{{ mqtt_channel.command_receive_topic }}</a-descriptions-item>
          <a-descriptions-item label="Result_Send_Topic">{{ mqtt_channel.result_send_topic }}</a-descriptions-item>
          <a-descriptions-item label="Forward_Command_Send_Topic">{{ mqtt_channel.forward_command_send_topic }}</a-descriptions-item>
          <a-descriptions-item label="Forward_Result_Receive_Topic">{{ mqtt_channel.forward_result_receive_topic }}</a-descriptions-item>
          <a-descriptions-item label="File_Send_Topic">{{ mqtt_channel.file_send_topic }}</a-descriptions-item>
          <a-descriptions-item label="File_Receive_Topic">{{ mqtt_channel.file_receive_topic }}</a-descriptions-item>
          <a-descriptions-item label="File_Command_Send_Topic">{{ mqtt_channel.file_command_send_topic }}</a-descriptions-item>
          <a-descriptions-item label="File_Command_Receive_Topic">{{ mqtt_channel.file_command_receive_topic }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(mqtt_channel.create_time) }}</a-descriptions-item>
          <a-descriptions-item label="最近回连">{{ formatDate(mqtt_channel.last_seen) }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-tabs :activeKey="tabActiveKey" @change="handleTabChange" class="custom-tab">
        <a-tab-pane key="Execution" tab="Mqtt通道"></a-tab-pane>
        <a-tab-pane key="FileManager" tab="文件管理"></a-tab-pane>
        <a-tab-pane key="Plugins" tab="插件管理"></a-tab-pane>
      </a-tabs>

      <!-- 根据当前激活的 Tab 动态渲染组件 -->
      <component :is="currentComponent" :mqttChannel="mqtt_channel" :isMqttActive="isMqttActiveComputed"></component>
    </template>
  </page-header-wrapper>
</template>

<script>
import { baseMixin } from '@/store/app-mixin'
import Execution from './Execution'
import FileManager from './FileManager'
import { getGruntByClientId } from '@/api/grunt'
import { getMqttChannleByClentId } from '@/api/mqtt_channel'

export default {
  name: 'Detail',
  mixins: [baseMixin],
  components: {
    Execution, // 注册 Execution 组件
    FileManager
  },
  props: {
    gruntId: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      tabList: [
        { key: 'Execution', tab: 'Mqtt通道' },
        { key: 'FileManager', tab: '文件管理' },
        { key: 'Plugins', tab: '插件管理' }
      ],
      tabActiveKey: 'Execution',
      grunt: null,
      mqtt_channel: null,
      showUsername: false,
      showPassword: false,
      gruntStatusColorMapping: {
        Idle: 'green',
        Working: 'orange',
        Dead: 'red'
      },
      mqttStatusColorMapping: {
        Active: 'green',
        Inactive: 'orange',
        Destroyed: 'red'
      }
    }
  },
  mounted () {
    this.fetchGruntData()
    this.fetchMqttData()
  },
  computed: {
    currentComponent () {
      switch (this.tabActiveKey) {
        case 'Execution':
          return Execution
        case 'FileManager':
          return FileManager
        // case 'Plugins':
        //   return Plugins
        default:
          return null
      }
    },
    isMqttActiveComputed () {
      // eslint-disable-next-line camelcase
      return this.mqtt_channel && this.mqtt_channel.status === 'Active'
    },
    formattedBrokerUrl () {
      // eslint-disable-next-line camelcase
      const { emqx_broker_protocol, emqx_broker_host, emqx_broker_port, emqx_broker_endpoint } = this.mqtt_channel
      // eslint-disable-next-line camelcase
      return `${emqx_broker_protocol}://${emqx_broker_host}:${emqx_broker_port}/${emqx_broker_endpoint}`
    },
    formattedWebsocketBrokerUrl () {
      // eslint-disable-next-line camelcase
      const { ws_broker_protocol, ws_broker_host, ws_broker_port } = this.mqtt_channel
      // eslint-disable-next-line camelcase
      return `${ws_broker_protocol}://${ws_broker_host}:${ws_broker_port}`
    }
  },
  methods: {
    handleTabChange (key) {
      this.tabActiveKey = key
    },
    fetchGruntData () {
      getGruntByClientId(this.gruntId).then((response) => {
        this.grunt = response
      })
    },
    fetchMqttData () {
      getMqttChannleByClentId(this.gruntId).then((response) => {
        console.log(response)
        this.mqtt_channel = response
      })
    },
    formatDate (timestamp) {
      // 检测时间戳长度，Unix 时间戳（秒）通常长度为10位，毫秒为13位
      const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    getGruntStatusColor (status) {
      return this.gruntStatusColorMapping[status] || 'default'
    },
    getMqttStatusColor (status) {
      return this.mqttStatusColorMapping[status] || 'default'
    }
  }
}
</script>
<style>
.icon-spacing {
  margin-left: 8px;
}
</style>
