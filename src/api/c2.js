import request from '@/utils/request'

const c2Api = {
  Listener: '/c2/listener/'
}

export function getListener () {
  return request({
    url: c2Api.Listener,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function getListenerById (id) {
  return request({
    url: c2Api.Listener + id,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function addListener (parameter) {
  return request({
    url: c2Api.Listener,
    method: 'post',
    data: parameter
  })
}

export function updateListener (parameter) {
  return request({
    url: c2Api.Listener,
    method: 'put',
    data: parameter
  })
}

export function deleteListener (id) {
  return request({
    url: c2Api.Listener + id,
    method: 'delete',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
