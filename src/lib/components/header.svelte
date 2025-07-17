<script>
  import Tlogo from '$lib/images/Tlogo.webp';
  import logo from '$lib/images/OBlogo.webp';
  export let user = null;
</script>

<header class="bg-black py-1 px-4 shadow-md">
  <div class="flex">
    <img src={logo} alt="Logo" class="h-35  pl-[10%]" />
    <img src={Tlogo} alt="Logo" class="h-20 mt-8  pl-[2%]" />
  </div>
  <div class="container mx-auto flex justify-between items-center relative text-white">
    {#if !user}
      <a
        href="/login"
        class="absolute right-4 top -translate-y-17 text-white text-sm bg-white/30 px-3 py-1 rounded hover:bg-white/40 transition"
      >
        تسجيل الدخول
      </a>
    {:else}
      <p>مرحبا</p>
    {/if}

  </div>
</header>
