<script lang="ts">
  import NavPane from "$lib/components/NavPane.svelte";
  import ContentPane from "$lib/components/ContentPane.svelte";
  import InfoPane from "$lib/components/InfoPane.svelte";
</script>

<main class="flex h-screen w-screen overflow-hidden">
  <div class="flex-none w-64 bg-gray-100 border-r border-gray-300">
    <NavPane />
  </div>
  <div class="flex-1 bg-white">
    <ContentPane />
  </div>
  <div class="flex-none w-52 bg-gray-200 border-l border-gray-300">
    <InfoPane />
  </div>
</main>
