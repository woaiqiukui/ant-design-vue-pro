import request from '@/utils/request'

const GruntUri = '/task/grunts'

export function getGrunt () {
  return request({
    url: GruntUri,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
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
