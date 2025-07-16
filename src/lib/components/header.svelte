<script>
  import logo from '$lib/images/OBlogo.webp';
  export let user = null;
</script>

<header class="bg-black py-1 px-4 shadow-md">
  <img src={logo} alt="Logo" class="h-35 place-self-end pr-[10%]" />

  <div class="container mx-auto flex justify-between items-center relative text-white">
    {#if !user}
      <a
        href="/login"
        class="absolute left-4 top -translate-y-17 text-white text-sm bg-white/30 px-3 py-1 rounded hover:bg-white/40 transition"
      >
        تسجيل الدخول
      </a>
    {:else}
      <p>مرحبا</p>
    {/if}

  </div>
</header>
