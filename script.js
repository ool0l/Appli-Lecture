const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancel-btn');
const searchBtn = document.getElementById('search-btn');
const bookInput = document.getElementById('book-title-input');
const toggleBtn = document.getElementById('theme-toggle');
const icon = toggleBtn.querySelector('.icon');

let resultsDiv = document.getElementById('results');
if (!resultsDiv) {
  resultsDiv = document.createElement('div');
  resultsDiv.id = 'results';
  document.querySelector('.modal-content').appendChild(resultsDiv);
}

addBookBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  closeModal();
});

function closeModal() {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
  bookInput.value = "";
  document.getElementById('book-pages-input').value = "";
  resultsDiv.innerHTML = "";
}

searchBtn.addEventListener('click', async () => {
  const title = bookInput.value.trim();
  if (!title) return;

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=10`);
  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    resultsDiv.innerHTML = "<p>Aucun résultat trouvé.</p>";
    return;
  }

  resultsDiv.innerHTML = "";

  data.items.forEach((item) => {
    const book = item.volumeInfo;
    const thumbnail = book.imageLinks?.thumbnail ? book.imageLinks.thumbnail.replace(/^http:/, 'https:') : null;

    const resultCard = document.createElement('div');
    resultCard.className = 'book-card';
    resultCard.innerHTML = `
      ${thumbnail ? `<img src="${thumbnail}" alt="Couverture" style="max-height: 100px;">` : ""}
      <div class="info">
        <h4>${book.title || "Titre inconnu"}</h4>
        <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
        <p><strong>Pages:</strong> ${book.pageCount || "?"}</p>
      </div>
      <button class="select-book">Ajouter ce livre</button>
    `;

    const selectBtn = resultCard.querySelector('.select-book');
    selectBtn.addEventListener('click', () => {
      const pagesInput = document.getElementById('book-pages-input');
      const manualPages = parseInt(pagesInput.value.trim());
      const finalPages = !isNaN(manualPages) && manualPages > 0 ? manualPages : (book.pageCount || 0);

      book.pageCount = finalPages;
      book.thumbnail = thumbnail;
      addBookToList(book);
      closeModal();
      saveBooks();
    });

    resultsDiv.appendChild(resultCard);
  });
});

function saveBooks() {
  const booksCurrent = [];
  document.querySelectorAll('#books-current .book-card').forEach(card => {
    booksCurrent.push(extractBookData(card));
  });

  const booksFinished = [];
  document.querySelectorAll('#books-finished .book-card').forEach(card => {
    booksFinished.push(extractBookData(card));
  });

  localStorage.setItem('myBooksCurrent', JSON.stringify(booksCurrent));
  localStorage.setItem('myBooksFinished', JSON.stringify(booksFinished));

  updateCharts();
}

function extractBookData(card) {
  const title = card.querySelector('h3')?.textContent || 'Titre inconnu';
  const authorsText = card.querySelector('p')?.textContent || '';
  const authorsMatch = authorsText.match(/Auteur\(s\):\s(.+)/);
  const authors = authorsMatch ? authorsMatch[1].split(', ') : [];

  const tagSpans = card.querySelectorAll('.tag');
  // Retirer le '❌' du texte des tags si présent
  const tags = Array.from(tagSpans).map(el => el.textContent.replace('❌', '').trim());

  return {
    title,
    authors,
    pageCount: parseInt(card.querySelector('p:nth-of-type(2)')?.textContent.replace(/\D/g, '')) || 0,
    pagesRead: parseInt(card.querySelector('.pages-read')?.value) || 0,
    personalRating: parseInt(card.querySelector('.personal-rating')?.value) || 0,
    personalNote: card.querySelector('.personal-note')?.value || "",
    thumbnail: card.querySelector('img')?.src?.replace(/^http:/, 'https:') || null,
    tags
  };
}

function createTagElement(tagText, onDelete) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = tagText;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-tag';
  removeBtn.textContent = '❌';
  removeBtn.title = "Supprimer ce tag";
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // éviter propagation click
    if (confirm(`Supprimer le tag "${tagText}" ?`)) {
      onDelete();
      span.remove();
      saveBooks();
    }
  });

  span.appendChild(removeBtn);
  return span;
}

function addBookToList(book, containerId = 'books-current', isFinished = false) {
  const bookCard = document.createElement('div');
  bookCard.className = 'book-card';

  const totalPages = book.pageCount || 0;
  const pagesRead = book.pagesRead || 0;
  const rating = book.personalRating || 0;
  const tagsArray = book.tags || [];

  bookCard.innerHTML = `
    <h3>${book.title || "Titre inconnu"}</h3>
    <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
    <p><strong>Pages totales:</strong> ${totalPages}</p>

    <label>
      Pages lues: 
      <input type="number" class="pages-read" min="0" max="${totalPages}" value="${pagesRead}" style="width:60px;" ${isFinished ? "disabled" : ""} />
    </label>

    <div class="progress-bar-outer">
      <div class="progress-bar-inner"></div>
    </div>
    <p>Progression : <span class="progress">0%</span></p>

    <label>
      Note perso (0-10) : 
      <input type="range" class="personal-rating" min="0" max="10" value="${rating}" step="1" ${isFinished ? "disabled" : ""} />
      <span class="rating-value">${rating}</span>/10
    </label>

    <label>
      📝 Note perso :
      <textarea class="personal-note" rows="3" placeholder="Ton avis, un résumé, une citation...">${book.personalNote || ""}</textarea>
    </label>

    <div class="book-tags">
      <label>
        🏷️ Tags :
        <input type="text" class="tag-input" placeholder="Tape un tag et appuie sur Entrée" />
      </label>
      <div class="tag-list"></div>
    </div>

    <img src="${book.thumbnail || 'https://dummyimage.com/120x160/cccccc/555555&text=Aucune+image'}" alt="Couverture" style="max-height: 150px; display: block; margin-top: 10px;">

    ${!isFinished ? `<button class="delete-book">🗑️ Supprimer</button>` : ''}
  `;

  // Gestion des tags dynamiques
  const tagInput = bookCard.querySelector('.tag-input');
  const tagList = bookCard.querySelector('.tag-list');
  const currentTags = new Set(tagsArray.map(t => t.toLowerCase()));

  function updateTagList() {
    tagList.innerHTML = '';
    currentTags.forEach(tag => {
      // Affichage tag avec première lettre majuscule
      const displayTag = tag.charAt(0).toUpperCase() + tag.slice(1);
      tagList.appendChild(createTagElement(displayTag, () => {
        currentTags.delete(tag);
        updateTagList();
        saveBooks();
      }));
    });
  }

  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let newTag = tagInput.value.trim();
      if (!newTag) return;
      newTag = newTag.toLowerCase();
      if (!currentTags.has(newTag)) {
        currentTags.add(newTag);
        tagInput.value = '';
        updateTagList();
        saveBooks();
      }
    }
  });

  updateTagList();

  if (!isFinished) {
    const deleteBtn = bookCard.querySelector('.delete-book');
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Supprimer "${book.title}" ?`)) {
        bookCard.remove();
        saveBooks();
      }
    });
  }

  const pagesReadInput = bookCard.querySelector('.pages-read');
  const progressSpan = bookCard.querySelector('.progress');
  const progressBar = bookCard.querySelector('.progress-bar-inner');

  function updateProgress() {
    let val = parseInt(pagesReadInput.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > totalPages) val = totalPages;
    pagesReadInput.value = val;
    const percent = totalPages === 0 ? 0 : Math.round((val / totalPages) * 100);
    progressSpan.textContent = `${percent}%`;
    progressBar.style.width = percent + '%';

    if (!isFinished && percent === 100 && !bookCard.classList.contains('completed')) {
      bookCard.classList.add('completed');

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      setTimeout(() => {
        document.getElementById('books-finished').appendChild(bookCard);
        pagesReadInput.disabled = true;
        ratingInput.disabled = true;
        saveBooks();
      }, 500);
    } else {
      saveBooks();
    }
  }

  pagesReadInput.addEventListener('input', updateProgress);
  updateProgress();

  const ratingInput = bookCard.querySelector('.personal-rating');
  const ratingValue = bookCard.querySelector('.rating-value');
  ratingInput.addEventListener('input', () => {
    ratingValue.textContent = ratingInput.value;
    saveBooks();
  });

  const noteInput = bookCard.querySelector('.personal-note');
  noteInput.addEventListener('input', () => saveBooks());

  document.getElementById(containerId).appendChild(bookCard);
}

