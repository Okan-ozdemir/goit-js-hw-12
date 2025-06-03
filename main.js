import axios from 'axios';
import 'simplelightbox/dist/simple-lightbox.min.css';
import './style.css';

// Pixabay API yapılandırması
const API_KEY = '50661251-9a872d0be11f09c3db9225566';
const BASE_URL = 'https://pixabay.com/api/';
const PER_PAGE = 20;

// DOM elementleri
const form = document.querySelector('.search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');
const loader = document.querySelector('.loader');

// Global değişkenler
let currentPage = 1;
let currentQuery = '';
let totalHits = 0;
let lightbox = null;
let isLoading = false;

// SimpleLightbox başlatma
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

// API'den resim arama fonksiyonu
async function searchImages(query, page) {
  // Yapay gecikme ekle (1.5 saniye)
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

// Galeri öğelerini oluşturma
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

// Yükleme durumunu yönetme
function toggleLoader(show) {
  loader.style.display = show ? 'block' : 'none';
  isLoading = show;
}

// Load More butonunu yönetme
function toggleLoadMoreButton(show) {
  loadMoreBtn.classList.toggle('is-hidden', !show);
}

// Koleksiyon sonu mesajını gösterme
function showEndMessage() {
  const message = document.createElement('p');
  message.classList.add('end-message');
  message.textContent = "We're sorry, but you've reached the end of search results";
  message.style.textAlign = 'center';
  message.style.marginTop = '20px';
  message.style.color = '#666';
  gallery.after(message);
}

// Koleksiyon sonu mesajını temizleme
function clearEndMessage() {
  const existingMessage = document.querySelector('.end-message');
  if (existingMessage) {
    existingMessage.remove();
  }
}

// Düzgün kaydırma işlemi
function smoothScroll() {
  const { height: cardHeight } = document
    .querySelector('.photo-card')
    .getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

// Form gönderme işlemi
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const searchQuery = e.target.elements.searchQuery.value.trim();
  const searchButton = e.target.querySelector('button');
  
  if (!searchQuery || isLoading) return;

  // Yeni arama için sayfa ve galeriyi sıfırla
  currentPage = 1;
  currentQuery = searchQuery;
  gallery.innerHTML = '';
  clearEndMessage();
  toggleLoadMoreButton(false);
  toggleLoader(true);
  
  // Buton yükleme durumunu ayarla
  const originalButtonText = searchButton.textContent;
  searchButton.innerHTML = '<span class="spinner"></span><span>Resimler Yükleniyor...</span>';
  searchButton.disabled = true;
  searchButton.classList.add('loading');

  try {
    const data = await searchImages(searchQuery, currentPage);
    totalHits = data.totalHits;
    
    if (data.hits.length === 0) {
      gallery.innerHTML = '<p class="no-results">Sorry, there are no images matching your search query. Please try again.</p>';
      return;
    }

    gallery.innerHTML = createGalleryMarkup(data.hits);
    initializeLightbox();
    
    // Toplam sayfa sayısını kontrol et
    const totalPages = Math.ceil(totalHits / PER_PAGE);
    toggleLoadMoreButton(currentPage < totalPages);

    // Eğer ilk sayfada tüm sonuçlar gösterildiyse
    if (data.hits.length === totalHits) {
      toggleLoadMoreButton(false);
      showEndMessage();
    }
  } catch (error) {
    gallery.innerHTML = '<p class="error-message">An error occurred while fetching images. Please try again.</p>';
  } finally {
    toggleLoader(false);
    // Buton durumunu sıfırla
    searchButton.innerHTML = originalButtonText;
    searchButton.disabled = false;
    searchButton.classList.remove('loading');
  }
});

// Load More butonu tıklama işlemi
loadMoreBtn.addEventListener('click', async () => {
  if (isLoading) return;
  
  currentPage += 1;
  toggleLoadMoreButton(false);
  toggleLoader(true);

  try {
    const data = await searchImages(currentQuery, currentPage);
    gallery.insertAdjacentHTML('beforeend', createGalleryMarkup(data.hits));
    initializeLightbox();
    
    // Yüklenen toplam resim sayısını kontrol et
    const loadedImages = currentPage * PER_PAGE;
    if (loadedImages >= totalHits) {
      toggleLoadMoreButton(false);
      showEndMessage();
    } else {
      toggleLoadMoreButton(true);
    }

    // Yeni resimler yüklendikten sonra düzgün kaydırma
    smoothScroll();
  } catch (error) {
    const errorMessage = document.createElement('p');
    errorMessage.classList.add('error-message');
    errorMessage.textContent = 'An error occurred while fetching more images. Please try again.';
    gallery.appendChild(errorMessage);
  } finally {
    toggleLoader(false);
  }
}); 