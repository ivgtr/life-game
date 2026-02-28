<script lang="ts">
  interface Props {
    message: string
  }
  const { message }: Props = $props()
</script>

<main class="flex h-screen items-center justify-center bg-neutral-950 text-neutral-100">
  <div class="max-w-md text-center">
    <h1 class="text-2xl font-light tracking-wider">Generative Literature</h1>
    <p class="mt-4 text-sm text-red-400">{message}</p>
    <p class="mt-6 text-xs text-neutral-500">
      対応ブラウザ: Chrome 113+, Edge 113+, Firefox Nightly
    </p>
  </div>
</main>
