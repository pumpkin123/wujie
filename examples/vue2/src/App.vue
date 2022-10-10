<template>
  <div id="app">
    <van-sticky>
      <div style="height:100px; background: #ccc">吸顶元素</div>
    </van-sticky>
    <div style="height:500px; background: #ebeef5">长元素</div>
    <div id="nav">
      <router-link to="/home">首页</router-link> | <router-link to="/dialog">弹窗</router-link> |
      <router-link to="/location">路由</router-link> | <router-link to="/communication">通信</router-link>
    </div>
    <router-view />
  </div>
</template>

<script>
import VanSticky from "./components/VanSticky"
export default {
  watch: {
    // 在 vue2-sub 路由下主动告知主应用路由跳转，主应用也跳到相应路由高亮菜单栏
    $route() {
      window.$wujie?.bus.$emit("sub-route-change", "vue2", this.$route.path);
    },
  },
  components: {
    VanSticky,
  },
};
</script>
