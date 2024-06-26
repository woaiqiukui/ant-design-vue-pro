import request from '@/utils/request'

const GruntUri = '/task/grunts'

export function getGrunt (params) {
  return request({
    url: GruntUri,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    params // 将参数添加到请求中
  })
}

export function getGruntByClientId (clientId) {
  return request({
    url: GruntUri + '/' + clientId,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function updateGruntName (parameter) {
  return request({
    url: GruntUri,
    method: 'post',
    data: parameter
  })
}

export function deleteGruntByClientId (clientId) {
  return request({
    url: GruntUri + '/' + clientId,
    method: 'delete'
  })
}
