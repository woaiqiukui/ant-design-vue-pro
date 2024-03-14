<template>
  <div>
    <dx-file-manager
      :file-system-provider="remoteProvider"
      :on-selected-file-opened="displayImagePopup"
      current-path="Widescreen"
    >
      <dx-permissions
        :create="true"
        :copy="true"
        :move="true"
        :delete="true"
        :rename="true"
        :upload="true"
        :download="true"
      ></dx-permissions>
    </dx-file-manager>

    <dx-popup
      :hide-on-outside-click="true"
      :show-close-button="true"
      v-model="popupVisible"
      :title="imageItemToDisplay.name"
      max-height="600"
      class="photo-popup-content"
    >
      <template #content>
        <img :src="imageItemToDisplay.url" class="photo-popup-image">
      </template>
    </dx-popup>
  </div>
</template>

<script>
import { DxFileManager, DxPermissions } from 'devextreme-vue/file-manager'
import { DxPopup } from 'devextreme-vue/popup'
import 'devextreme/dist/css/dx.light.css'

export default {
  name: 'FileManager',
  components: {
    DxFileManager,
    DxPermissions,
    DxPopup
  },
  data () {
    return {
      popupVisible: false,
      imageItemToDisplay: {},
      remoteProvider: this.initRemoteProvider()
      // 使用 customFileSystemProvider 作为 remoteProvider 的值
      // remoteProvider: this.customFileSystemProvider
    }
  },
  methods: {
    initRemoteProvider () {
      const RemoteFileSystemProvider = require('devextreme/file_management/remote_provider').default
      return new RemoteFileSystemProvider({
        endpointUrl: 'https://js.devexpress.com/Demos/Mvc/api/file-manager-file-system-images'
      })
    },
    displayImagePopup (e) {
      this.imageItemToDisplay = {
        name: e.file.name,
        url: e.file.dataItem.url
      }
      this.popupVisible = true
    }
  }
}
</script>

<style>
.photo-popup-content {
  text-align: center;
}

.photo-popup-content .photo-popup-image {
  height: 100%;
  max-width: 100%;
}
</style>
