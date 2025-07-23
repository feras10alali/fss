<script>
  import { onMount } from 'svelte';
  import logo from '$lib/images/OBlogo.webp'
  import Tlogo from '$lib/images/Tlogo.webp'
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  const stats = [
    { number: "500GB", label: "Free Storage" },
    { number: "1", label: "Developer" },
    { number: "24/7", label: "Uptime Goal" },
    { number: "∞", label: "Passion" }
  ];

  const timeline = [
    {
      year: "2024",
      title: "The Idea",
      description: "Frustrated with expensive cloud storage options, I decided to build something better and more affordable."
    },
    {
      year: "2025",
      title: "Development Begins",
      description: "Started building FSS with SvelteKit and PocketBase, focusing on simplicity and user experience."
    },
    {
      year: "Now",
      title: "Launch",
      description: "FSS is live, offering 500GB free storage to everyone. This is just the beginning."
    }
  ];
</script>

<svelte:head>
  <title>About FSS - Feras Storage Services</title>
</svelte:head>

<div class="min-h-screen bg-black text-white">
  <!-- Navigation -->
  <nav class="fixed top-0 w-full bg-black/80 backdrop-blur-lg border-b border-gray-800 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-3">
          <img src={logo} alt="FSS Logo" class="w-16" />
		      <img src={Tlogo} alt="FSS text Logo" class="w-16" />
        </div>
        
        <div class="hidden md:flex items-center space-x-8">
          <a href="/" class="text-gray-300 hover:text-white transition-colors">Home</a>
          <a href="/about" class="text-white font-medium">About</a>
          <a href="/privacy" class="text-gray-300 hover:text-white transition-colors">Privacy</a>
          <button class="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto text-center">
      <div class="animate-fade-in" class:opacity-100={mounted} class:opacity-0={!mounted}>
        <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
          About FSS
        </h1>
        <p class="text-xl md:text-2xl text-gray-400 mb-8 leading-relaxed">
          One developer's mission to make cloud storage affordable for everyone
        </p>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        {#each stats as stat}
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {stat.number}
            </div>
            <div class="text-gray-400 font-medium">{stat.label}</div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Story Section -->
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <div class="mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-8 text-white text-center">
          My Story
        </h2>
        
        <div class="prose prose-lg prose-invert max-w-none">
          <div class="bg-gray-800/50 rounded-2xl p-8 md:p-12 border border-gray-700/50">
            <div class="flex items-center mb-6">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <span class="text-white font-bold text-xl">F</span>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">Feras</h3>
                <p class="text-gray-400">Solo Developer & Founder</p>
              </div>
            </div>
            
            <div class="space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>
                Hi! I'm Feras, a passionate developer who got tired of seeing people struggle with expensive cloud storage solutions. 
                As someone who understands the frustration of running out of free storage space, I decided to do something about it.
              </p>
              
              <p>
                FSS (Feras Storage Services) was born from a simple belief: <strong class="text-white">everyone deserves access to affordable, reliable cloud storage</strong>. 
                While big tech companies offer measly amounts of free storage and charge premium prices for more, I wanted to create something different.
              </p>
              
              <p>
                Working alone as a solo developer, I've built FSS using modern technologies like SvelteKit and PocketBase to keep costs low 
                and pass those savings directly to you. My goal isn't to maximize profits – it's to provide a genuine alternative that 
                puts users first.
              </p>
              
              <p class="text-blue-400 font-semibold">
                That's why FSS offers 500GB of free storage – because I believe your files shouldn't be held hostage by subscription fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Mission Section -->
  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl md:text-5xl font-bold mb-16 text-white text-center">
        My Mission
      </h2>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
          <div class="text-4xl mb-4">🎯</div>
          <h3 class="text-xl font-semibold mb-4 text-white">Affordability First</h3>
          <p class="text-gray-400 leading-relaxed">
            Make cloud storage accessible to everyone, regardless of budget. No more choosing between your files and your wallet.
          </p>
        </div>
        
        <div class="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
          <div class="text-4xl mb-4">🔒</div>
          <h3 class="text-xl font-semibold mb-4 text-white">Privacy Focused</h3>
          <p class="text-gray-400 leading-relaxed">
            Your data belongs to you. Simple, transparent privacy practices without hidden agendas or data mining.
          </p>
        </div>
        
        <div class="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
          <div class="text-4xl mb-4">⚡</div>
          <h3 class="text-xl font-semibold mb-4 text-white">User Experience</h3>
          <p class="text-gray-400 leading-relaxed">
            Build tools that just work. No confusing interfaces, no bloated features – just simple, reliable file storage.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Timeline Section -->
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-4xl md:text-5xl font-bold mb-16 text-white text-center">
        The Journey
      </h2>
      
      <div class="space-y-8">
        {#each timeline as item, i}
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0 w-24 text-right">
              <span class="text-2xl font-bold text-blue-400">{item.year}</span>
            </div>
            <div class="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 relative">
              {#if i < timeline.length - 1}
                <div class="absolute top-4 left-1/2 w-0.5 h-16 bg-gray-700 transform -translate-x-1/2"></div>
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-white mb-2">{item.title}</h3>
              <p class="text-gray-400 leading-relaxed">{item.description}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl md:text-5xl font-bold mb-6 text-white">
        Let's Connect
      </h2>
      <p class="text-xl text-gray-300 mb-8">
        Have questions, suggestions, or just want to say hi? I'd love to hear from you.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105">
          Send Email
        </button>
        <button class="border border-gray-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-black transition-all">
          Follow Updates
        </button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
    <div class="max-w-7xl mx-auto">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">F</span>
            </div>
            <span class="text-xl font-bold text-white">FSS</span>
          </div>
          <p class="text-gray-400">
            Affordable cloud storage by a solo developer who cares.
          </p>
        </div>
        
        <div>
          <h4 class="font-semibold text-white mb-4">Product</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/" class="hover:text-white transition-colors">Features</a></li>
            <li><a href="/" class="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="/" class="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold text-white mb-4">Company</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/about" class="hover:text-white transition-colors">About</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold text-white mb-4">Legal</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Support</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 Feras Storage Services. Built with ❤️ by one developer.</p>
      </div>
    </div>
  </footer>
</div>

<style>
  .animate-fade-in {
    transition: opacity 0.8s ease-in-out;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in {
      transition: none;
    }
  }
</style>