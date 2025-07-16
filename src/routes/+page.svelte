<script>
	import HEADER from '$lib/components/header.svelte';
  	import FOOTER from '$lib/components/footer.svelte';
	export let data;

</script>

<HEADER user={data.user}/>
<div class="h-[100vh]"></div>
<FOOTER/>