<template>
  <a-card>
    <template>
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="Grunt Name">
                <a-input v-model="queryParam.name" placeholder=""/>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="Grunt 状态">
                <a-select v-model="queryParam.status" placeholder="请选择">
                  <a-select-option value="Idle">Idle</a-select-option>
                  <a-select-option value="Working">Working</a-select-option>
                  <a-select-option value="Dead">Dead</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="Host Name">
                <a-input v-model="queryParam.hostname" placeholder=""/>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- Advanced Options Row -->
          <a-row :gutter="48" v-if="advanced">
            <a-col :md="8" :sm="24">
              <a-form-item label="External_IP">
                <a-input v-model="queryParam.external_ip" style="width: 100%"/>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="Internal_IP">
                <a-input v-model="queryParam.internal_ip" style="width: 100%"/>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="CreateTime">
                <a-date-picker v-model="queryParam.create_time" style="width: 100%" placeholder="请输入创建日期"/>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- Buttons Row -->
          <a-row :gutter="48">
            <a-col :span="24">
              <span class="table-page-search-submitButtons" style="float: right">
                <a-button type="primary" @click="fetchData">查询</a-button>
                <a-button style="margin-left: 8px" @click="resetSearchForm">重置</a-button>
                <a @click="toggleAdvanced" style="margin-left: 8px">
                  {{ advanced ? '收起' : '展开' }}
                  <a-icon :type="advanced ? 'up' : 'down'"/>
                </a>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-dropdown v-action:edit v-if="selectedRowKeys.length > 0">
          <a-menu slot="overlay">
            <a-menu-item key="1"><a-icon type="delete" />删除</a-menu-item>
            <a-menu-item key="2"><a-icon type="lock" />锁定</a-menu-item>
          </a-menu>
          <a-button style="margin-left: 8px">
            批量操作 <a-icon type="down" />
          </a-button>
        </a-dropdown>
      </div>

      <a-table
        :columns="columns"
        :data-source="data"
        :pagination="pagination"
        :loading="loading"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        :scroll="{ x: 'max-content' }"
        @change="handleTableChange"
      >
        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEdit(record)">详情</a>
            <a-divider type="vertical" />
          </template>
          <a-dropdown>
            <a class="ant-dropdown-link">
              更多 <a-icon type="down" />
            </a>
            <a-menu slot="overlay">
              <a-menu-item>
                <a @click="deleteRow(record.key)">删除</a>
              </a-menu-item>
            </a-menu>
          </a-dropdown>
        </span>
      </a-table>
    </template>
  </a-card>
</template>

<script>
import moment from 'moment'
import { getGrunt, deleteGruntByClientId, updateGruntName } from '@/api/grunt'
import { Modal, Input } from 'ant-design-vue'