function loadBooks() {
  const booksCurrent = JSON.parse(localStorage.getItem('myBooksCurrent') || '[]');
  booksCurrent.forEach(book => addBookToList(book, 'books-current'));
  const booksFinished = JSON.parse(localStorage.getItem('myBooksFinished') || '[]');
  booksFinished.forEach(book => addBookToList(book, 'books-finished', true));
  updateCharts();
}

const searchFinishedInput = document.getElementById('search-finished');
if (searchFinishedInput) {
  searchFinishedInput.addEventListener('input', () => {
    const filter = searchFinishedInput.value.toLowerCase();
    document.querySelectorAll('#books-finished .book-card').forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const authors = card.querySelector('p').textContent.toLowerCase();
      card.style.display = title.includes(filter) || authors.includes(filter) ? '' : 'none';
    });
  });
}

window.addEventListener('load', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    icon.textContent = '☀️';
  }
  loadBooks();
});

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  icon.style.transition = 'transform 0.5s ease';
  icon.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    icon.style.transform = 'rotate(0deg)';
    icon.textContent = isDark ? '☀️' : '🌙';
  }, 500);
});

function updateCharts() {
  const books = JSON.parse(localStorage.getItem('myBooksFinished') || '[]');
  const labels = books.map(b => b.title);
  const pagesData = books.map(b => b.pageCount || 0);
  const ratingsData = books.map(b => b.personalRating || 0);

  if (window.pagesChart && typeof window.pagesChart.destroy === 'function') window.pagesChart.destroy();
  if (window.ratingsChart && typeof window.ratingsChart.destroy === 'function') window.ratingsChart.destroy();

  const ctxPages = document.getElementById('pagesChart').getContext('2d');
  window.pagesChart = new Chart(ctxPages, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: 'Pages lues', data: pagesData, backgroundColor: '#42a5f5' }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Pages lues par livre' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });

  const ctxRatings = document.getElementById('ratingsChart').getContext('2d');
  window.ratingsChart = new Chart(ctxRatings, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Note personnelle',
        data: ratingsData,
        borderColor: '#ff4081',
        backgroundColor: '#f48fb1',
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Notes personnelles des livres lus' }
      },
      scales: {
        y: { min: 0, max: 10, ticks: { stepSize: 1 } }
      }
    }
  });

  const totalPages = pagesData.reduce((acc, val) => acc + val, 0);
  const ratedBooks = ratingsData.filter(r => r > 0);
  const averageRating = ratedBooks.length > 0 ? (ratedBooks.reduce((acc, val) => acc + val, 0) / ratedBooks.length).toFixed(1) : 'N/A';
  const booksReadCount = books.length;
  const longestBook = books.reduce((max, book) => book.pageCount > max.pageCount ? book : max, { pageCount: 0 });
  const bestRatedBook = books.reduce((best, book) => book.personalRating > best.personalRating ? book : best, { personalRating: 0 });

  document.getElementById('totalPages').textContent = `Total de pages lues : ${totalPages}`;
  document.getElementById('averageRating').textContent = `Note moyenne : ${averageRating}`;
  document.getElementById('booksReadCount').textContent = `Livres terminés : ${booksReadCount}`;
  document.getElementById('longestBook').textContent = `📚 Livre le plus long : ${longestBook.title} (${longestBook.pageCount} pages)`;
  document.getElementById('bestRatedBook').textContent = `⭐ Meilleure note : ${bestRatedBook.title} (${bestRatedBook.personalRating}/10)`;
}

