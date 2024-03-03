<template>
  <page-header-wrapper>
    <a-card>
      <a-button @click="fetchData" type="primary" icon="reload">刷新监听器列表</a-button>

      <a-table
        :columns="columns"
        :dataSource="data"
        :pagination="false"
        :loading="memberLoading"
      >
        <template v-for="(col, i) in ['name', 'protocol', 'status', 'address', 'port']" :slot="col" slot-scope="text, record">
          <a-input
            v-if="record.editable && col === 'name'"
            :key="col"
            style="margin: -5px 0"
            :value="text"
            :placeholder="columns[i].title"
            @change="e => handleChange(e.target.value, record.key, col)"
          />
          <a-select
            v-else-if="record.editable && col === 'protocol'"
            :key="col"
            style="width: 100%; margin: -10px 0"
            :value="text"
            @change="value => handleChange(value, record.key, col)"
          >
            <a-select-option value="Https">Https</a-select-option>
            <a-select-option value="Udp">Udp</a-select-option>
            <a-select-option value="Tcp">Tcp</a-select-option>
          </a-select>
          <a-tag v-else-if="col === 'status'" :key="col" :color="getStatusTagColor(text)">{{ record.editable ? 'Idle' : text }}</a-tag>
          <a-input
            v-else-if="record.editable && (col === 'address' || col === 'port')"
            :key="col"
            style="margin: -5px 0"
            :value="text"
            :placeholder="columns[i].title"
            @change="e => handleChange(e.target.value, record.key, col)"
          />
          <template v-else>{{ text }}</template>
        </template>
        <template slot="operation" slot-scope="text, record">
          <template v-if="record.editable">
            <span v-if="record.isNew">
              <a @click="saveRow(record)">添加</a>
              <a-divider type="vertical" />
              <a-popconfirm title="是否要删除该监听器？" @confirm="remove(record.key)">
                <a>删除</a>
              </a-popconfirm>
            </span>
            <span v-else>
              <a @click="saveRow(record)">保存</a>
              <a-divider type="vertical" />
              <a @click="cancel(record.key)">取消</a>
            </span>
          </template>
          <span v-else>
            <!-- 使用a-tooltip包裹a-icon，并通过条件判断来禁用或启用图标 -->
            <a-tooltip title="暂停">
              <div :style="{ cursor: record.status === 'Running' ? 'pointer' : 'not-allowed', display: 'inline' }">
                <a-popconfirm title="是否要暂停该监听器？" @confirm="pause(record.id)">
                  <a-icon type="pause-circle" :style="{ color: record.status === 'Running' ? 'inherit' : 'grey' }" />
                </a-popconfirm>
              </div>
            </a-tooltip>
            <a-divider type="vertical" />

            <a-tooltip title="恢复">
              <div :style="{ cursor: record.status === 'Idle' ? 'pointer' : 'not-allowed', display: 'inline' }">
                <a-popconfirm title="是否要恢复该监听器？" @confirm="resume(record.id)">
                  <a-icon type="play-circle" :style="{ color: record.status === 'Idle' ? 'inherit' : 'grey' }" />
                </a-popconfirm>
              </div>
            </a-tooltip>
            <a-divider type="vertical" />

            <!-- 重启和关停按钮始终可用 -->
            <a-tooltip title="重启">
              <a-popconfirm title="是否要重启该监听器？" @confirm="restart(record.id)">
                <a-icon type="sync" style="cursor: pointer;" />
              </a-popconfirm>
            </a-tooltip>
            <a-divider type="vertical" />

            <a-tooltip title="关停">
              <a-popconfirm title="是否要关停该监听器？" @confirm="stop(record.id)">
                <a-icon type="poweroff" style="cursor: pointer;" />
              </a-popconfirm>
            </a-tooltip>
          </span>
        </template>
      </a-table>
      <a-button style="width: 100%; margin-top: 16px; margin-bottom: 8px" type="dashed" icon="plus" @click="newListener">新增监听器</a-button>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { getListener, addListener, updateListener } from '@/api/listener'
import { Tag } from 'ant-design-vue'

