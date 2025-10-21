import { ref, watch } from 'vue';

const CROP_HISTORY_KEY = 'cropHistory';
const MAX_HISTORY_ITEMS = 10; // Limit history to prevent localStorage overflow

const cropHistory = ref([]);

// Load history from localStorage on initialization
const loadCropHistory = () => {
  try {
    const storedHistory = localStorage.getItem(CROP_HISTORY_KEY);
    if (storedHistory) {
      cropHistory.value = JSON.parse(storedHistory);
    }
  } catch (e) {
    console.error("Failed to load crop history from localStorage", e);
  }
};

// Save history to localStorage whenever it changes
watch(cropHistory, (newHistory) => {
  try {
    localStorage.setItem(CROP_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error("Failed to save crop history to localStorage", e);
  }
}, { deep: true });

// Initialize history on first load
loadCropHistory();

export function useCropHistory() {
  const addCrop = (croppedImageSrc, metadata = {}) => {
    // Check for duplicates
    const isDuplicate = cropHistory.value.some(item =>
      item.croppedImageSrc === croppedImageSrc &&
      JSON.stringify(item.metadata) === JSON.stringify(metadata) // Deep compare metadata
    );

    if (isDuplicate) {
      return; // Don't add duplicate
    }

    const newCrop = {
      id: Date.now(), // Simple unique ID
      timestamp: new Date().toISOString(),
      croppedImageSrc,
      metadata,
    };
    cropHistory.value.unshift(newCrop); // Add to the beginning
    if (cropHistory.value.length > MAX_HISTORY_ITEMS) {
      cropHistory.value.pop(); // Remove oldest if over limit
    }
  };

  const removeCrop = (id) => {
    cropHistory.value = cropHistory.value.filter(item => item.id !== id);
  };

  const clearHistory = () => {
    cropHistory.value = [];
  };

  return {
    cropHistory,
    addCrop,
    removeCrop,
    clearHistory,
  };
}
