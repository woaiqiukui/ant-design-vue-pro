<template>
  <page-header-wrapper :title="'Grunt\'s Name: ' + grunt.name">
    <template v-slot:content>
      <a-card type="inner" title="Grunt详情">
        <a-descriptions size="small" :column="isMobile ? 1 : 2">
          <a-descriptions-item label="OS">{{ grunt.os }}</a-descriptions-item>
          <a-descriptions-item label="外部IP">{{ grunt.external_ip }}</a-descriptions-item>
          <a-descriptions-item label="内部IP">{{ grunt.internal_ip }}</a-descriptions-item>
          <a-descriptions-item label="Grunt状态">{{ grunt.status }}</a-descriptions-item>
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
          <a-descriptions-item label="Status">{{ mqtt_channel.status }}</a-descriptions-item>
          <a-descriptions-item label="Broker">{{ mqtt_channel.broker }}</a-descriptions-item>
          <a-descriptions-item label="Topic">{{ mqtt_channel.topic }}</a-descriptions-item>
          <a-descriptions-item label="QOS">{{ mqtt_channel.qos }}</a-descriptions-item>
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
          <a-descriptions-item label="创建时间">{{ formatDate(mqtt_channel.create_time) }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-tabs :activeKey="tabActiveKey" @change="handleTabChange" class="custom-tab">
        <a-tab-pane key="Execution" tab="Mqtt通道"></a-tab-pane>
        <a-tab-pane key="FileManager" tab="文件管理"></a-tab-pane>
        <a-tab-pane key="Plugins" tab="插件管理"></a-tab-pane>
      </a-tabs>

      <!-- 根据当前激活的 Tab 动态渲染组件 -->
      <component :is="currentComponent" :mqttChannel="mqtt_channel"></component>
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
      showPassword: false
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
      getMqttChannleByClentId(this.gruntId).then((resopnse) => {
        console.log(resopnse)
        this.mqtt_channel = resopnse
      })
    },
    formatDate (timestamp) {
      const date = new Date(timestamp * 1000) // 转换为毫秒
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }
  }
}
</script>
<style>
/* 其他样式保持不变 */
.icon-spacing {
  margin-left: 8px; /* 或者根据你的设计需求调整 */
}
</style>@/api/mqtt_channel
