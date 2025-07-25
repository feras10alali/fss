<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
  import PocketBase from 'pocketbase';
  import logo from '$lib/images/OBlogo.webp'
  import Tlogo from '$lib/images/BTlogo.webp'
  export let data;
  let showProfileDropdown = false;
  const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
  let files = [];
  let folders = [];
  let allItems = [];
  let recentItems = [];
  let favorites = data?.favorites || [];
  let storageUsed = data?.storageUsed || 0;
  let storageTotal = data?.storageTotal || 15;
  let viewMode = 'list';
  let searchQuery = '';
  let currentView = 'my-drive'; // my-drive, shared, recent, starred, trash
  let showNewModal = false;
  let uploading = false;
  let uploadProgress = 0;

  let showNewForm = false;
  let newItemType = ''; // 'file' or 'folder'
  let newItemName = '';
  let selectedPath = '/';
  let selectedParentFolderId = null; // Track the actual folder ID
  let availableFolders = [];

  let fileInput;
  let createFolderForm;
  let uploadForm;

  let currentItems = [];
  let currentTitle = 'My storge';
  let activeDropdown = null;

  let currentFolderId = null;
  let folderPath = [];
  let breadcrumbs = [{ id: null, name: 'My Storage' }];
  
  let currentShareItem = null;
  let showShareModal = false;
  let shareEmail = '';
  let sharePermission = 'view';
  let shareMessage = '';
  let shareExpiry = '';
  let isSharing = false;
  let shareError = '';
  let shareSuccess = '';

  function navigateToFolder(folder) {
    // Update current folder
    currentFolderId = folder.id;
    
    // Update breadcrumbs
    const existingIndex = breadcrumbs.findIndex(crumb => crumb.id === folder.id);
    if (existingIndex !== -1) {
      // If folder is already in breadcrumbs, truncate to that point
      breadcrumbs = breadcrumbs.slice(0, existingIndex + 1);
    } else {
      // Add new folder to breadcrumbs
      breadcrumbs = [...breadcrumbs, { id: folder.id, name: folder.name }];
    }
    
    // Update current view to show folder contents
    switchView('my-drive');
  }

  // 3. ADD THIS NEW FUNCTION (add after navigateToFolder)
  function navigateToBreadcrumb(breadcrumb) {
    currentFolderId = breadcrumb.id;
    
    // Update breadcrumbs - remove everything after the clicked breadcrumb
    const index = breadcrumbs.findIndex(crumb => crumb.id === breadcrumb.id);
    if (index !== -1) {
      breadcrumbs = breadcrumbs.slice(0, index + 1);
    }
    
    // Update current view
    switchView('my-drive');
  }


  function toggleDropdown(itemId, event) {
    event.stopPropagation();
    activeDropdown = activeDropdown === itemId ? null : itemId;
  }

  function closeDropdowns() {
    activeDropdown = null;
  }

  function handleDropdownAction(action, item, event) {
    event.stopPropagation();
    activeDropdown = null;
    
    switch(action) {
      case 'download':
        downloadFile(item);
        break;
      case 'rename':
        renameItem(item);
        break;
      case 'share':
        shareItem(item);
        break;
      case 'delete':
        deleteItem(item);
        break;
    }
  }

  function downloadFile(item) {
    const url = `/api/download?id=${item.id}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function renameItem(item) {
    const newName = prompt(`Rename ${item.type}:`, item.name);
    if (newName && newName.trim() && newName !== item.name) {
      // Add rename logic here
      console.log('Rename', item.type, item.id, 'to', newName);
    }
  }

  function shareItem(item) {
    currentShareItem = item;  // Changed from shareItem to currentShareItem
    shareEmail = '';
    sharePermission = 'view';
    shareMessage = '';
    shareExpiry = '';
    shareError = '';
    shareSuccess = '';
    showShareModal = true;
  }

   function closeShareModal() {
    showShareModal = false;
    currentShareItem = null;  // Changed from shareItem to currentShareItem
    shareEmail = '';
    sharePermission = 'view';
    shareMessage = '';
    shareExpiry = '';
    shareError = '';
    shareSuccess = '';
    isSharing = false;
  }

  async function handleShare() {
    if (!shareEmail.trim()) {
      shareError = 'Please enter an email address';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail.trim())) {
      shareError = 'Please enter a valid email address';
      return;
    }

    isSharing = true;
    shareError = '';
    shareSuccess = '';

    try {
      const formData = new FormData();
      formData.append('resource_id', currentShareItem.id);  // Changed from shareItem to currentShareItem
      formData.append('resource_type', currentShareItem.type);  // Changed from shareItem to currentShareItem
      formData.append('shared_with_email', shareEmail.trim());
      formData.append('permission', sharePermission);
      if (shareMessage.trim()) {
        formData.append('message', shareMessage.trim());
      }
      if (shareExpiry) {
        formData.append('expires_at', new Date(shareExpiry).toISOString());
      }

      const response = await fetch('?/shareResource', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.type === 'success') {
        shareSuccess = `Successfully shared "${currentShareItem.name}" with ${shareEmail}`;  // Changed from shareItem to currentShareItem
        // Clear form after short delay
        setTimeout(() => {
          closeShareModal();
        }, 2000);
      } else {
        shareError = result.error || 'Failed to share item';
      }

    } catch (error) {
      console.error('Share error:', error);
      shareError = 'Network error. Please try again.';
    } finally {
      isSharing = false;
    }
  }

  function deleteItem(item) {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      console.log('Delete', item.type, item.id);
    }
  }

  async function handleLogout() {
    try {
      // Call the server logout endpoint
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Clear client-side auth store
        pb.authStore.clear();
        // Redirect to login page
        goto('/login');
      } else {
        throw new Error('Logout request failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear client auth anyway and force redirect
      pb.authStore.clear();
      goto('/login');
    }
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.profile-dropdown-container')) {
      showProfileDropdown = false;
    }
    // Close item dropdowns when clicking outside
    if (!event.target.closest('.relative')) {
      closeDropdowns();
    }
  }

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

    // Update available folders for the form
    updateAvailableFolders();
  }

  // Update current view data
  $: {
    let baseItems = allItems;
    
    // Filter by current folder if we're in a specific folder
    if (currentFolderId && currentView === 'my-drive') {
      baseItems = allItems.filter(item => item.parent_folder === currentFolderId);
    } else if (currentView === 'my-drive') {
      // Show root level items (no parent folder)
      baseItems = allItems.filter(item => !item.parent_folder);
    }
    
    switch (currentView) {
      case 'my-drive':
        currentItems = baseItems;
        currentTitle = breadcrumbs[breadcrumbs.length - 1]?.name || 'My Storage';
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
        currentItems = baseItems;
        currentTitle = 'My Storage';
    }
  }


  // Get recent items (last 4)
  $: recentItems = allItems.slice(0, 4);

  // Filter items based on search
  $: filteredItems = currentItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function updateAvailableFolders() {
    const folders = allItems.filter(item => item.type === 'folder');
    
    if (selectedParentFolderId === null) {
      // Show root level folders
      availableFolders = folders.filter(folder => !folder.parent_folder);
    } else {
      // Show subfolders of the selected parent
      availableFolders = folders.filter(folder => folder.parent_folder === selectedParentFolderId);
    }
  }

  function getFolderIdFromPath(pathParts) {
    let currentFolderId = null;
    const folders = allItems.filter(item => item.type === 'folder');
    
    console.log('Getting folder ID from path parts:', pathParts);
    console.log('Available folders:', folders.map(f => ({ id: f.id, name: f.name, parent: f.parent_folder })));
    
    for (const part of pathParts) {
      const folder = folders.find(f => {
        const nameMatch = f.name === part;
        const parentMatch = f.parent_folder === currentFolderId;
        console.log(`Checking folder "${f.name}" (${f.id}): nameMatch=${nameMatch}, parentMatch=${parentMatch}, parent=${f.parent_folder}, currentParent=${currentFolderId}`);
        return nameMatch && parentMatch;
      });
      
      if (folder) {
        currentFolderId = folder.id;
        console.log(`Found folder "${part}" with ID:`, currentFolderId);
      } else {
        console.log(`Folder "${part}" not found in current path`);
        break;
      }
    }
    
    console.log('Final folder ID:', currentFolderId);
    return currentFolderId;
  }

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
      pdf: '📝',
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
      pb.authStore.loadFromCookie(document.cookie);
      const userId = pb.authStore.model.id;
      const isStarred = favorites.includes(itemId);
      
      console.log('Toggling star for item:', itemId, 'User:', userId, 'Currently starred:', isStarred);
      
      if (isStarred) {
        // Remove from favorites
        try {
          const favorite = await pb.collection('favorites').getFirstListItem(
            `user = "${userId}" && resource_id = "${itemId}" && resource_type = "${resourceType}"`
          );
          await pb.collection('favorites').delete(favorite.id);
          favorites = favorites.filter(id => id !== itemId);
          console.log('Removed from favorites');
        } catch (findError) {
          console.error('Error finding/removing favorite:', findError);
          // If we can't find the favorite record, just remove it from the local array
          favorites = favorites.filter(id => id !== itemId);
        }
      } else {
        // Add to favorites
        await pb.collection('favorites').create({
          user: userId,
          resource_id: itemId,
          resource_type: resourceType
        });
        favorites = [...favorites, itemId];
        console.log('Added to favorites');
      }
      
      // Update the item's starred status in the UI
      allItems = allItems.map(item => 
        item.id === itemId ? { ...item, starred: !item.starred } : item
      );
    } catch (error) {
      console.error('Error toggling star:', error);
      if (error.status === 401 || error.status === 403) {
        alert('Authentication required. Please refresh the page and try again.');
      } else {
        alert('Failed to update favorite. Please try again.');
      }
    }
  }

  function handleItemClick(item) {
    if (item.type === 'folder') {
      navigateToFolder(item);
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
    
    // Reset folder navigation when switching away from My Drive
    if (view !== 'my-drive') {
      currentFolderId = null;
      breadcrumbs = [{ id: null, name: 'My Storage' }];
    }
  }

  function openNewModal() {
    showNewModal = true;
  }

  function closeNewModal() {
    showNewModal = false;
  }

  function openNewForm(type) {
    newItemType = type;
    newItemName = '';
    selectedPath = '/';
    selectedParentFolderId = null; // Reset to root
    showNewForm = true;
    showNewModal = false;
    updateAvailableFolders();
  }

  function closeNewForm() {
    showNewForm = false;
    newItemType = '';
    newItemName = '';
    selectedPath = '/';
    selectedParentFolderId = null;
  }

  function handlePathClick(event, index) {
    if (index === -1) {
      // Clicked on root "/"
      selectedPath = '/';
      selectedParentFolderId = null;
    } else {
      // Clicked on a specific folder in the path
      const pathParts = selectedPath === '/' ? [] : selectedPath.split('/').filter(Boolean);
      const newPathParts = pathParts.slice(0, index + 1);
      selectedPath = newPathParts.length > 0 ? '/' + newPathParts.join('/') + '/' : '/';
      
      // Update the selected parent folder ID
      selectedParentFolderId = newPathParts.length > 0 ? getFolderIdFromPath(newPathParts) : null;
    }
    
    updateAvailableFolders();
  }

  // Enhanced folder selection function for the dropdown
  function selectFolder(folderId, folderName) {
    console.log('Selecting folder:', folderId, folderName);
    
    // Update the selected parent folder ID
    selectedParentFolderId = folderId;
    
    // Update the path display
    const currentPathParts = selectedPath === '/' ? [] : selectedPath.split('/').filter(Boolean);
    const newPath = currentPathParts.length > 0 ? 
      selectedPath + folderName + '/' : 
      '/' + folderName + '/';
    selectedPath = newPath;
    
    console.log('Updated selectedPath:', selectedPath);
    console.log('Updated selectedParentFolderId:', selectedParentFolderId);
    
    // Update available folders for the new location
    updateAvailableFolders();
  }

  async function submitNewItem() {
    // Only check for name if creating a folder
    if (newItemType === 'folder' && !newItemName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    try {
      console.log('Creating item with parent folder:', selectedParentFolderId, 'from path:', selectedPath);

      if (newItemType === 'folder') {
        const formData = new FormData();
        formData.append('name', newItemName.trim());
        
        // Use current folder as parent if no specific parent is selected
        const parentId = selectedParentFolderId || currentFolderId;
        if (parentId) {
          formData.append('parent_folder', parentId);
          console.log('Adding parent_folder to form data:', parentId);
        } else {
          console.log('No parent folder selected - creating in root');
        }

        console.log('Form data entries:', Array.from(formData.entries()));

        const response = await fetch('?/createFolder', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        if (result.type === 'success') {
          console.log('Folder created successfully');
          closeNewForm();
          location.reload();
        } else {
          alert('Failed to create folder: ' + (result.error || 'Unknown error'));
        }
      } else if (newItemType === 'file') {
        // Store the parent folder ID for file upload (use current folder if none selected)
        window.selectedParentFolder = selectedParentFolderId || currentFolderId;
        closeNewForm();
        // Trigger file upload
        fileInput.click();
      }
      
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item: ' + (error.message || 'Network error'));
    }
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
      const failedUploads = [];

      // Determine parent folder more reliably
      const parentFolderId = getTargetFolderId();
      console.log('File upload - Using parent folder:', parentFolderId);

      for (const file of selectedFiles) {
        try {
          console.log(`Uploading file: ${file.name}`);
          
          // Create form data for server action
          const formData = new FormData();
          formData.append('file', file);
          
          if (parentFolderId) {
            formData.append('parent_folder', parentFolderId);
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
              failedUploads.push({ name: file.name, error: result.message || 'Server error' });
            }
          } else {
            const errorText = await response.text();
            console.error(`HTTP error for file "${file.name}":`, response.status, response.statusText);
            failedUploads.push({ name: file.name, error: `HTTP ${response.status}: ${response.statusText}` });
          }

        } catch (fileError) {
          console.error(`Failed to upload file "${file.name}":`, fileError);
          failedUploads.push({ name: file.name, error: fileError.message || 'Unknown error' });
        }

        completedFiles++;
        uploadProgress = (completedFiles / totalFiles) * 100;
      }

      // Handle results
      if (successfulUploads > 0) {
        console.log(`Successfully uploaded ${successfulUploads} out of ${totalFiles} files`);
        
        // Show success message with details
        if (failedUploads.length > 0) {
          const failedNames = failedUploads.map(f => f.name).join(', ');
          alert(`${successfulUploads} files uploaded successfully. Failed: ${failedNames}`);
        }
        
        // Refresh the page to show new files
        await new Promise(resolve => setTimeout(resolve, 500));
        location.reload();
      } else {
        // Show detailed error message
        if (failedUploads.length > 0) {
          const errorDetails = failedUploads.map(f => `${f.name}: ${f.error}`).join('\n');
          alert(`No files were uploaded successfully:\n\n${errorDetails}`);
        } else {
          alert('No files were uploaded successfully. Please try again.');
        }
      }

    } catch (error) {
      console.error('Upload process failed:', error);
      alert('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      uploading = false;
      uploadProgress = 0;
      event.target.value = ''; // Clear the file input
      closeNewForm();
      clearSelectedFolder();
    }
  }

  // Helper function to determine target folder ID
  function getTargetFolderId() {
    // Priority 1: Explicitly selected folder from the form
    if (window.selectedParentFolder) {
      return window.selectedParentFolder;
    }
    
    // Priority 2: Currently selected parent folder ID
    if (selectedParentFolderId) {
      return selectedParentFolderId;
    }
    
    // Priority 3: Current folder from URL parameters
    const currentFolder = $page.url.searchParams.get('folder');
    return currentFolder || null;
  }

  // Helper function to clear folder selection
  function clearSelectedFolder() {
    window.selectedParentFolder = null;
    // Reset form state if needed
    if (showNewForm) {
      // You might want to reset selectedPath here depending on your UX preference
      // selectedPath = '/';
      // selectedParentFolderId = null;
    }
  }

  onMount(() => {
    pb.authStore.loadFromCookie(document.cookie);
    const listener = (e) => {
      if (!e.target.closest('.relative') && !e.target.closest('.profile-dropdown-container')) {
        closeDropdowns();
        showProfileDropdown = false;
      }
    };
    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  });
</script>

<svelte:head>
  <title>HOME - FSS</title>
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
      <div class="relative profile-dropdown-container">
        <button 
          class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center ml-2 font-medium uppercase hover:bg-blue-700 transition-colors"
          on:click={() => showProfileDropdown = !showProfileDropdown}
        >
          {data?.user?.name?.charAt(0) || data?.user?.email?.charAt(0) || '👤'}
        </button>
        
        {#if showProfileDropdown}
          <div class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <!-- User Info Section -->
            <div class="p-4 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium uppercase">
                  {data?.user?.name?.charAt(0) || data?.user?.email?.charAt(0) || '👤'}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 truncate">
                    {data?.user?.name || 'User'}
                  </div>
                  <div class="text-sm text-gray-500 truncate">
                    {data?.user?.email}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Menu Items -->
            <div class="py-2">
              <button 
                class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                on:click={() => {
                  showProfileDropdown = false;
                  goto('/profile'); // adjust this route as needed
                }}
              >
                <span class="text-lg">👤</span>
                <span>Profile</span>
              </button>
              
              <button 
                class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                on:click={() => {
                  showProfileDropdown = false;
                  goto('/settings'); // adjust this route as needed
                }}
              >
                <span class="text-lg">⚙️</span>
                <span>Settings</span>
              </button>
              
              <button 
                class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                on:click={() => {
                  showProfileDropdown = false;
                  // Add help/support functionality
                }}
              >
                <span class="text-lg">❓</span>
                <span>Help & Support</span>
              </button>
              
              <hr class="my-2 border-gray-100">
              
              <button 
                class="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                on:click={handleLogout}
              >
                <span class="text-lg">🚪</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <div class="flex min-h-[calc(100vh-65px)]">
    <!-- Sidebar - Fixed positioning -->
    <aside class="w-64 bg-white border-r border-gray-200 p-4 flex flex-col fixed left-0 top-16 h-[calc(100vh-65px)] overflow-y-auto">
      <button 
        class="flex items-center gap-3 py-3 px-4 mt-4 border border-gray-200 rounded-3xl bg-white text-sm font-medium cursor-pointer mb-6 shadow-sm hover:shadow-md transition-shadow"
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
          My Storge
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

    <!-- Main content area - Adjusted for fixed sidebar -->
    <main class="flex-1 p-6 overflow-y-auto ml-64">
      <!-- New Form - Slides down from top -->
      {#if showNewForm}
        <div class="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-slide-down">
          <h3 class="text-lg font-medium mb-4">
            {newItemType === 'folder' ? 'Create New Folder' : 'Upload Files'}
          </h3>
                  
          <!-- Name Input - Only for folders -->
          {#if newItemType === 'folder'}
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                bind:value={newItemName}
                placeholder="Enter folder name"
                class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          {/if}
          
          <!-- Location Selection with Integrated Dropdown -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        
            <!-- Path Display with Dropdown -->
            <div class="p-2 bg-gray-50 rounded border text-sm text-gray-600">
              <div class="flex items-center flex-wrap">
                <span
                  class="cursor-pointer hover:text-blue-600 hover:underline"
                  on:click={() => handlePathClick(null, -1)}
                >
                  /
                </span>
                {#each selectedPath === '/' ? [] : selectedPath.split('/').filter(Boolean) as part, index}
                  <span
                    class="cursor-pointer hover:text-blue-600 hover:underline"
                    on:click={() => handlePathClick(null, index)}
                  >
                    {part}/
                  </span>
                {/each}
                
                <!-- Dropdown for available folders -->
                {#if availableFolders.length > 0}
                  <select
                    class="ml-2 px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    on:change={(e) => {
                      const selectedFolder = availableFolders.find(f => f.id === e.target.value);
                      if (selectedFolder) {
                        selectFolder(selectedFolder.id, selectedFolder.name);
                      }
                      e.target.value = ''; // Reset dropdown
                    }}
                  >
                    <option value="">Select folder...</option>
                    {#each availableFolders as folder}
                      <option value={folder.id}>📁 {folder.name}</option>
                    {/each}
                  </select>
                {:else}
                  <span class="ml-2 text-xs text-gray-400">(no subfolders)</span>
                {/if}
              </div>
            </div>
          </div>


          
          <!-- Action Buttons -->
          <div class="flex gap-2 justify-end">
            <button
              class="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              on:click={closeNewForm}
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              on:click={submitNewItem}
            >
              {newItemType === 'folder' ? 'Create Folder' : 'Select Files'}
            </button>
          </div>
        </div>
      {/if}

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

      <!-- Breadcrumb Navigation - ADD THIS AFTER UPLOAD PROGRESS SECTION -->
      {#if currentView === 'my-drive' && breadcrumbs.length > 1}
        <div class="mb-6 flex items-center gap-2 text-sm text-gray-600">
          {#each breadcrumbs as breadcrumb, index}
            {#if index === breadcrumbs.length - 1}
              <!-- Current folder - not clickable -->
              <span class="text-gray-900 font-medium">{breadcrumb.name}</span>
            {:else}
              <!-- Clickable breadcrumb -->
              <button 
                class="hover:text-blue-600 hover:underline transition-colors"
                on:click={() => navigateToBreadcrumb(breadcrumb)}
              >
                {breadcrumb.name}
              </button>
              <span class="text-gray-400 mx-1">›</span>
            {/if}
          {/each}
        </div>
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
               <div class="relative group">
                <!-- Dropdown Trigger -->
                <button 
                  class="p-1 bg-transparent border-none text-base cursor-pointer rounded hover:bg-gray-100"
                  on:click={(e) => toggleDropdown(item.id, e)}
                >
                  ⋮
                </button>

                <!-- Dropdown Menu -->
                {#if activeDropdown === item.id}
                  <div 
                    class="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]"
                    on:click|stopPropagation
                  >
                    {#if item.type !== 'folder'}
                      <button 
                        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        on:click={(e) => handleDropdownAction('download', item, e)}
                      >
                        📥 Download
                      </button>
                    {/if}
                    <button 
                      class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                      on:click={(e) => handleDropdownAction('rename', item, e)}
                    >
                      ✏️ Rename
                    </button>
                    <button 
                      class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                      on:click={(e) => handleDropdownAction('share', item, e)}
                    >
                      🔗 Share
                    </button>
                    <button 
                      class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                      on:click={(e) => handleDropdownAction('delete', item, e)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                {/if}
              </div>

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
                  {#if showShareModal && currentShareItem}
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" on:click={closeShareModal}>
              <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all" on:click|stopPropagation>
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span class="text-xl">{getFileIcon(currentShareItem.type)}</span>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">Share "{currentShareItem.name}"</h3>
                      <p class="text-sm text-gray-500">Share this {currentShareItem.type} with others</p>
                    </div>
                  </div>
                  <button 
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    on:click={closeShareModal}
                  >
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <!-- Error/Success Messages -->
                {#if shareError}
                  <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                      </svg>
                      <span class="text-sm text-red-700">{shareError}</span>
                    </div>
                  </div>
                {/if}

                {#if shareSuccess}
                  <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                      </svg>
                      <span class="text-sm text-green-700">{shareSuccess}</span>
                    </div>
                  </div>
                {/if}

                <!-- Share Form -->
                <div class="space-y-4">
                  <!-- Email Input -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <div class="relative">
                      <input
                        type="email"
                        bind:value={shareEmail}
                        placeholder="Enter email address"
                        class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pl-10"
                        class:border-red-300={shareError && shareError.includes('email')}
                      />
                      <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                      </svg>
                    </div>
                  </div>

                  <!-- Permission Level -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Permission level
                    </label>
                    <select
                      bind:value={sharePermission}
                      class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="view">👁️ Can view</option>
                      <option value="edit">✏️ Can edit</option>
                      <option value="comment">💬 Can comment</option>
                    </select>
                  </div>

                  <!-- Optional Message -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Message (optional)
                    </label>
                    <textarea
                      bind:value={shareMessage}
                      placeholder="Add a personal message..."
                      rows="3"
                      class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  <!-- Expiry Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Access expires (optional)
                    </label>
                    <input
                      type="datetime-local"
                      bind:value={shareExpiry}
                      min={new Date().toISOString().slice(0, 16)}
                      class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-3 pt-4">
                    <button
                      type="button"
                      class="flex-1 px-4 py-3 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      on:click={closeShareModal}
                      disabled={isSharing}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      on:click={handleShare}
                      disabled={isSharing || !shareEmail.trim()}
                    >
                      {#if isSharing}
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sharing...
                      {:else}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                        </svg>
                        Share
                      {/if}
                    </button>
                  </div>
                </div>
              </div>
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
          on:click={() => openNewForm('folder')}
        >
          <span class="text-xl">📁</span>
          <span>New folder</span>
        </button>
        <button 
          class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
          on:click={() => openNewForm('file')}
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
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }

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
      margin-left: 0;
      width: 100%;
      padding: 1rem;
    }
    
    .relative.max-w-2xl {
      margin: 0 1rem;
    }
  }
</style>