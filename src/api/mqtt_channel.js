import request from '@/utils/request'

const MqttUri = 'task/mqtt_channels'

export function getMqttChannles () {
  return request({
    url: MqttUri,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

export function getMqttChannleByClentId (clientId) {
  return request({
    url: MqttUri + '/' + clientId,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
