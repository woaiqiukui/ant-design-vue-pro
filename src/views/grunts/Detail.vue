<template>
  <page-header-wrapper
    :title="'Grunt\'s name: ' + grunt.name"
    :tab-list="tabList"
    :tab-active-key="tabActiveKey"
    @tabChange="handleTabChange"
  >

    <template v-slot:content>
      <a-card type="inner" title="Grunt详情">
        <a-descriptions size="small" :column="isMobile ? 1 : 2">
          <a-descriptions-item label="Name">{{ grunt.name }}</a-descriptions-item>
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
    </template>

    <!-- 操作 -->
    <a-descriptions title="Mqtt通道信息" :column="isMobile ? 1 : 2">
      <a-descriptions-item label="操作">
        <a-descriptions label="Client_ID"></a-descriptions>
      </a-descriptions-item>
    </a-descriptions>

    <a-card
      style="margin-top: 24px"
      :bordered="false"
      :tabList="operationTabList"
      :activeTabKey="operationActiveTabKey"
      @tabChange="handleOperationTabChange"
    >
      <!-- 动态组件，根据当前的 tab key 显示不同的内容 -->
      <component :is="currentComponent"></component>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { baseMixin } from '@/store/app-mixin'
import Execution from './Execution'
import FileManager from './FileManager'
import { getGruntByClientId } from '@/api/grunt'

export default {
  name: 'Detail',
  mixins: [baseMixin],
  components: {
    Execution, // 注册 Execution 组件
    FileManager // 注册 FileManager 组件
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
        { key: 'Detail', tab: '操作' },
        { key: 'Plugins', tab: '插件管理' }
      ],
      tabActiveKey: 'Detail',
      operationTabList: [
        { key: 'Execution', tab: 'Mqtt通道' },
        { key: 'FileManager', tab: '文件管理' }
      ],
      operationActiveTabKey: 'Execution',
      grunt: null // 初始时 grunt 为空
    }
  },
  mounted () {
    this.fetchGruntData()
  },
  computed: {
    currentComponent () {
      switch (this.operationActiveTabKey) {
        case 'Execution':
          return Execution
        case 'FileManager':
          return FileManager
        default:
          return null
      }
    }
  },
  methods: {
    handleTabChange (key) {
      this.tabActiveKey = key
    },
    handleOperationTabChange (key) {
      this.operationActiveTabKey = key
    },
    fetchGruntData () {
      getGruntByClientId(this.gruntId).then((response) => {
        console.log(response)
        this.grunt = response
      })
    },
    fetchMqttData () {
      // 获取 Mqtt 通道信息
    },
    formatDate (timestamp) {
      const date = new Date(timestamp * 1000) // 转换为毫秒
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }
  }
}
</script>
