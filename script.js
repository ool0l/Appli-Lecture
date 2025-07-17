const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancel-btn');
const searchBtn = document.getElementById('search-btn');
const booksContainer = document.getElementById('books-container');
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
    resultCard.className = 'book-card';resultCard.innerHTML = `
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

  book.pageCount = finalPages; // Remplace la valeur venant de l'API
  addBookToList(book);
  closeModal();
});


    resultsDiv.appendChild(resultCard);
  }); selectBtn.
});

function addBookToList(book) {
  const bookCard = document.createElement('div');
  bookCard.className = 'book-card';

  // On met pageCount ou 0 pour éviter NaN
  const totalPages = book.pageCount || 0;

  bookCard.innerHTML = `
    <h3>${book.title || "Titre inconnu"}</h3>
    <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
    <p><strong>Pages totales:</strong> ${totalPages}</p>

    <label>
      Pages lues: 
      <input type="number" class="pages-read" min="0" max="${totalPages}" value="0" style="width:60px;" />
    </label>
    <p>Progression: <span class="progress">0%</span></p>

    ${book.imageLinks?.thumbnail ? `<img src="${book.imageLinks.thumbnail}" alt="Couverture" style="max-height: 150px;">` : ""}
    <button class="delete-book">🗑️ Supprimer</button>
  `;

  // Gestion suppression avec confirmation
  const deleteBtn = bookCard.querySelector('.delete-book');
  deleteBtn.addEventListener('click', () => {
    if (confirm(`Supprimer "${book.title}" de ta liste ?`)) {
      bookCard.remove();
    }
  });

  // Gestion mise à jour du % de lecture
  const pagesReadInput = bookCard.querySelector('.pages-read');
  const progressSpan = bookCard.querySelector('.progress');

  pagesReadInput.addEventListener('input', () => {
    let val = parseInt(pagesReadInput.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > totalPages) val = totalPages;
    pagesReadInput.value = val;
    const percent = totalPages === 0 ? 0 : Math.round((val / totalPages) * 100);
    progressSpan.textContent = `${percent}%`;
  });

  booksContainer.appendChild(bookCard);
}