export default {
  name: 'Listener',
  components: {
    Tag
  },
  data: () => ({
    columns: [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        scopedSlots: { customRender: 'name' }
      },
      {
        title: 'Protocol',
        dataIndex: 'protocol',
        key: 'protocol',
        scopedSlots: { customRender: 'protocol' } // 使用自定义渲染插槽
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        scopedSlots: { customRender: 'status' }
      },
      {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
        scopedSlots: { customRender: 'address' }
      },
      {
        title: 'Port',
        dataIndex: 'port',
        key: 'port',
        scopedSlots: { customRender: 'port' }
      },
      {
        title: 'Create Time',
        dataIndex: 'createTime',
        key: 'createTime',
        scopedSlots: { customRender: 'createTime' }
      },
      {
        title: '操作',
        key: 'action',
        scopedSlots: { customRender: 'operation' }
      }
    ],
    data: [],
    memberLoading: false,
    sideCollapsed: false,
    isMobile: false
  }),
  methods: {
    fetchData () {
      this.memberLoading = true
      getListener()
        .then(response => {
          // 过滤掉状态为'error'的监听器
          const filteredData = response.filter(item => item.status !== 'Error')
          // 假设 response 是你直接从后端获取到的数据数组
          const formattedData = filteredData.map(item => ({
            ...item,
            key: item.id, // 使用 id 作为 key
            createTime: this.formatTime(item.createTime) // 格式化时间戳为可读日期，如果需要的话
          }))
          this.data = formattedData
          this.memberLoading = false
        })
        .catch(error => {
          console.error('Error fetching data: ', error)
          this.memberLoading = false
        })
    },
    formatTime (timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleString() // 或者使用任何你喜欢的日期格式
    },
    newListener () {
      // 为表格添加一个新的空行，供用户填写信息
      const newData = {
        key: this.data.length + 1, // 确保 key 是唯一的
        name: '', // 用户将填写的名称
        protocol: 'Tcp', // 用户将选择的协议
        port: 90, // 用户将填写的端口
        address: '0.0.0.0', // 用户将填写的地址
        editable: true, // 使这行可编辑
        isNew: true // 标记这是一个新的监听器
      }
      this.data = [...this.data, newData] // 添加到当前数据中
    },
    handleChange (value, key, column) {
      const index = this.data.findIndex(item => item.key === key)
      if (index !== -1) {
        // 如果是 port 列，确保值被转换为数值类型
        const updatedValue = column === 'port' ? parseInt(value, 10) : value

        // 检查转换后的数值是否为 NaN，如果是，则不更新该值
        if (column === 'port' && isNaN(updatedValue)) {
          console.error('Port must be a valid number')
          return
        }

        // 使用 Vue.set 来确保响应式更新
        this.$set(this.data, index, { ...this.data[index], [column]: updatedValue })
      }
    },
    saveRow (record) {
      this.memberLoading = true
      // 检查是否为新创建的监听器
      if (record.isNew) {
        // 构建发送到服务器的数据
        const params = {
          name: record.name,
          protocol: record.protocol,
          port: record.port,
          address: record.address
        }
        // 调用 addListener 发送请求
        addListener(params).then(response => {
          // 处理响应
          this.$message.success('监听器添加成功')
          this.fetchData() // 重新加载数据
          // 更新状态，避免重复提交
          const index = this.data.findIndex(item => item.key === record.key)
          if (index !== -1) {
            this.data[index].editable = false
            this.data[index].isNew = false
          }
          this.memberLoading = false
        }).catch(error => {
          console.error('监听器添加失败', error)
          this.$message.error('监听器添加失败，请重试')
          this.memberLoading = false
        })
      } else {
        // 如果不是新创建的监听器，这里可以处理更新逻辑
        // 更新逻辑...
      }
    },
    remove (key) {
      const newData = this.data.filter(item => item.key !== key)
      this.data = newData
    },
    pause (id) {
      const record = this.data.find(item => item.id === id)
      if (record && record.status !== 'Running') {
        this.$message.warning('监听器不在运行状态，无法暂停')
        return // 直接返回，不执行后续操作
      }
      updateListener({ id: id, command: 'Pause' }).then(response => {
        this.$message.success('监听器暂停成功')
        this.fetchData() // 重新加载数据
      }).catch(error => {
        console.error('监听器暂停失败', error)
        this.$message.error('监听器暂停失败，请重试')
      })
    },
    resume (id) {
      const record = this.data.find(item => item.id === id)
      if (record && record.status !== 'Idle') {
        this.$message.warning('监听器不在空闲状态，无法恢复')
        return // 直接返回，不执行后续操作
      }
      updateListener({ id: id, command: 'Resume' }).then(response => {
        this.$message.success('监听器恢复成功')
        this.fetchData() // 重新加载数据
      }).catch(error => {
        console.error('监听器恢复失败', error)
        this.$message.error('监听器恢复失败，请重试')
      })
    },
    restart (id) {
      updateListener({ id: id, command: 'Restart' }).then(response => {
        this.$message.success('监听器重启成功')
        this.fetchData() // 重新加载数据
      }).catch(error => {
        console.error('监听器重启失败', error)
        this.$message.error('监听器重启失败，请重试')
      })
    },
    stop (id) {
      updateListener({ id: id, command: 'Stop' }).then(response => {
        this.$message.success('监听器关停成功')
        this.fetchData() // 重新加载数据
      }).catch(error => {
        console.error('监听器关停失败', error)
        this.$message.error('监听器关停失败，请重试')
      })
    },
    getStatusTagColor (status) {
      switch (status) {
        case 'Idle':
          return 'cyan' // 蓝色
        case 'Running':
          return 'green' // 绿色
        case 'Stopped':
          return 'red' // 橙色
        default:
          return 'blue' // 默认颜色
      }
    }
  },
  mounted () {
    this.fetchData()
  }
}

</script>
