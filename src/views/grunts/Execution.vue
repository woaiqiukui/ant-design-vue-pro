<template>
  <div class="execution">
    <a-textarea v-model="command" rows="2" placeholder="输入命令"></a-textarea>
    <a-button @click="sendCommand" type="primary">发送</a-button>
    <div class="output">
      <p v-for="(response, index) in responses" :key="index">{{ response }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Execution',
  data () {
    return {
      command: '',
      responses: [] // 存储后端返回的响应
    }
  },
  methods: {
    sendCommand () {
      // 模拟发送命令到后端，并接收响应
      const response = `响应于 '${this.command}'` // 假设的响应
      this.responses.push(response)
      this.command = '' // 重置命令输入
      // 实际应用中，你需要在这里发送请求到后端并处理响应
    }
  }
}
</script>

<style scoped>
.output {
  margin-top: 20px;
  background-color: #f0f0f0;
  padding: 10px;
}
</style>
