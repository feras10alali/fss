<script>
	import logo from '$lib/images/OBlogo.webp';
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { Instagram, Youtube } from 'lucide-svelte';

	let show = false;
	let footerContent;

	onMount(() => {
		const observer = new IntersectionObserver(
			([entry]) => (show = entry.isIntersecting),
			{ threshold: 0.2 }
		);
		if (footerContent) observer.observe(footerContent);
	});
</script>

<footer class="w-full min-h-[30vh] bg-black text-white overflow-hidden" dir="ltr">
  <div bind:this={footerContent}>
    {#if show}
      <div
        in:slide={{ y: 50, duration: 600 }}
        out:slide={{ y: 50, duration: 1 }}
        class="max-w-7xl mx-auto h-full flex flex-col sm:flex-row justify-between items-center sm:items-start px-6 py-12 gap-10 sm:gap-0"
      >
        <!-- Logo (now first and on the left) -->
        <div class="w-full sm:w-auto flex justify-center sm:justify-start">
          <img src={logo} alt="Logo" class="w-40 sm:w-52 object-contain" />
        </div>

        <!-- Text Section (now second and on the right) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 text-sm sm:text-base font-light w-full sm:w-auto text-center sm:text-left">
          <!-- Social Media -->
          <div>
            <h3 class="font-semibold mb-2">Social Media</h3>
            <ul class="space-y-2 text-white/90">
              <li class="flex justify-center sm:justify-start items-center gap-2">
                <a
                  href="https://www.instagram.com/alqaema?igsh=ODg3MmFsNW1sdzFq"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <span>Instagram</span>
                  <Instagram class="w-5 h-5" />
                </a>
              </li>
              <li class="flex justify-center sm:justify-start items-center gap-2">
                <a
                  href="https://youtube.com/@imamqaemhussainyah?si=V3eRk46LEf2DQLdp"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <span>Youtube</span>
                  <Youtube class="w-5 h-5" />
                </a>
              </li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h3 class="font-semibold mb-2">Support</h3>
            <ul class="space-y-1 text-white/90">
              <li class="cursor-pointer hover:text-white transition-colors">Report a problem</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</footer>
