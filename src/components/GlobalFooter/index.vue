<template>
  <global-footer class="footer custom-render">
    <template v-slot:links>
      <a href="https://www.github.com/vueComponent/ant-design-vue-pro" target="_blank">前端基于 ant_design 开发</a>
    </template>
    <template v-slot:copyright>
      <p>&copy; 2023 Yanggu Platform. All Rights Reserved.</p>
    </template>
  </global-footer>
</template>

<script>
import { GlobalFooter } from '@ant-design-vue/pro-layout'

export default {
  name: 'ProGlobalFooter',
  components: {
    GlobalFooter
  }
}
</script>
