import request from '@/utils/request'

const ListenerUri = '/task/listeners'

export function getListener () {
  return request({
    url: ListenerUri,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function addListener (parameter) {
  return request({
    url: ListenerUri,
    method: 'post',
    data: parameter
  })
}

export function updateListener (parameter) {
  return request({
    url: ListenerUri,
    method: 'put',
    data: parameter
  })
}
