<script>
  import { onMount } from 'svelte';
  import logo from '$lib/images/OBlogo.webp'
  import Tlogo from '$lib/images/Tlogo.webp'
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
  
  const features = [
    {
      icon: "🔒",
      title: "Secure Storage",
      description: "Your files are protected with enterprise-grade encryption"
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Upload and download files at blazing speeds"
    },
    {
      icon: "🌐",
      title: "Access Anywhere",
      description: "Access your files from any device, anywhere in the world"
    },
    {
      icon: "🔄",
      title: "Auto Sync",
      description: "Keep all your devices in sync automatically"
    }
  ];
</script>

<svelte:head>
  <title>FSS - Feras Storage Services</title>
</svelte:head>

<div class="min-h-screen bg-black text-white">
  <!-- Navigation -->
  <nav class="fixed top-0 w-full bg-black/80 backdrop-blur-lg border-b border-gray-800 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-3">
          <!-- Logo placeholder - you can replace with your webp logo -->
          <img src={logo} alt="FSS Logo" class="w-16" />
		  <img src={Tlogo} alt="FSS text Logo" class="w-16" />
        </div>
        
        <div class="hidden md:flex items-center space-x-8">
          <a href="#features" class="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#pricing" class="text-gray-300 hover:text-white transition-colors">Pricing</a>
          <a href="/about" class="text-gray-300 hover:text-white transition-colors">About</a>
          <button class="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center">
        <div class="animate-fade-in" class:opacity-100={mounted} class:opacity-0={!mounted}>
          <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">
            Your Files,<br>
            <span class="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Everywhere
            </span>
          </h1>
          
          <p class="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Store, sync, and share your files with FSS. Get 500GB of free storage and access your content from anywhere.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl">
              Get Started Free
            </button>
            <button class="border border-gray-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-black transition-all">
              Learn More
            </button>
          </div>
          
          <!-- Free Storage Highlight -->
          <div class="inline-flex items-center bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-6 py-3">
            <span class="text-green-400 font-semibold text-lg">🎉 500GB Free Storage</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4 text-white">
          Why Choose FSS?
        </h2>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">
          Built for modern workflows with enterprise-grade security and consumer-friendly simplicity.
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {#each features as feature, i}
          <div class="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 hover:border-gray-600 transition-all hover:transform hover:scale-105">
            <div class="text-4xl mb-4">{feature.icon}</div>
            <h3 class="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
            <p class="text-gray-400 leading-relaxed">{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Storage Plans -->
  <section id="pricing" class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4 text-white">
          Simple Pricing
        </h2>
        <p class="text-xl text-gray-400">
          Start free, upgrade when you need more space.
        </p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Free Plan -->
        <div class="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
          <h3 class="text-2xl font-bold mb-2 text-white">Free</h3>
          <div class="text-4xl font-bold mb-4 text-white">
            $0<span class="text-lg text-gray-400">/month</span>
          </div>
          <ul class="space-y-3 mb-8 text-gray-300">
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> 500GB Storage</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> File Sync</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Mobile Apps</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Basic Support</li>
          </ul>
          <button class="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors">
            Get Started
          </button>
        </div>

        <!-- Pro Plan -->
        <div class="bg-gradient-to-b from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/30 relative">
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </span>
          </div>
          <h3 class="text-2xl font-bold mb-2 text-white">Pro</h3>
          <div class="text-4xl font-bold mb-4 text-white">
            $9<span class="text-lg text-gray-400">/month</span>
          </div>
          <ul class="space-y-3 mb-8 text-gray-300">
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> 2TB Storage</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Advanced Sync</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Team Sharing</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Priority Support</li>
          </ul>
          <button class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all">
            Upgrade Now
          </button>
        </div>

        <!-- Business Plan -->
        <div class="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
          <h3 class="text-2xl font-bold mb-2 text-white">Business</h3>
          <div class="text-4xl font-bold mb-4 text-white">
            $25<span class="text-lg text-gray-400">/month</span>
          </div>
          <ul class="space-y-3 mb-8 text-gray-300">
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Unlimited Storage</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> Team Management</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> API Access</li>
            <li class="flex items-center"><span class="text-green-400 mr-2">✓</span> 24/7 Support</li>
          </ul>
          <button class="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl md:text-5xl font-bold mb-6 text-white">
        Ready to get started?
      </h2>
      <p class="text-xl text-gray-300 mb-8">
        Join thousands of users who trust FSS with their files.
      </p>
      <button class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl">
        Start Your Free 500GB
      </button>
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
            Secure, fast, and reliable cloud storage for everyone.
          </p>
        </div>
        
        <div>
          <h4 class="font-semibold text-white mb-4">Product</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition-colors">Features</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold text-white mb-4">Company</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition-colors">About</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold text-white mb-4">Support</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Privacy</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 Feras Storage Services. All rights reserved.</p>
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