document.getElementById('generate-recommendations').addEventListener('click', generateRecommendations);

async function generateRecommendations() {
  const books = JSON.parse(localStorage.getItem('myBooksFinished') || '[]');
  const currentBooks = JSON.parse(localStorage.getItem('myBooksCurrent') || '[]');
  const allBooksTitles = [...books, ...currentBooks].map(b => b.title?.toLowerCase());

  const likedBooks = books.filter(b => b.personalRating >= 7);

  const tags = likedBooks.flatMap(b => b.tags || []);
  const authors = likedBooks.flatMap(b => b.authors || []);

  const commonTags = getMostFrequentMultiple(tags, 2); // jusqu'à 2 tags
  const commonAuthor = getMostFrequent(authors);

  let queryParts = [...commonTags];
  if (commonAuthor) queryParts.push(`inauthor:${commonAuthor}`);
  if (queryParts.length === 0) {
    document.getElementById('recommendation-results').innerHTML = "<p>Aucune donnée suffisante pour recommander un livre.</p>";
    return;
  }

  const query = queryParts.join(' ');
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
  const data = await response.json();

  const resultContainer = document.getElementById('recommendation-results');
  resultContainer.innerHTML = '';

  if (!data.items || data.items.length === 0) {
    resultContainer.innerHTML = "<p>Aucun livre trouvé pour la recommandation.</p>";
    return;
  }

  data.items.forEach(item => {
    const info = item.volumeInfo;
    const title = info.title?.toLowerCase() || '';
    if (allBooksTitles.includes(title)) return; // ❌ éviter les livres déjà lus

    const thumbnail = info.imageLinks?.thumbnail?.replace(/^http:/, 'https:') || '';
    const authors = info.authors || ['Inconnu'];
    const pageCount = info.pageCount || 0;

    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      ${thumbnail ? `<img src="${thumbnail}" alt="Couverture" style="max-height: 100px;">` : ''}
      <h4>${info.title || 'Titre inconnu'}</h4>
      <p><strong>Auteur(s):</strong> ${authors.join(', ')}</p>
      <p><strong>Pages:</strong> ${pageCount}</p>
    `;

    resultContainer.appendChild(card);
  });
}

function getMostFrequent(arr) {
  if (!arr.length) return null;
  const counts = {};
  arr.forEach(x => counts[x] = (counts[x] || 0) + 1);
  return Object.entries(counts).sort((a,b) => b[1] - a[1])[0][0];
}

function getMostFrequentMultiple(arr, maxCount) {
  if (!arr.length) return [];
  const counts = {};
  arr.forEach(x => counts[x] = (counts[x] || 0) + 1);
  return Object.entries(counts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(e => e[0]);
}
