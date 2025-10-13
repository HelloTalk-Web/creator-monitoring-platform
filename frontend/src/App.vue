<template>
  <div id="app">
    <Layout />
  </div>
</template>

<script setup lang="ts">
import Layout from '@/components/Layout.vue'
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--el-text-color-primary);
  min-height: 100vh;
}
</style>