export default {
  name: 'GruntList',
  data () {
    return {
      advanced: false,
      queryParam: {},
      data: [],
      loading: false,
      selectedRowKeys: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100']
      },
      columns: [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          width: 100,
          customRender: (text, record) => {
            return {
              children: (
                <div
                  style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer"
                  onDblclick={() => this.handleNameEdit(record)}
                >
                  {text}
                </div>
              ),
              attrs: {
                title: text // 鼠标悬停时显示的完整内容
              }
            }
          },
          ellipsis: true,
          fixed: 'left'
        },
        {
          title: 'External IP',
          dataIndex: 'external_ip',
          key: 'external_ip',
          width: 100,
          scopedSlots: { customRender: 'external_ip' },
          ellipsis: true
        },
        {
          title: 'Internal IP',
          dataIndex: 'internal_ip',
          key: 'internal_ip',
          width: 100,
          scopedSlots: { customRender: 'internal_ip' },
          ellipsis: true
        },
        {
          title: 'OS',
          dataIndex: 'os',
          key: 'os',
          width: 100,
          ellipsis: true
        },
        {
          title: 'Username',
          dataIndex: 'username',
          key: 'username',
          width: 100,
          ellipsis: true
        },
        {
          title: 'PID',
          dataIndex: 'pid',
          key: 'pid',
          width: 100,
          ellipsis: true
        },
        {
          title: 'Process Name',
          dataIndex: 'process_name',
          key: 'process_name',
          width: 100,
          ellipsis: true
        },
        {
          title: 'CPU',
          dataIndex: 'cpu',
          key: 'cpu',
          width: 100,
          ellipsis: true
        },
        {
          title: 'Memory',
          dataIndex: 'memory',
          key: 'memory',
          width: 100,
          ellipsis: true
        },
        {
          title: 'Hostname',
          dataIndex: 'hostname',
          key: 'hostname',
          width: 100,
          ellipsis: true
        },
        {
          title: 'Create Time',
          dataIndex: 'create_time',
          key: 'create_time',
          width: 100,
          ellipsis: true
          // customRender: (text) => this.formatDate(text)
        },
        {
          title: 'Last Seen',
          dataIndex: 'last_seen',
          key: 'last_seen',
          width: 100,
          ellipsis: true
          // customRender: (text) => this.formatDate(text)
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          ellipsis: true,
          customRender: (text) => {
            return <a-tag color={this.statusColor(text)}>{text}</a-tag>
          },
          fixed: 'right'
        },
        {
          title: 'Action',
          key: 'action',
          width: 100,
          scopedSlots: { customRender: 'action' },
          fixed: 'right'
        }
      ]
    }
  },
  methods: {
    statusColor (status) {
      console.log('status:', status)
      switch (status) {
        case 'Idle':
          return 'yellow'
        case 'Working':
          return 'green'
        case 'Dead':
          return 'red'
        default:
          return 'blue'
      }
    },
    fetchData (resetPage = false) {
      if (resetPage) {
        this.pagination.current = 1
      }
      this.loadData({ pagination: this.pagination })
    },
    async loadData (parameter) {
      this.loading = true
      const pagination = parameter.pagination

      try {
        const response = await getGrunt({ page: pagination.current, page_size: pagination.pageSize })
        let filteredData = response.data
        const { pageNo, pageSize, totalCount } = response
        // 在这里根据queryParam来过滤数据
        if (this.queryParam.name) {
          filteredData = filteredData.filter(item => item.name.includes(this.queryParam.name))
        }
        if (this.queryParam.status) {
          filteredData = filteredData.filter(item => item.status.toString() === this.queryParam.status)
        }
        if (this.queryParam.hostname) {
          filteredData = filteredData.filter(item => item.hostname.includes(this.queryParam.hostname))
        }

        // 如果开启了高级搜索并且有相关参数，继续过滤
        if (this.advanced) {
          if (this.queryParam.external_ip) {
            filteredData = filteredData.filter(item => item.external_ip === this.queryParam.external_ip)
          }
          if (this.queryParam.internal_ip) {
            filteredData = filteredData.filter(item => item.internal_ip === this.queryParam.internal_ip)
          }
          // 日期过滤需要转换为相同的格式进行比较
          if (this.queryParam.create_time) {
            const searchDate = this.queryParam.date.format('YYYY-MM-DD')
            filteredData = filteredData.filter(item => {
              const itemDate = this.formatDate(item.create_time)
              return itemDate === searchDate
            })
          }
        }
        const mappedData = filteredData.map(item => ({
          key: item.client_id, // 假设每条记录都有一个唯一的client_id作为key
          name: item.name,
          os: item.os,
          external_ip: item.external_ip,
          internal_ip: item.internal_ip,
          status: item.status,
          username: item.username,
          pid: item.pid,
          process_name: item.process_name,
          cpu: item.cpu,
          memory: item.memory,
          hostname: item.hostname,
          last_seen: this.formatDate(item.last_seen), // 假设你有formatDate方法来格式化日期
          create_time: this.formatDate(item.create_time)
        }))

        this.pagination.current = pageNo
        this.pagination.pageSize = pageSize
        this.pagination.total = totalCount

        this.data = mappedData
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        this.loading = false
      }
    },
    handleTableChange (pagination, filters, sorter) {
      this.pagination = pagination
      this.loadData({
        pagination,
        filters,
        sorter
      })
    },
    onSelectChange (selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys
      this.selectedRows = selectedRows
    },
    handleEdit (record) {
      this.$router.push({ path: `/grunts/${record.key}` })
    },
    formatDate (timestamp) {
      const isMilliseconds = timestamp > 1e10
      const format = 'YYYY-MM-DD HH:mm:ss'
      return isMilliseconds ? moment(timestamp).format(format) : moment.unix(timestamp).format(format)
    },
    toggleAdvanced () {
      this.advanced = !this.advanced
    },
    handleRowDblclick (record) {
      this.handleEdit(record)
    },
    deleteRow (key) {
      deleteGruntByClientId(key).then(() => {
        this.fetchData()
      }).catch(error => {
        console.error('Error deleting grunt:', error)
      })
    },
    handleNameEdit (record) {
      let inputValue = record.name

      const inputComponent = {
        data () {
          return {}
        },
        render (h) {
          return h(Input, {
            props: {
              value: inputValue
            },
            on: {
              input: (event) => {
                inputValue = event.target.value
              }
            }
          })
        }
      }
      Modal.confirm({
        title: '请输入新的名称',
        content: h => h(inputComponent),
        onOk: () => {
          const updatedInfo = {
            client_id: record.key,
            name: inputValue
          }
          updateGruntName(updatedInfo).then(() => {
            this.$message.success('名称更新成功')
            this.fetchData()
          }).catch(error => {
            console.error('更新失败', error)
            this.$message.error('更新失败')
          })
        }
      })
    },
    resetSearchForm () {
      this.queryParam = {
        name: '',
        status: '',
        hostname: '',
        external_ip: '',
        internal_ip: '',
        create_time: null
      }
    }
  },
  mounted () {
    this.fetchData()
  }
}
</script>

<style scoped>
.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis
}
</style>
