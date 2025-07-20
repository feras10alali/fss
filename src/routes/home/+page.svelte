<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import PocketBase from 'pocketbase';
  import logo from '$lib/images/OBlogo.webp'
  import Tlogo from '$lib/images/BTlogo.webp'
  export let data;

  const pb = new PocketBase('http://127.0.0.1:8090');

  let files = [];
  let folders = [];
  let allItems = [];
  let recentItems = [];
  let favorites = data?.favorites || [];
  let storageUsed = data?.storageUsed || 0;
  let storageTotal = data?.storageTotal || 15;
  let viewMode = 'grid';
  let searchQuery = '';
  let currentView = 'my-drive'; // my-drive, shared, recent, starred, trash
  let showNewModal = false;
  let uploading = false;
  let uploadProgress = 0;

  // File input reference
  let fileInput;
  let createFolderForm;
  let uploadForm;

  // Current view data
  let currentItems = [];
  let currentTitle = 'My Drive';

  // Initialize data
  $: {
    const safeFiles = data?.files || [];
    const safeFolders = data?.folders || [];
    
    allItems = [
      ...safeFolders.map(folder => ({
        ...folder,
        type: 'folder',
        size: 'folder',
        modified: formatDate(folder.updated),
        starred: favorites.includes(folder.id)
      })),
      ...safeFiles.map(file => ({
        ...file,
        type: getFileType(file.mime_type),
        size: formatFileSize(file.size),
        modified: formatDate(file.updated),
        starred: favorites.includes(file.id)
      }))
    ];
  }

  // Update current view data
  $: {
    switch (currentView) {
      case 'my-drive':
        currentItems = allItems;
        currentTitle = 'My Drive';
        break;
      case 'shared':
        currentItems = allItems.filter(item => item.shared_with_me);
        currentTitle = 'Shared with me';
        break;
      case 'recent':
        currentItems = allItems.slice(0, 10);
        currentTitle = 'Recent';
        break;
      case 'starred':
        currentItems = allItems.filter(item => item.starred);
        currentTitle = 'Starred';
        break;
      case 'trash':
        currentItems = allItems.filter(item => item.is_deleted);
        currentTitle = 'Trash';
        break;
      default:
        currentItems = allItems;
        currentTitle = 'My Drive';
    }
  }

  // Get recent items (last 4)
  $: recentItems = allItems.slice(0, 4);

  // Filter items based on search
  $: filteredItems = currentItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getFileType(mimeType) {
    if (!mimeType) return 'file';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('msword')) return 'doc';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    
    return 'file';
  }

  function getFileIcon(type) {
    const icons = {
      folder: '📁',
      pdf: '📄',
      doc: '📝',
      spreadsheet: '📊',
      presentation: '📎',
      video: '🎥',
      image: '🖼️',
      audio: '🎵',
      file: '📄'
    };
    return icons[type] || '📄';
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  }

  async function toggleStar(itemId, resourceType) {
    try {
      // Load auth from cookie if not already loaded
      if (!pb.authStore.isValid) {
        pb.authStore.loadFromCookie(document.cookie);
      }

      const isStarred = favorites.includes(itemId);
      
      if (isStarred) {
        const favorite = await pb.collection('favorites').getFirstListItem(
          `user = "${data?.user?.id}" && resource_id = "${itemId}" && resource_type = "${resourceType}"`
        );
        await pb.collection('favorites').delete(favorite.id);
        favorites = favorites.filter(id => id !== itemId);
      } else {
        await pb.collection('favorites').create({
          user: data?.user?.id,
          resource_id: itemId,
          resource_type: resourceType
        });
        favorites = [...favorites, itemId];
      }
      
      // Update the item's starred status
      allItems = allItems.map(item => 
        item.id === itemId ? { ...item, starred: !item.starred } : item
      );
    } catch (error) {
      console.error('Error toggling star:', error);
      if (error.status === 401 || error.status === 403) {
        alert('Authentication required. Please refresh the page and try again.');
      }
    }
  }

  function handleItemClick(item) {
    if (item.type === 'folder') {
      goto(`/folder/${item.id}`);
    } else {
      // Load auth from cookie if not already loaded
      if (!pb.authStore.isValid) {
        pb.authStore.loadFromCookie(document.cookie);
      }
      const fileUrl = pb.getFileUrl(item, item.file);
      window.open(fileUrl, '_blank');
    }
  }

  function switchView(view) {
    currentView = view;
  }

  function openNewModal() {
    showNewModal = true;
  }

  function closeNewModal() {
    showNewModal = false;
  }

  async function createNewFolder() {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      // Create form data and submit via the server action
      const formData = new FormData();
      formData.append('name', folderName);
      const currentFolder = $page.url.searchParams.get('folder') || null;
      if (currentFolder) {
        formData.append('parent_folder', currentFolder);
      }

      const response = await fetch('?/createFolder', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.type === 'success') {
        console.log('Folder created successfully');
        // Refresh the page to show the new folder
        location.reload();
      } else {
        console.error('Server action failed:', result);
        alert('Failed to create folder: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder: ' + (error.message || 'Network error'));
    }
    
    closeNewModal();
  }

  function triggerFileUpload() {
    fileInput.click();
    closeNewModal();
  }

  // Enhanced file upload handler that uses server actions
  async function handleFileUpload(event) {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    uploading = true;
    uploadProgress = 0;

    try {
      const totalFiles = selectedFiles.length;
      let completedFiles = 0;
      let successfulUploads = 0;

      for (const file of selectedFiles) {
        try {
          console.log(`Uploading file: ${file.name}`);
          
          // Create form data for server action
          const formData = new FormData();
          formData.append('file', file);
          
          const currentFolder = $page.url.searchParams.get('folder') || null;
          if (currentFolder) {
            formData.append('parent_folder', currentFolder);
          }

          // Submit via server action
          const response = await fetch('?/uploadFile', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            if (result.type === 'success') {
              console.log(`File "${file.name}" uploaded successfully`);
              successfulUploads++;
            } else {
              console.error(`Server action failed for file "${file.name}":`, result);
            }
          } else {
            console.error(`HTTP error for file "${file.name}":`, response.status, response.statusText);
          }

        } catch (fileError) {
          console.error(`Failed to upload file "${file.name}":`, fileError);
        }

        completedFiles++;
        uploadProgress = (completedFiles / totalFiles) * 100;
      }

      if (successfulUploads > 0) {
        console.log(`Successfully uploaded ${successfulUploads} out of ${totalFiles} files`);
        // Refresh the page to show new files
        await new Promise(resolve => setTimeout(resolve, 500));
        location.reload();
      } else {
        alert('No files were uploaded successfully. Please try again.');
      }

    } catch (error) {
      console.error('Upload process failed:', error);
      alert('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      uploading = false;
      uploadProgress = 0;
      event.target.value = ''; // Clear the file input
    }
  }

  onMount(() => {
    // Load authentication from cookie
    pb.authStore.loadFromCookie(document.cookie);
    
    // Verify authentication matches server data
    if (pb.authStore.isValid && data?.user && pb.authStore.model?.id !== data.user.id) {
      console.warn('Authentication mismatch detected');
      console.log('Client auth user ID:', pb.authStore.model?.id);
      console.log('Server user ID:', data.user.id);
    }

    console.log('Dashboard mounted with user:', data?.user?.email);
    console.log('Files count:', data?.files?.length || 0);
    console.log('Folders count:', data?.folders?.length || 0);
  });
</script>

<svelte:head>
  <title>Dashboard - Drive</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="flex items-center px-4 py-2 bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="flex items-center mr-auto">
      <img src={logo} alt="logo" class="w-18 ml-1">
      <img src={Tlogo} alt="text logo" class="w-26 ml-1.5">
    </div>
    
    <div class="relative max-w-2xl w-full mx-8">
      <input 
        type="text" 
        placeholder="Search files and folders"
        class="w-full py-3 pl-4 pr-12 border border-gray-200 rounded-lg bg-gray-100 text-base outline-none focus:bg-white focus:shadow-lg transition-all"
        bind:value={searchQuery}
      />
      <span class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600">🔍</span>
    </div>

    <div class="flex items-center gap-2">
      <button 
        class="p-2 border-none bg-transparent rounded cursor-pointer text-lg text-gray-600 hover:bg-gray-100 {viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : ''}"
        title="Grid view" 
        on:click={() => viewMode = 'grid'}
      >
        ⊞
      </button>
      <button 
        class="p-2 border-none bg-transparent rounded cursor-pointer text-lg text-gray-600 hover:bg-gray-100 {viewMode === 'list' ? 'bg-blue-50 text-blue-600' : ''}"
        title="List view" 
        on:click={() => viewMode = 'list'}
      >
        ☰
      </button>
      <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center ml-2 font-medium uppercase">
        {data?.user?.name?.charAt(0) || data?.user?.email?.charAt(0) || '👤'}
      </div>
    </div>
  </header>

  <div class="flex min-h-[calc(100vh-65px)]">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <button 
        class="flex items-center gap-3 py-3 px-4 border border-gray-200 rounded-3xl bg-white text-sm font-medium cursor-pointer mb-6 shadow-sm hover:shadow-md transition-shadow"
        on:click={openNewModal}
      >
        <span class="text-lg text-blue-600">+</span>
        New
      </button>

      <nav class="flex flex-col gap-1 mb-8">
        <button 
          class="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-600 text-sm no-underline hover:bg-gray-100 {currentView === 'my-drive' ? 'bg-blue-50 text-blue-600 font-medium' : ''}"
          on:click={() => switchView('my-drive')}
        >
          <span class="text-base">🏠</span>
          My Drive
        </button>
        <button 
          class="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-600 text-sm no-underline hover:bg-gray-100 {currentView === 'shared' ? 'bg-blue-50 text-blue-600 font-medium' : ''}"
          on:click={() => switchView('shared')}
        >
          <span class="text-base">👥</span>
          Shared with me
        </button>
        <button 
          class="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-600 text-sm no-underline hover:bg-gray-100 {currentView === 'recent' ? 'bg-blue-50 text-blue-600 font-medium' : ''}"
          on:click={() => switchView('recent')}
        >
          <span class="text-base">🕒</span>
          Recent
        </button>
        <button 
          class="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-600 text-sm no-underline hover:bg-gray-100 {currentView === 'starred' ? 'bg-blue-50 text-blue-600 font-medium' : ''}"
          on:click={() => switchView('starred')}
        >
          <span class="text-base">⭐</span>
          Starred
        </button>
        <button 
          class="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-600 text-sm no-underline hover:bg-gray-100 {currentView === 'trash' ? 'bg-blue-50 text-blue-600 font-medium' : ''}"
          on:click={() => switchView('trash')}
        >
          <span class="text-base">🗑️</span>
          Trash
        </button>
      </nav>

      <div class="mt-auto p-4 bg-gray-50 rounded-lg">
        <h3 class="m-0 mb-3 text-sm font-medium text-gray-700">Storage</h3>
        <div class="w-full h-1 bg-gray-200 rounded-full mb-2">
          <div 
            class="h-full bg-blue-600 rounded-full transition-all duration-300"
            style="width: {(storageUsed / storageTotal) * 100}%"
          ></div>
        </div>
        <p class="text-xs text-gray-600 m-0 mb-3">{storageUsed} GB of {storageTotal} GB used</p>
        <button class="py-1.5 px-3 border border-blue-600 rounded bg-transparent text-blue-600 text-xs cursor-pointer hover:bg-blue-50">
          Get more storage
        </button>
      </div>
    </aside>

    <!-- Main content area -->
    <main class="flex-1 p-6 overflow-y-auto">
      <!-- Upload Progress -->
      {#if uploading}
        <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-blue-800">Uploading files...</span>
            <span class="text-sm text-blue-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div class="w-full bg-blue-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style="width: {uploadProgress}%"
            ></div>
          </div>
        </div>
      {/if}

      <!-- Quick access - only show on My Drive -->
      {#if currentView === 'my-drive' && recentItems.length > 0}
        <section class="mb-8">
          <h2 class="text-lg font-normal text-gray-700 mb-4">Recent files</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {#each recentItems as item}
              <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-blue-600" on:click={() => handleItemClick(item)}>
                <div class="text-2xl">{getFileIcon(item.type)}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-700 truncate">{item.name}</div>
                  <div class="text-xs text-gray-500">{item.modified}</div>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Files section -->
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-normal text-gray-700">{currentTitle}</h2>
          <div class="text-sm text-gray-600">{filteredItems.length} items</div>
        </div>

        {#if filteredItems.length > 0}
          <div class="{viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'flex flex-col gap-2'}">
            {#each filteredItems as item}
              <div class="flex {viewMode === 'grid' ? 'flex-col items-center text-center p-4' : 'flex-row items-center gap-3 p-3'} bg-white rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-blue-600 relative group" on:click={() => handleItemClick(item)}>
                <div class="text-{viewMode === 'grid' ? '3xl' : '2xl'} {viewMode === 'grid' ? 'mb-2' : ''}">{getFileIcon(item.type)}</div>
                <div class="flex-1 {viewMode === 'grid' ? 'w-full' : ''} min-w-0">
                  <div class="text-sm font-medium text-gray-700 {viewMode === 'grid' ? 'mb-1' : 'mb-1'} truncate">{item.name}</div>
                  <div class="flex {viewMode === 'grid' ? 'flex-col gap-0.5' : 'gap-2'} text-xs text-gray-500">
                    <span>{item.size}</span>
                    <span>{item.modified}</span>
                  </div>
                </div>
                <button 
                  class="absolute top-2 right-2 p-1 bg-transparent border-none text-base cursor-pointer rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity {item.starred ? 'opacity-100 text-yellow-400' : ''}"
                  on:click|stopPropagation={() => toggleStar(item.id, item.type === 'folder' ? 'folder' : 'file')}
                >
                  {item.starred ? '⭐' : '☆'}
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="text-5xl mb-4 opacity-50">📁</div>
            <h3 class="text-xl font-normal text-gray-700 mb-2">No files found</h3>
            <p class="text-sm text-gray-500 m-0">
              {currentView === 'my-drive' ? 'Upload your first file to get started' : `No items in ${currentTitle.toLowerCase()}`}
            </p>
          </div>
        {/if}
      </section>
    </main>
  </div>
</div>

<!-- New Modal -->
{#if showNewModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeNewModal}>
    <div class="bg-white rounded-lg p-6 w-80 max-w-md" on:click|stopPropagation>
      <h3 class="text-lg font-semibold mb-4">Create New</h3>
      <div class="space-y-2">
        <button 
          class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
          on:click={createNewFolder}
        >
          <span class="text-xl">📁</span>
          <span>New folder</span>
        </button>
        <button 
          class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
          on:click={triggerFileUpload}
        >
          <span class="text-xl">📄</span>
          <span>Upload files</span>
        </button>
      </div>
      <div class="mt-4 flex justify-end">
        <button 
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          on:click={closeNewModal}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Hidden file input -->
<input 
  type="file" 
  multiple 
  bind:this={fileInput}
  on:change={handleFileUpload}
  class="hidden"
/>

<!-- Hidden forms for server actions -->
<form bind:this={createFolderForm} method="POST" action="?/createFolder" style="display: none;" use:enhance></form>
<form bind:this={uploadForm} method="POST" action="?/uploadFile" enctype="multipart/form-data" style="display: none;" use:enhance></form>

<style>
  @media (max-width: 768px) {
    aside {
      position: fixed;
      left: -16rem;
      top: 65px;
      height: calc(100vh - 65px);
      z-index: 40;
      transition: left 0.3s ease;
    }
    
    main {
      width: 100%;
      padding: 1rem;
    }
    
    .relative.max-w-2xl {
      margin: 0 1rem;
    }
  }
</style>