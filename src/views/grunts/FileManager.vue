<template>
  <div>
    <a-button @click="fetchFiles">刷新文件列表</a-button>
    <a-list
      bordered
      :dataSource="files"
      item-layout="horizontal"
    >
      <a-list-item
        v-for="item in files"
        :key="item.id"
      >
        <a-list-item-meta
          :title="item.name"
          :description="`文件ID: ${item.id}`"
        ></a-list-item-meta>
      </a-list-item>
    </a-list>
  </div>
</template>

<script>
export default {
  name: 'FileManager',
  data () {
    return {
      files: []
    }
  },
  methods: {
    fetchFiles () {
      // 模拟异步获取文件列表的操作
      const mockFiles = [
        { name: '文件1.txt', id: 1 },
        { name: '图片2.png', id: 2 },
        { name: '文档3.doc', id: 3 }
        // 添加更多文件对象作为示例
      ]

      setTimeout(() => {
        this.files = mockFiles
      }, 500) // 延迟500毫秒模拟异步加载
    }
  },
  mounted () {
    this.fetchFiles() // 组件加载时获取文件列表
  }
}
</script>
