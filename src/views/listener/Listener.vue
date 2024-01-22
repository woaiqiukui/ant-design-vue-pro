<template>
  <page-header-wrapper>
    <a-card>
      <a-table
        :columns="columns"
        :dataSource="data"
        :pagination="false"
        :loading="memberLoading"
      >
        <template v-for="(col, i) in ['name', 'protocol', 'status', 'address', 'port']" :slot="col" slot-scope="text, record">
          <a-input
            :key="col"
            v-if="record.editable"
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
            <a @click="toggle(record.key)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm title="是否要删除此行？" @confirm="remove(record.key)">
              <a>删除</a>
            </a-popconfirm>
          </span>
        </template>
      </a-table>
      <a-button style="width: 100%; margin-top: 16px; margin-bottom: 8px" type="dashed" icon="plus" @click="newListener">新增监听器</a-button>
    </a-card>
  </page-header-wrapper>
</template>

<script>
export default {
  name: 'Listener',
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
        scopedSlots: { customRender: 'protocol' }
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
        title: '操作',
        key: 'action',
        scopedSlots: { customRender: 'operation' }
      }
    ],
    data: [
      {
        key: '1',
        name: 'http',
        protocol: 'http',
        status: 'active',
        address: '0.0.0.0',
        port: '8080',
        editable: false
      },
      {
        key: '2',
        name: 'https',
        protocol: 'https',
        status: 'active',
        address: '0.0.0.0',
        port: '8443',
        editable: false
      }
    ],
    memberLoading: false,
    sideCollapsed: false,
    isMobile: false
  }),
  methods: {
    newListener () {
      const { data } = this
      const newData = {
        key: data.length + 1,
        name: '',
        workId: '',
        department: '',
        editable: true,
        isNew: true
      }
      this.data = [...data, newData]
    }
  },
  handleChange (value, key, column) {
    const newData = [...this.data]
    const target = newData.find(item => key === item.key)
    if (target) {
      target[column] = value
      this.data = newData
    }
  },
  remove (key) {
    const newData = this.data.filter(item => item.key !== key)
    this.data = newData
  },
  saveRow (record) {
      this.memberLoading = true
      const { key, name, workId, department } = record
      if (!name || !workId || !department) {
        this.memberLoading = false
        this.$message.error('请填写完整成员信息。')
        return
      }
      // 模拟网络请求、卡顿 800ms
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ loop: false })
        }, 800)
      }).then(() => {
        const target = this.data.find(item => item.key === key)
        target.editable = false
        target.isNew = false
        this.memberLoading = false
      })
    },
    toggle (key) {
      const target = this.data.find(item => item.key === key)
      target._originalData = { ...target }
      target.editable = !target.editable
    },
    getRowByKey (key, newData) {
      const data = this.data
      return (newData || data).find(item => item.key === key)
    },
    cancel (key) {
      const target = this.data.find(item => item.key === key)
      Object.keys(target).forEach(key => { target[key] = target._originalData[key] })
      target._originalData = undefined
    }
}

</script>
