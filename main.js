import axios from 'axios';
import 'simplelightbox/dist/simple-lightbox.min.css';
import './style.css';

// Pixabay API Configuration
const API_KEY = '50661251-9a872d0be11f09c3db9225566';
const BASE_URL = 'https://pixabay.com/api/';
const PER_PAGE = 20;

// DOM Elements
const form = document.querySelector('.search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');
const loader = document.querySelector('.loader');

// Global Variables
let currentPage = 1;
let currentQuery = '';
let totalHits = 0;
let lightbox = null;
let isLoading = false;

// Initialize SimpleLightbox
function initializeLightbox() {
  if (lightbox) {
    lightbox.refresh();
  } else {
    lightbox = new SimpleLightbox('.gallery a', {
      captionsData: 'alt',
      captionDelay: 250,
    });
  }
}

// Search Images from API
async function searchImages(query, page) {
  // Add artificial delay (1.5 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const params = new URLSearchParams({
    key: API_KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page: page,
    per_page: PER_PAGE,
  });

  const response = await axios.get(`${BASE_URL}?${params}`);
  return response.data;
}

// Create Gallery Markup
function createGalleryMarkup(images) {
  return images
    .map(
      ({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => `
      <a href="${largeImageURL}" class="photo-card">
        <img src="${webformatURL}" alt="${tags}" loading="lazy" />
        <div class="info">
          <p class="info-item">
            <b>Likes</b>
            ${likes}
          </p>
          <p class="info-item">
            <b>Views</b>
            ${views}
          </p>
          <p class="info-item">
            <b>Comments</b>
            ${comments}
          </p>
          <p class="info-item">
            <b>Downloads</b>
            ${downloads}
          </p>
        </div>
      </a>
    `
    )
    .join('');
}

// Toggle Loading State
function toggleLoader(show) {
  loader.style.display = show ? 'block' : 'none';
  isLoading = show;
}

// Toggle Load More Button
function toggleLoadMoreButton(show) {
  loadMoreBtn.classList.toggle('is-hidden', !show);
}

// Show End of Collection Message
function showEndMessage() {
  const message = document.createElement('p');
  message.classList.add('end-message');
  message.textContent = "Üzgünüz, arama sonuçlarının sonuna ulaştınız";
  message.style.textAlign = 'center';
  message.style.marginTop = '20px';
  message.style.color = '#666';
  gallery.after(message);
}

// Clear End Message
function clearEndMessage() {
  const existingMessage = document.querySelector('.end-message');
  if (existingMessage) {
    existingMessage.remove();
  }
}

// Smooth Scroll Handler
function smoothScroll() {
  const { height: cardHeight } = document
    .querySelector('.photo-card')
    .getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

// Form Submit Handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const searchQuery = e.target.elements.searchQuery.value.trim();
  const searchButton = e.target.querySelector('button');
  
  if (!searchQuery || isLoading) return;

  // Reset page and gallery for new search
  currentPage = 1;
  currentQuery = searchQuery;
  gallery.innerHTML = '';
  clearEndMessage();
  toggleLoadMoreButton(false);
  toggleLoader(true);

  try {
    const data = await searchImages(searchQuery, currentPage);
    totalHits = data.totalHits;
    
    if (data.hits.length === 0) {
      gallery.innerHTML = '<p class="no-results">Üzgünüz, aramanızla eşleşen bir görsel bulunamadı. Lütfen tekrar deneyin.</p>';
      return;
    }

    gallery.innerHTML = createGalleryMarkup(data.hits);
    initializeLightbox();
    
    // Check total pages
    const totalPages = Math.ceil(totalHits / PER_PAGE);
    toggleLoadMoreButton(currentPage < totalPages);

    // Check if all results shown on first page
    if (data.hits.length === totalHits) {
      toggleLoadMoreButton(false);
      showEndMessage();
    }
  } catch (error) {
    gallery.innerHTML = '<p class="error-message">Görseller yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>';
  } finally {
    toggleLoader(false);
  }
});

// Load More Button Click Handler
loadMoreBtn.addEventListener('click', async () => {
  if (isLoading) return;
  
  currentPage += 1;
  toggleLoadMoreButton(false);
  toggleLoader(true);

  try {
    const data = await searchImages(currentQuery, currentPage);
    gallery.insertAdjacentHTML('beforeend', createGalleryMarkup(data.hits));
    initializeLightbox();
    
    // Check total loaded images
    const loadedImages = currentPage * PER_PAGE;
    if (loadedImages >= totalHits) {
      toggleLoadMoreButton(false);
      showEndMessage();
    } else {
      toggleLoadMoreButton(true);
    }

    // Smooth scroll after loading new images
    smoothScroll();
  } catch (error) {
    const errorMessage = document.createElement('p');
    errorMessage.classList.add('error-message');
    errorMessage.textContent = 'Daha fazla görsel yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
    gallery.appendChild(errorMessage);
  } finally {
    toggleLoader(false);
  }
}); 