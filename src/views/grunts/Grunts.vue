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
                <a-select v-model="queryParam.status" placeholder="请选择" default-value="0">
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
              <span class="table-page-search-submitButtons" style="float: right;">
                <a-button type="primary" @click="$refs.table.refresh(true)">查询</a-button>
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
            <!-- lock | unlock -->
            <a-menu-item key="2"><a-icon type="lock" />锁定</a-menu-item>
          </a-menu>
          <a-button style="margin-left: 8px">
            批量操作 <a-icon type="down" />
          </a-button>
        </a-dropdown>
      </div>

      <s-table
        ref="table"
        size="default"
        rowKey="key"
        :columns="columns"
        :data="loadData"
        :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        :scroll="{ x: 'max-content' }"
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
                <a href="javascript:;">详情</a>
              </a-menu-item>
            </a-menu>
          </a-dropdown>
        </span>
      </s-table>
    </template>
  </a-card>
</template>

<script>
import moment from 'moment'
import { STable } from '@/components'
import { getGrunt } from '@/api/grunt'

export default {
  name: 'GruntList',
  components: {
    STable
  },
  data () {
    return {
      // 高级搜索 展开/关闭
      advanced: false,
      // 查询参数
      queryParam: {},
      // 表头
      columns: [
        {
          title: 'Name',
          dataIndex: 'name',
          width: 200,
          customRender: (text) => {
            return {
              children: (
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 200px;">
                  {text}
                </div>
              ),
              attrs: {
                title: text // 鼠标悬停时显示的完整内容
              }
            }
          }
        },
        {
          title: 'OS',
          dataIndex: 'os'
        },
        {
          title: 'External_IP',
          dataIndex: 'external_ip'
        },
        {
          title: 'Internal_IP',
          dataIndex: 'internal_ip'
        },
        {
          title: 'STATUS',
          dataIndex: 'status'
        },
        {
          title: 'Username',
          dataIndex: 'username'
        },
        {
          title: 'PID',
          dataIndex: 'pid'
        },
        {
          title: 'Process_Name',
          dataIndex: 'process_name'
        },
        {
          title: 'CPU',
          dataIndex: 'cpu'
        },
        {
          title: 'Memory',
          dataIndex: 'memory'
        },
        {
          title: 'Hostname',
          dataIndex: 'hostname'
        },
        {
          title: 'Last_Seen',
          dataIndex: 'last_seen',
          sorter: true
        },
        {
          title: 'Create_Time',
          dataIndex: 'create_time',
          sorter: true
        },
        {
          title: '操作',
          dataIndex: 'action',
          width: '150px',
          scopedSlots: { customRender: 'action' }
        }
      ],
      selectedRowKeys: [],
      selectedRows: []
    }
  },
  methods: {
    loadData (parameter) {
      return getGrunt().then(response => {
        // 这里假设response是包含所有grunt对象的数组
        let filteredData = response

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

        return {
          data: mappedData, // 表格数据
          total: response.length // 假设response数组的长度就是数据的总数
        }
      }).catch(error => {
        // 错误处理
        console.error('Error fetching data:', error)
        // 根据你的实际需求来决定如何处理错误
        // 这里可以返回一个空数组或其他默认值，以避免进一步的错误
        return { data: [], total: 0 }
      })
    },

    onSelectChange (selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys
      this.selectedRows = selectedRows
    },

    formatDate (timestamp) {
      // 使用moment库来格式化时间戳
      return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
    },

    toggleAdvanced () {
      this.advanced = !this.advanced
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
  }
}
</script>
