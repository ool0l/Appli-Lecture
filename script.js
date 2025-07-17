const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancel-btn');
const searchBtn = document.getElementById('search-btn');
const bookInput = document.getElementById('book-title-input');

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

    const resultCard = document.createElement('div');
    resultCard.className = 'book-card';
    resultCard.innerHTML = `
      ${book.imageLinks?.thumbnail ? `<img src="${book.imageLinks.thumbnail}" alt="Couverture" style="max-height: 100px;">` : ""}
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
      addBookToList(book);
      closeModal();
    });

    resultsDiv.appendChild(resultCard);
  });
});

function addBookToList(book) {
  const bookCard = document.createElement('div');
  bookCard.className = 'book-card';

  const totalPages = book.pageCount || 0;

  bookCard.innerHTML = `
    <h3>${book.title || "Titre inconnu"}</h3>
    <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
    <p><strong>Pages totales:</strong> ${totalPages}</p>

    <label>
      Pages lues: 
      <input type="number" class="pages-read" min="0" max="${totalPages}" value="0" style="width:60px;" />
    </label>

    <div class="progress-bar-outer">
      <div class="progress-bar-inner"></div>
    </div>
    <p>Progression : <span class="progress">0%</span></p>

    <label>
      Note perso (0-10) : 
      <input type="range" class="personal-rating" min="0" max="10" value="0" step="1" />
      <span class="rating-value">0</span>/10
    </label>

    ${book.imageLinks?.thumbnail ? `<img src="${book.imageLinks.thumbnail.replace("http://", "https://")}" alt="Couverture" style="max-height: 150px; display: block; margin-top: 10px;">` : ""}

    <button class="delete-book" style="margin-top: 10px;">🗑️ Supprimer</button>
  `;

  // Bouton suppression
  const deleteBtn = bookCard.querySelector('.delete-book');
  deleteBtn.addEventListener('click', () => {
    if (confirm(`Supprimer "${book.title}" de ta liste ?`)) {
      bookCard.remove();
    }
  });

  // Barre de progression
  const pagesReadInput = bookCard.querySelector('.pages-read');
  const progressSpan = bookCard.querySelector('.progress');
  const progressBar = bookCard.querySelector('.progress-bar-inner');

  pagesReadInput.addEventListener('input', () => {
    let val = parseInt(pagesReadInput.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > totalPages) val = totalPages;
    pagesReadInput.value = val;
    const percent = totalPages === 0 ? 0 : Math.round((val / totalPages) * 100);
    progressSpan.textContent = `${percent}%`;
    progressBar.style.width = percent + '%';

    // Confettis + déplacement automatique
    if (percent === 100 && !bookCard.classList.contains('completed')) {
      bookCard.classList.add('completed');

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        document.getElementById('books-finished').appendChild(bookCard);
      }, 500);
    }
  });

  // Note perso
  const ratingInput = bookCard.querySelector('.personal-rating');
  const ratingValue = bookCard.querySelector('.rating-value');
  ratingInput.addEventListener('input', () => {
    ratingValue.textContent = ratingInput.value;
  });

  document.getElementById('books-current').appendChild(bookCard);
}
