// auth-guard.js
export function setupAuthGuard (router) {
  router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('Access-Token')

    if (to.path !== '/user/login' && !isAuthenticated) {
      // 如果用户未登录且试图访问非登录页面，则重定向到登录页面
      next('/user/login')
    } else {
      // 如果用户已登录，或者正在访问登录页面，则直接放行
      next()
    }
  })
}
