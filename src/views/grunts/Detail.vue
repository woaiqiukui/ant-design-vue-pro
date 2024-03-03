<template>
  <page-header-wrapper
    :title="'grunt\'s name: ' + grunt.name"
    :tab-list="tabList"
    :tab-active-key="tabActiveKey"
    @tabChange="handleTabChange"
  >

    <template v-slot:content>
      <a-descriptions size="small" :column="isMobile ? 1 : 2">
        <a-description-item label="Name">{{ grunt.name }}</a-description-item>
        <a-description-item label="Age">{{ grunt.os }}</a-description-item>
        <a-description-item label="Address">{{ grunt.external_ip }}</a-description-item>
        <a-description-item label="Tags">{{ grunt.internal_ip }}</a-description-item>
        <a-description-item label="Description">{{ grunt.status }}</a-description-item>
        <a-description-item label="Description">{{ grunt.username }}</a-description-item>
        <a-description-item label="Description">{{ grunt.pid }}</a-description-item>
        <a-description-item label="Description">{{ grunt.process_name }}</a-description-item>
        <a-description-item label="Description">{{ grunt.cpu }}</a-description-item>
        <a-description-item label="Description">{{ grunt.memory }}</a-description-item>
        <a-description-item label="Description">{{ grunt.hostname }}</a-description-item>
        <a-description-item label="Description">{{ grunt.last_seen }}</a-description-item>
        <a-description-item label="Description">{{ grunt.create_time }}</a-description-item>
      </a-descriptions>
    </template>

    <!-- 操作 -->
    <template>
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
    </template>
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
        { key: 'Execution', tab: '插件执行' },
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
    }
  }
}
</script>
